import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { CreateContainerModal } from '@/Container/components/organisms/ContainerModal'
import { ContainerList } from '@/Container/components/molecules/catalogue/ContainerCatalogue'
import { useContainers } from '@/Container/queries'
import { PageLayout } from '@/Global/layout/PageLayout'
import { EntityPageHeader } from '@/Global/components/molecules'

export const Route = createFileRoute('/_authenticated/containers/')({
  component: ContainersPage,
})

function ContainersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { data: containers, isLoading } = useContainers()

  const handleAdd = () => {
    setIsCreateModalOpen(true)
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col h-full">
        <div className="flex flex-1 flex-col gap-4 p-4 min-h-0">
          <div className="bg-background border rounded-xl">
            <EntityPageHeader title="Containers" entityType="container" onAdd={handleAdd} />
          </div>
          <div className="bg-background border flex-1 rounded-xl">
            <div className="p-4">
              <ContainerList containers={containers ?? []} isLoading={isLoading} />
            </div>
          </div>
        </div>
        <CreateContainerModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </PageLayout>
  )
}
