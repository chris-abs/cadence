import { createFileRoute, Link } from '@tanstack/react-router'
import { Box } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/Global/components/atoms'
import { PageLayout } from '@/Global/layout/PageLayout'
import { WorkspaceDetail } from '@/Workspace/components/organisms/detail'
import { useWorkspace } from '@/Workspace/queries'

export const Route = createFileRoute('/_authenticated/workspaces/$workspaceId')({
  component: WorkspacePage,
})

function WorkspacePage() {
  const { workspaceId } = Route.useParams()
  const parsedWorkspaceId = parseInt(workspaceId)
  const { data: workspace } = useWorkspace(parsedWorkspaceId)

  if (!workspace) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Alert>
            <Box className="h-4 w-4" />
            <AlertTitle>No Workspaces have been found...</AlertTitle>
            <AlertDescription>
              You can create Workspaces in the{' '}
              <Link className="underline" to="/">
                Dashboard
              </Link>{' '}
              and use them to store Containers for better organising!
            </AlertDescription>
          </Alert>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <WorkspaceDetail workspace={workspace} />
      </div>
    </PageLayout>
  )
}
