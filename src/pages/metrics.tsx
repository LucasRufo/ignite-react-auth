import { setupApiClient } from "../services/apiClient";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {
  return (
    <div>
      <h1>Metrics</h1>
    </div>
  )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const api = setupApiClient(ctx)
  const response = await api.get('me')

  return {
    props: {}
  }
}, {
  permissions: ["metrics.list"],
  roles: ["editor", "administrator"]
})