import { useContext } from "react";
import { Can } from "../components/Can";
import { AuthContext } from "../contexts/AuthContext";
import { useCan } from "../hooks/useCan";
import { setupApiClient } from "../services/apiClient";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {
  const { signOut } = useContext(AuthContext)

  const userCanSeeMetrics = useCan({
    roles: ["editor", "administrator"],
  })

  return (
    <div>
      <h1>Dashboard</h1>

      <button onClick={signOut}>Sign Out</button>

      {userCanSeeMetrics && <div>Metrics</div>}
      <Can permissions={["metrics.list"]}>
        <div>Metrics 2</div>
      </Can>
    </div>
  )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const api = setupApiClient(ctx)

  const response = await api.get('me')

  return {
    props: {}
  }
})