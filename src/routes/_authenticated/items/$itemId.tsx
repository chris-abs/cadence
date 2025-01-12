import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { PageLayout } from '@/components/layouts'
import { Label, Input, Button } from '@/components/atoms'
import { EntityPageHeader } from '@/components/molecules'
import { CreateTagModal } from '@/components/organisms/modals/entity/detailed/TagModal'
import { useItem } from '@/queries/item'

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

        <div className="bg-background border rounded-xl p-4">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Container</h2>
            </div>

            {item.container?.name ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="row-span-4 flex flex-col items-center justify-center">
                    <Label className="text-center mb-1.5">QR Code</Label>
                    <div className="w-44 h-44 border rounded-lg p-3 bg-white flex items-center justify-center">
                      <img
                        src={item.container.qrCodeImage}
                        alt="Container QR Code"
                        className="w-full h-full"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground mt-2 font-mono">
                      {item.container.qrCode}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={item.container.name} readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="number">Container Number</Label>
                    <Input
                      id="number"
                      value={item.container.number ? `#${item.container.number}` : ''}
                      readOnly
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={item.container.location || ''} readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="created">Created</Label>
                    <Input
                      id="created"
                      value={new Date(item.container.createdAt).toLocaleDateString()}
                      readOnly
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="secondary" asChild className="gap-2">
                    <Link
                      to="/containers/$containerId"
                      params={{ containerId: item.container.id.toString() }}
                    >
                      View Container Details
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">
                  This item is not assigned to any container.
                </p>
              </div>
            )}
          </div>
        </div>

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
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">No tags assigned to this item yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateTagModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </PageLayout>
  )
}
