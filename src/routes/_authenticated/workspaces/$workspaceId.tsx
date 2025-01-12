import { PageLayout } from '@/components/layouts'
import { useWorkspace } from '@/queries/workspace'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/workspaces/$workspaceId')(
  {
    component: WorkspacePage,
    loader: ({ params: { workspaceId } }) => {
      if (!/^\d+$/.test(workspaceId)) throw new Error('Invalid workspace ID')
      return { workspaceId: parseInt(workspaceId) }
    },
  },
)

function WorkspacePage() {
  const { workspaceId } = Route.useParams()
  const { data: workspace, isLoading } = useWorkspace(parseInt(workspaceId))

  if (isLoading) return <div>Loading...</div>
  if (!workspace) return <div>Workspace not found</div>

  return (
    <PageLayout>
      <h1>{workspace.name}</h1>
    </PageLayout>
  )
}
