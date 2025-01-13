import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { useItem } from '@/queries/item'
import { CreateTagModal } from '@/components/organisms/modals/entity/detailed/TagModal'
import {
  ContainerSection,
  ItemSection,
  TagsListSection,
  NotAssignedSection,
} from '@/components/molecules/entitySections'
import { Alert, AlertDescription, AlertTitle } from '@/components/atoms'
import { Package } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/items/$itemId')({
  component: ItemPage,
})

function ItemPage() {
  const { itemId } = Route.useParams()
  const parsedItemId = parseInt(itemId)
  const { data: item } = useItem(parsedItemId)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  if (!item) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Alert>
            <Package className="h-4 w-4" />
            <AlertTitle>No Items have been found...</AlertTitle>
            <AlertDescription>
              You can create Items in the{' '}
              <Link className="underline" to="/">
                Dashboard
              </Link>{' '}
              and store them in Containers for better organising!
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
          <EntityPageHeader title={item.name} entityType="tag" onAdd={handleAdd} />
        </div>

        <ItemSection
          item={item}
          emptyStateComponent={
            <NotAssignedSection title="Item" message="No item details available." />
          }
        />

        <ContainerSection
          container={item.container || null}
          emptyStateComponent={
            <NotAssignedSection
              title="Container"
              message="No container assigned to this item yet."
            />
          }
        />

        <TagsListSection
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
