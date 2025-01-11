import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader, EntityList } from '@/components/molecules'
import { useState } from 'react'
import { useWorkspaces } from '@/queries/workspace'
import { CreateWorkspaceModal } from '@/components/organisms/modals/entity/detailed/WorkspaceModal'

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
      <EntityPageHeader title="Workspaces" entityType="workspace" onAdd={handleAdd} />
      <div className="p-4">
        <EntityList items={workspaces ?? []} type="workspace" isLoading={isLoading} />
      </div>
      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </PageLayout>
  )
}
