import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { PageLayout } from '@/Global/layout/PageLayout'
import { EntityPageHeader, Section } from '@/Global/components/molecules'
import { WorkspaceList } from '@/Workspace/components/molecules/catalogue/WorkspaceCatalogue'
import { CreateWorkspaceModal } from '@/Workspace/components/organisms/WorkspaceModal'
import { useWorkspaces } from '@/Workspace/queries'

export const Route = createFileRoute('/_authenticated/workspaces/')({
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
      <div className="flex flex-1 flex-col h-full">
        <div className="flex flex-1 flex-col gap-4 min-h-0 p-4">
          <EntityPageHeader title="Workspaces" entityType="workspace" onAdd={handleAdd} />
          <Section>
            <div className="flex-1">
              <WorkspaceList workspaces={workspaces ?? []} isLoading={isLoading} />
            </div>
          </Section>
        </div>
      </div>
      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </PageLayout>
  )
}
