import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { useState } from 'react'
import { useWorkspaces } from '@/queries/workspace'
import { CreateWorkspaceModal } from '@/components/organisms/modals/entity/detailed/WorkspaceModal'
import { WorkspaceList } from '@/components/molecules/entityList/WorkspaceList'

export const Route = createFileRoute('/_authenticated/workspaces')({
  component: WorkspacesPage,
})

function WorkspacesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { data: workspaces, isLoading } = useWorkspaces()

  const handleAdd = () => {
    setIsCreateModalOpen(true)
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="bg-background border flex-1 rounded-xl">
          <EntityPageHeader title="Workspaces" entityType="workspace" onAdd={handleAdd} />
        </div>
        <div className="bg-background border flex-1 rounded-xl">
          <div className="p-4">
            <WorkspaceList workspaces={workspaces ?? []} isLoading={isLoading} />
          </div>
        </div>
      </div>
      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </PageLayout>
  )
}
