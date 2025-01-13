import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { useWorkspace } from '@/queries/workspace'
import { CreateContainerModal } from '@/components/organisms/modals/entity/detailed/ContainerModal'
import {
  WorkspaceSection,
  ContainersListSection,
  NotAssignedSection,
} from '@/components/molecules/entitySections'
import { Alert, AlertDescription, AlertTitle } from '@/components/atoms'
import { Box } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/workspaces/$workspaceId')({
  component: WorkspacePage,
})

function WorkspacePage() {
  const { workspaceId } = Route.useParams()
  const parsedWorkspaceId = parseInt(workspaceId)
  const { data: workspace } = useWorkspace(parsedWorkspaceId)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

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

  const handleAdd = () => {
    setIsCreateModalOpen(true)
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="bg-background border rounded-xl">
          <EntityPageHeader title={workspace.name} entityType="container" onAdd={handleAdd} />
        </div>

        <WorkspaceSection
          workspace={workspace}
          emptyStateComponent={
            <NotAssignedSection title="Workspace" message="No workspace details available." />
          }
        />

        <ContainersListSection
          containers={workspace.containers}
          emptyStateComponent={
            <NotAssignedSection
              title="Containers"
              message="No containers in this workspace yet. Create one to get started."
            />
          }
        />
      </div>

      <CreateContainerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </PageLayout>
  )
}
