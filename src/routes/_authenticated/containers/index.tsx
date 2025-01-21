import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { CreateContainerModal } from '@/Container/components/organisms/ContainerModal'
import { useContainers } from '@/Container/queries'
import { useWorkspaces } from '@/Workspace/queries'
import { PageLayout } from '@/Global/layout/PageLayout'
import { EntityPageHeader, Section } from '@/Global/components/molecules'
import { ContainerOrganiser } from '@/Item/components/molecules/organiser/ContainerOrganiser'

export const Route = createFileRoute('/_authenticated/containers/')({
  component: ContainersPage,
})

function ContainersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { data: containers, isLoading: containersLoading } = useContainers()
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces()

  const isLoading = containersLoading || workspacesLoading

  const handleAdd = () => {
    setIsCreateModalOpen(true)
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col h-full">
        <div className="flex flex-1 flex-col gap-4 p-4 min-h-0">
          <EntityPageHeader title="Organize Containers" entityType="container" onAdd={handleAdd} />
          <Section className="flex-1">
            {!isLoading && (
              <ContainerOrganiser containers={containers ?? []} workspaces={workspaces ?? []} />
            )}
          </Section>
        </div>

        <CreateContainerModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </PageLayout>
  )
}
