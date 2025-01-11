import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { useContainer } from '@/queries/container'
import { useState } from 'react'
import { CreateModal } from '@/components/organisms/modals/entity/CreateModal'

export const Route = createFileRoute('/_authenticated/containers/$containerId')({
  component: ContainerPage,
  loader: ({ params: { containerId } }) => {
    if (!/^\d+$/.test(containerId)) throw new Error('Invalid container ID')
    return { containerId: parseInt(containerId) }
  },
})

function ContainerPage() {
  const { containerId } = Route.useParams()
  const { data: container, isLoading } = useContainer(parseInt(containerId))
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  if (isLoading) return <div>Loading...</div>
  if (!container) return <div>Container not found</div>

  const handleAdd = () => {
    setIsAddModalOpen(true)
  }

  return (
    <PageLayout>
      <EntityPageHeader title={container.name} entityType="container" onAdd={handleAdd} />
      <CreateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        selectedType="item"
        parentId={containerId}
      />
    </PageLayout>
  )
}
