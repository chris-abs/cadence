import { useState } from 'react'
import {
  Input,
  Label,
  Button,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/entity/Global/components/atoms'
import { Item } from '@/types'
import { UpdateItemData } from '@/schemas/item'
import { Pencil, Trash2, MoreVertical } from 'lucide-react'
import { cn } from '@/entity/Global/lib/utils'
import { DeleteModal } from '@/entity/Global/components/organisms/modals/DeleteModal'
import { TagManagement } from '../../../../../entity/Item/components/molecules/sections/detailed/TagManagement'

interface ItemSectionProps {
  item: Item | null
  emptyStateComponent?: React.ReactNode
  onUpdate?: (data: UpdateItemData) => Promise<void>
  onUpdateTags?: (itemId: number, tagIds: number[]) => Promise<void>
  isUpdating?: boolean
}

export function ItemSection({
  item,
  emptyStateComponent,
  onUpdate,
  onUpdateTags,
  isUpdating,
}: ItemSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<UpdateItemData> | null>(null)

  if (!item?.name) {
    return emptyStateComponent || null
  }

  const handleEdit = () => {
    setFormData({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
    })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFormData(null)
    setIsEditing(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value,
    }))
  }

  const handleTagsChange = async (tagIds: number[]) => {
    if (!onUpdateTags) return
    await onUpdateTags(item.id, tagIds)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData || !onUpdate) return

    await onUpdate({
      id: item.id,
      ...formData,
    })

    setIsEditing(false)
    setFormData(null)
  }

  return (
    <section className="bg-background border rounded-xl p-4" aria-labelledby="item-section-title">
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <h2 id="item-section-title" className="text-lg font-medium">
            Item Details
          </h2>
          {onUpdate && !isEditing ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isEditing ? (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleCancel} disabled={isUpdating}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          ) : null}
        </header>

        <div className="grid grid-cols-2 gap-4" role="group" aria-label="Item information">
          <div className="row-span-4 flex flex-col items-center justify-center">
            <Label className="text-center mb-1.5">Image</Label>
            <div className="w-64 relative">
              <Carousel className="w-full">
                <CarouselContent>
                  <CarouselItem>
                    <div className="p-1">
                      <div className="overflow-hidden rounded-lg border">
                        <img
                          src={item.imgUrl || '/placeholder-item.jpg'}
                          alt={item.name}
                          className="aspect-square w-full object-cover"
                        />
                      </div>
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="hidden" />
                <CarouselNext className="hidden" />
              </Carousel>
              {!isEditing && (
                <div className="mt-1 text-center text-sm text-muted-foreground">
                  {item.imgUrl || 'Placeholder Image'}
                </div>
              )}
            </div>
          </div>

          <form className="space-y-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                name="name"
                value={isEditing ? formData?.name : item.name}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={cn(!isEditing && 'cursor-default focus:outline-none')}
                aria-label="Item name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <Input
                id="item-description"
                name="description"
                value={isEditing ? formData?.description || '' : item.description || ''}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={cn(!isEditing && 'cursor-default focus:outline-none')}
                aria-label="Item description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-quantity">Quantity</Label>
              <Input
                id="item-quantity"
                name="quantity"
                type="number"
                value={isEditing ? formData?.quantity : item.quantity.toString()}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={cn(!isEditing && 'cursor-default focus:outline-none')}
                aria-label="Item quantity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-tags">Tags</Label>
              <TagManagement tags={item.tags} onChange={handleTagsChange} readOnly={!isEditing} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-created">Created</Label>
              <Input
                id="item-created"
                value={new Date(item.createdAt).toLocaleDateString()}
                readOnly
                className="cursor-default focus:outline-none"
                aria-label="Item creation date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-updated">Last Updated</Label>
              <Input
                id="item-updated"
                value={new Date(item.updatedAt).toLocaleDateString()}
                readOnly
                className="cursor-default focus:outline-none"
                aria-label="Item last updated date"
              />
            </div>
          </form>
        </div>
      </div>

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        entityType="item"
        entityId={item.id}
        entityName={item.name}
      />
    </section>
  )
}
