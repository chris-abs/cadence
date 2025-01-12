import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { CreateTagModal } from '@/components/organisms/modals/entity/detailed/TagModal'
import { useItem } from '@/queries/item'
import { ContainerSection, ItemSection, TagsSection } from '@/components/molecules/entitySections'
import { NotAssignedSection } from '@/components/molecules/entitySections/NotAssigned'

export const Route = createFileRoute('/_authenticated/items/$itemId')({
  component: ItemPage,
})

function ItemPage() {
  const { itemId } = Route.useParams()
  const parsedItemId = parseInt(itemId)
  const { data: item, isLoading } = useItem(parsedItemId)
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

  if (!item) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="bg-background border flex-1 rounded-xl p-4" role="alert">
            Item not found
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
          <EntityPageHeader title={item.name} entityType="tag" onAdd={handleAdd} />
        </div>

        <ItemSection
          item={item}
          emptyStateComponent={
            <NotAssignedSection title="Item" message="No item details available." />
          }
        />

        <ContainerSection
          container={item.container ?? null}
          emptyStateComponent={
            <NotAssignedSection
              title="Container"
              message="No container assigned to this item yet."
            />
          }
        />

        <TagsSection
          tags={item.tags}
          emptyStateComponent={
            <NotAssignedSection title="Tags" message="No tags assigned to this item yet." />
          }
        />
      </div>

      <CreateTagModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </PageLayout>
  )
}
