import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { useTag } from '@/queries/tags'
import { CreateItemModal } from '@/components/organisms/modals/entity/detailed/ItemModal'
import { NotAssignedSection } from '@/components/molecules/entitySections/NotAssigned'
import { TagSection } from '@/components/molecules/entitySections/detailed'
import { ItemsListSection } from '@/components/molecules/entitySections/list'

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
          <div className="bg-background border flex-1 rounded-xl p-4" role="status">
            <span className="sr-only">Loading...</span>
            Loading...
          </div>
        </div>
      </PageLayout>
    )
  }

  if (!tag) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="bg-background border flex-1 rounded-xl p-4" role="alert">
            Tag not found
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
          <EntityPageHeader title={tag.name} entityType="item" onAdd={handleAdd} />
        </div>

        <TagSection
          tag={tag}
          emptyStateComponent={
            <NotAssignedSection title="Tag" message="No tag details available." />
          }
        />

        <ItemsListSection
          items={tag.items}
          emptyStateComponent={
            <NotAssignedSection
              title="Items"
              message="No items are using this tag yet. Add this tag to items to see them here."
            />
          }
        />
      </div>

      <CreateItemModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </PageLayout>
  )
}
