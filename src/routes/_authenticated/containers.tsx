import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader, EntityList } from '@/components/molecules'
import { useState } from 'react'
import { useContainers } from '@/queries/container'
import { CreateContainerModal } from '@/components/organisms/modals/entity/detailed/ContainerModal'

export const Route = createFileRoute('/_authenticated/containers')({
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
      <EntityPageHeader title="Containers" entityType="container" onAdd={handleAdd} />
      <div className="p-4">
        <EntityList items={containers ?? []} type="container" isLoading={isLoading} />
      </div>
      <CreateContainerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </PageLayout>
  )
}
