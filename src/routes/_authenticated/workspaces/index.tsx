import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { PageLayout } from '@/Global/layout/PageLayout'
import { Section } from '@/Global/components/molecules'
import { EntityHeader } from '@/Global/components/molecules/headers'
import { useWorkspaces } from '@/Workspace/queries'
import { CreateWorkspaceModal } from '@/Workspace/components/organisms/modals'
import { WorkspaceCatalogue } from '@/Workspace/components/organisms/organiser/sections'

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
          <EntityHeader title="Workspaces" entityType="workspace" onAdd={handleAdd} />
          <Section>
            <div className="flex-1">
              <WorkspaceCatalogue workspaces={workspaces ?? []} isLoading={isLoading} />
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
