import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { CreateTagModal } from '@/components/organisms/modals/entity/detailed/TagModal'
import { useItem } from '@/queries/item'
import { ContainerSection } from '@/components/molecules/entitySections/Container'
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
          <div className="bg-background border flex-1 rounded-xl p-4">Loading...</div>
        </div>
      </PageLayout>
    )
  }

  if (!item) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="bg-background border flex-1 rounded-xl p-4">Item not found</div>
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

        <div className="bg-background border rounded-xl p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Item Details</h2>
            </div>
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Quantity: {item.quantity}</span>
              <span className="text-sm text-muted-foreground">
                Created: {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {item.container && <ContainerSection container={item.container} />}

        <div className="bg-background border rounded-xl p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Tags</h2>
            </div>
            {item.tags && item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to="/tags/$tagId"
                    params={{ tagId: tag.id.toString() }}
                    className="inline-flex items-center rounded-full px-3 py-1 hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: tag.colour + '20',
                      color: tag.colour,
                    }}
                  >
                    <span className="text-sm font-medium">{tag.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <NotAssignedSection title="tags" message="No Tags assigned to this Item yet." />
            )}
          </div>
        </div>
      </div>

      <CreateTagModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </PageLayout>
  )
}
