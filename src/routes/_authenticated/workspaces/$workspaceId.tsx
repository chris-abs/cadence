import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { useWorkspace } from '@/queries/workspace'
import { useState } from 'react'
import { CreateContainerModal } from '@/components/organisms/modals/entity/detailed/ContainerModal'
import { ContainerList } from '@/components/molecules/entityList/ContainerList'

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
          <div className="bg-background border flex-1 rounded-xl p-4">Loading...</div>
        </div>
      </PageLayout>
    )
  }

  if (!workspace) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="bg-background border flex-1 rounded-xl p-4">Workspace not found</div>
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

        <div className="bg-background border rounded-xl p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Workspace Details</h2>
            </div>
            {workspace.description && (
              <p className="text-sm text-muted-foreground">{workspace.description}</p>
            )}
            <div className="text-sm text-muted-foreground">
              Created: {new Date(workspace.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="bg-background border rounded-xl p-4">
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Containers in Workspace</h2>
            {workspace.containers && workspace.containers.length > 0 ? (
              <ContainerList containers={workspace.containers} isLoading={false} />
            ) : (
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">
                  No containers in this workspace yet. Create one to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateContainerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </PageLayout>
  )
}
