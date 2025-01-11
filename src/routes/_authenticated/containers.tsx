import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { useState } from 'react'
import { CreateContainerModal } from '@/components/organisms/modals/entity/detailed/ContainerModal'

export const Route = createFileRoute('/_authenticated/containers')({
  component: ContainersPage,
})

function ContainersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleAdd = () => {
    setIsCreateModalOpen(true)
  }

  return (
    <PageLayout>
      <EntityPageHeader title="Containers" entityType="container" onAdd={handleAdd} />
      <CreateContainerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </PageLayout>
  )
}
