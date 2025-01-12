import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { useContainer } from '@/queries/container'
import { useState } from 'react'
import { CreateItemModal } from '@/components/organisms/modals/entity/detailed/ItemModal'
import { ItemList } from '@/components/molecules/entityList/ItemList'

export const Route = createFileRoute('/_authenticated/containers/$containerId')({
  component: ContainerPage,
})

function ContainerPage() {
  const { containerId } = Route.useParams()
  const parsedContainerId = parseInt(containerId)
  const { data: container, isLoading } = useContainer(parsedContainerId)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="bg-background border flex-1 rounded-xl p-4">Loading...</div>
        </div>
      </PageLayout>
    )
  }

  if (!container) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="bg-background border flex-1 rounded-xl p-4">Container not found</div>
        </div>
      </PageLayout>
    )
  }

  const handleAdd = () => {
    setIsCreateModalOpen(true)
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="bg-background border rounded-xl">
          <EntityPageHeader title={container.name} entityType="item" onAdd={handleAdd} />
        </div>

        <div className="bg-background border rounded-xl p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Container Details</h2>
            </div>
            {container.description && (
              <p className="text-sm text-muted-foreground">{container.description}</p>
            )}
            {container.location && (
              <div className="text-sm text-muted-foreground">Location: {container.location}</div>
            )}
            <div className="text-sm text-muted-foreground">
              Created: {new Date(container.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="bg-background border rounded-xl p-4">
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Items in Container</h2>
            <ItemList items={container.items || []} isLoading={false} />
          </div>
        </div>
      </div>

      <CreateItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        containerId={parsedContainerId}
      />
    </PageLayout>
  )
}
