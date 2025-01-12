import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { useContainer } from '@/queries/container'
import { CreateItemModal } from '@/components/organisms/modals/entity/detailed/ItemModal'
import { NotAssignedSection } from '@/components/molecules/entitySections/NotAssigned'
import { ContainerSection } from '@/components/molecules/entitySections/detailed'
import { ItemsListSection } from '@/components/molecules/entitySections/list'

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
          <div className="bg-background border flex-1 rounded-xl p-4" role="status">
            <span className="sr-only">Loading...</span>
            Loading...
          </div>
        </div>
      </PageLayout>
    )
  }

  if (!container) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="bg-background border flex-1 rounded-xl p-4" role="alert">
            Container not found
          </div>
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

        <ContainerSection
          container={container || null}
          emptyStateComponent={
            <NotAssignedSection title="Container" message="No container details available." />
          }
        />

        <ItemsListSection
          items={container.items || []}
          emptyStateComponent={
            <NotAssignedSection
              title="Items"
              message="No items in this container yet. Add items to get started."
            />
          }
        />
      </div>

      <CreateItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        containerId={parsedContainerId}
      />
    </PageLayout>
  )
}
