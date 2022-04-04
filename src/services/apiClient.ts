import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../contexts/AuthContext";
import { AuthTokenError } from "./errors/AuthTokenError";

let isRefreshing = false
let failedRequestsQueue = []

//Sempre que setamos um novo ApiClient pelo lado do servidor, devemos passar o context do Next
//const api = setupApiClient(ctx)
export function setupApiClient(ctx = undefined) {
  let cookies = parseCookies(ctx)

  const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`
    }
  })

  api.interceptors.response.use(response => {
    return response
  }, (error: AxiosError) => {
    console.log('axiosError', error)
    if (error.response.status === 401) {
      if (error.response.data?.code === 'token.expired') {
        cookies = parseCookies(ctx)

        const { 'nextauth.refreshToken': refreshToken } = cookies
        const originalConfig = error.config

        if (!isRefreshing) {
          isRefreshing = true

          api.post('refresh', { refreshToken }).then(response => {
            const { token } = response.data

            setCookie(ctx, 'nextauth.token', token, {
              maxAge: 30 * 24 * 60 * 60, // 30 days
              path: '/'
            })

            setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
              maxAge: 30 * 24 * 60 * 60, // 30 days
              path: '/'
            })

            api.defaults.headers['Authorization'] = `Bearer ${token}`;

            failedRequestsQueue.forEach(req => {
              req.onSuccess(token)
            })

            failedRequestsQueue = []
          }).catch(error => {
            failedRequestsQueue.forEach(req => {
              req.onFailure(error)
            })

            failedRequestsQueue = []

            if (typeof window !== "undefined") {
              signOut()
            }
          }).finally(() => {
            isRefreshing = false
          })
        }

        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            onSuccess: (token: string) => {
              originalConfig.headers['Authorization'] = `Bearer ${token}`;

              resolve(api(originalConfig))
            },
            onFailure: (err: AxiosError) => {
              reject(err)
            }
          })
        })
      } else {
        if (typeof window !== "undefined") {
          signOut()
        } else {
          return Promise.reject(new AuthTokenError())
        }
      }
    }

    return Promise.reject(error)
  })

  return api
}