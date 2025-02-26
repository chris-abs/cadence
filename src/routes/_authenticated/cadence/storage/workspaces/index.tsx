import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { PageLayout } from '@/Global/layout/PageLayout'
import { SearchEntityHeader } from '@/Global/components/molecules/headers'
import { CreateWorkspaceModal } from '@/Storage/Workspace/components/organisms/modals'
import { WorkspaceArchive } from '@/Storage/Workspace/components/organisms/archive'

export const Route = createFileRoute('/_authenticated/workspaces/')({
  component: WorkspacesPage,
})

function WorkspacesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleAdd = () => {
    setIsCreateModalOpen(true)
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col h-full">
        <div className="flex flex-1 flex-col gap-4 min-h-0 p-4">
          <SearchEntityHeader
            title="Workspaces"
            entityType="workspace"
            addEntity="workspace"
            onAdd={handleAdd}
            searchValue={searchQuery}
            onSearch={setSearchQuery}
          />
          <WorkspaceArchive searchQuery={searchQuery} />
        </div>
      </div>
      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </PageLayout>
  )
}
