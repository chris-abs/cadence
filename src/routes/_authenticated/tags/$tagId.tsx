import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { useTag } from '@/queries/tags'
import { CreateItemModal } from '@/components/organisms/modals/entity/detailed/ItemModal'
import {
  TagSection,
  ItemsListSection,
  NotAssignedSection,
} from '@/components/molecules/entitySections'
import { Alert, AlertDescription, AlertTitle } from '@/components/atoms'
import { Tags } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/tags/$tagId')({
  component: TagPage,
})

function TagPage() {
  const { tagId } = Route.useParams()
  const parsedTagId = parseInt(tagId)
  const { data: tag } = useTag(parsedTagId)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  if (!tag) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Alert>
            <Tags className="h-4 w-4" />
            <AlertTitle>No Tags have been found...</AlertTitle>
            <AlertDescription>
              You can create tags in the{' '}
              <Link className="underline" to="/">
                Dashboard
              </Link>{' '}
              and add them to Items for better organising!
            </AlertDescription>
          </Alert>
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
