import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts'
import { EntityPageHeader } from '@/components/molecules'
import { useContainer } from '@/queries/container'
import { CreateItemModal } from '@/components/organisms/modals/entity/detailed/ItemModal'
import {
  NotAssignedSection,
  ContainerSection,
  ItemsListSection,
} from '@/components/molecules/entitySections'
import { Alert, AlertDescription, AlertTitle } from '@/components/atoms'
import { FolderOpen } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/containers/$containerId')({
  component: ContainerPage,
})

function ContainerPage() {
  const { containerId } = Route.useParams()
  const parsedContainerId = parseInt(containerId)
  const { data: container } = useContainer(parsedContainerId)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  if (!container) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Alert>
            <FolderOpen className="h-4 w-4" />
            <AlertTitle>No Containers have been found...</AlertTitle>
            <AlertDescription>
              You can create Containers in the{' '}
              <Link className="underline" to="/">
                Dashboard
              </Link>{' '}
              and use them to store Items for better organising!
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
