import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { useContainer } from '@/queries/container'
import { useState } from 'react'
import { CreateModal } from '@/components/organisms/modals/entity/CreateModal'

export const Route = createFileRoute('/_authenticated/containers/$containerId')(
  {
    component: ContainerPage,
    loader: ({ params: { containerId } }) => {
      console.log('Route loader called with containerId:', containerId)
      if (!/^\d+$/.test(containerId)) throw new Error('Invalid container ID')
      return { containerId: parseInt(containerId) }
    },
  },
)

function ContainerPage() {
  console.log('ContainerPage component rendered')
  const { containerId } = Route.useParams()
  console.log('ContainerId from params:', containerId)

  const { data: container, isLoading } = useContainer(parseInt(containerId))
  console.log('Container data:', container, 'isLoading:', isLoading)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  if (isLoading) {
    console.log('Showing loading state')
    return <div>Loading...</div>
  }

  if (!container) {
    console.log('No container data found')
    return <div>Container not found</div>
  }

  const handleAdd = () => {
    setIsAddModalOpen(true)
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="bg-background border flex-1 rounded-xl">
          <EntityPageHeader
            title={container.name}
            entityType="container"
            onAdd={handleAdd}
          />
        </div>
        <div className="bg-background border flex-1 rounded-xl">
          <div className="p-4">
            <pre>{JSON.stringify(container, null, 2)}</pre>
          </div>
        </div>
      </div>
      <CreateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        selectedType="item"
        parentId={containerId}
      />
    </PageLayout>
  )
}
