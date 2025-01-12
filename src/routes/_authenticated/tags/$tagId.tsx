import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { useTag } from '@/queries/tags'
import { ItemList } from '@/components/molecules/entityList/ItemList'
import { CreateItemModal } from '@/components/organisms/modals/entity/detailed/ItemModal'

export const Route = createFileRoute('/_authenticated/tags/$tagId')({
  component: TagPage,
})

function TagPage() {
  const { tagId } = Route.useParams()
  const parsedTagId = parseInt(tagId)
  const { data: tag, isLoading } = useTag(parsedTagId)
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

  if (!tag) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="bg-background border flex-1 rounded-xl p-4">Tag not found</div>
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
          <EntityPageHeader title={tag.name} entityType="item" onAdd={handleAdd} />
        </div>

        <div className="bg-background border rounded-xl p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Tag Details</h2>
            </div>
            {tag.description && <p className="text-sm text-muted-foreground">{tag.description}</p>}
            <div className="flex items-center gap-4">
              <div
                className="inline-flex items-center rounded-full px-3 py-1"
                style={{
                  backgroundColor: tag.colour + '20',
                  color: tag.colour,
                }}
              >
                <span className="text-sm font-medium">Color Sample</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Created: {new Date(tag.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-background border rounded-xl p-4">
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Items with this Tag</h2>
            {tag.items && tag.items.length > 0 ? (
              <ItemList items={tag.items} isLoading={false} />
            ) : (
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">
                  No items are using this tag yet. Add this tag to items to see them here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateItemModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </PageLayout>
  )
}
