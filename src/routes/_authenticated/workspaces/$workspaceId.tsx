import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { useWorkspace } from '@/queries/workspace'
import { CreateContainerModal } from '@/components/organisms/modals/entity/detailed/ContainerModal'
import { WorkspaceSection } from '@/components/molecules/entitySections/detailed'
import { NotAssignedSection } from '@/components/molecules/entitySections/NotAssigned'
import { ContainersListSection } from '@/components/molecules/entitySections/list'

export const Route = createFileRoute('/_authenticated/workspaces/$workspaceId')({
  component: WorkspacePage,
})

function WorkspacePage() {
  const { workspaceId } = Route.useParams()
  const parsedWorkspaceId = parseInt(workspaceId)
  const { data: workspace, isLoading } = useWorkspace(parsedWorkspaceId)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="bg-background border flex-1 rounded-xl p-4" role="status">
            <span className="sr-only">Loading...</span>
            Loading...
          </div>
        </div>
      </PageLayout>
    )
  }

  if (!workspace) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="bg-background border flex-1 rounded-xl p-4" role="alert">
            Workspace not found
          </div>
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
