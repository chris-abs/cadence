import { useState } from 'react'

import { EntityPageHeader } from '@/Global/components/molecules'
import { CreateWorkspaceModal } from '@/Workspace/components/organisms/modals'
import { useWorkspaces } from '@/Workspace/queries'
import { WorkspaceList } from './sections'

export function WorkspaceOrganiser() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { data: workspaces, isLoading } = useWorkspaces()

  const handleAdd = () => {
    setIsCreateModalOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <EntityPageHeader title="Workspaces" entityType="workspace" onAdd={handleAdd} />

      <WorkspaceList workspaces={workspaces ?? []} isLoading={isLoading} />

      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}
