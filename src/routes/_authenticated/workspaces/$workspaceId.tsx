import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Box } from 'lucide-react'
import { toast } from 'sonner'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { useWorkspace, useUpdateWorkspace } from '@/queries/workspace'
import { CreateContainerModal } from '@/components/organisms/modals/entity/detailed/ContainerModal'
import {
  WorkspaceSection,
  ContainersListSection,
  NotAssignedSection,
} from '@/components/molecules/entitySections'
import { Alert, AlertDescription, AlertTitle } from '@/components/atoms'
import type { UpdateWorkspaceData } from '@/schemas/workspace'

export const Route = createFileRoute('/_authenticated/workspaces/$workspaceId')({
  component: WorkspacePage,
})

function WorkspacePage() {
  const { workspaceId } = Route.useParams()
  const parsedWorkspaceId = parseInt(workspaceId)
  const { data: workspace } = useWorkspace(parsedWorkspaceId)
  const updateWorkspace = useUpdateWorkspace()
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

  const handleUpdateWorkspace = async (data: UpdateWorkspaceData) => {
    try {
      await updateWorkspace.mutateAsync(data)
      toast('Workspace updated', {
        description: `${data.name || workspace.name} has been updated successfully`,
      })
    } catch (err) {
      toast('Error', {
        description: 'Failed to update workspace',
        duration: 3000,
      })
      throw err
    }
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="bg-background border rounded-xl">
          <EntityPageHeader title={workspace.name} entityType="container" onAdd={handleAdd} />
        </div>

        <WorkspaceSection
          workspace={workspace}
          onUpdate={handleUpdateWorkspace}
          isUpdating={updateWorkspace.isPending}
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
