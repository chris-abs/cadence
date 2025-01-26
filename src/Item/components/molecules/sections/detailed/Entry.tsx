import { useState } from 'react'
import { Pencil, Trash2, MoreVertical, X, Upload, AlertTriangle } from 'lucide-react'

import {
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
  PlaceholderImage,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
} from '@/Global/components/atoms'
import { H3, Section } from '@/Global/components/molecules'
import { DeleteModal } from '@/Global/components/organisms/modals'
import { cn } from '@/Global/lib/utils'
import { Tag } from '@/Tag/types'
import { useTags } from '@/Tag/queries'
import { Item } from '@/Item/types'
import { UpdateItemData } from '@/Item/schemas'
import { TagManagement } from './TagManagement'

interface ItemEntryProps {
  item: Item | null
  emptyStateComponent?: React.ReactNode
  onUpdate?: (data: UpdateItemData) => Promise<void>
  isUpdating?: boolean
}

export function ItemEntry({ item, emptyStateComponent, onUpdate, isUpdating }: ItemEntryProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [imagesToUpload, setImagesToUpload] = useState<File[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isImageDeleteConfirmOpen, setIsImageDeleteConfirmOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<UpdateItemData> | null>(null)
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const { data: allTags } = useTags()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImagesToUpload(Array.from(e.target.files))
    }
  }

  const handleImageDelete = (imageUrl: string) => {
    if (imagesToDelete.includes(imageUrl)) {
      setImagesToDelete((prev) => prev.filter((url) => url !== imageUrl))
    } else {
      setImagesToDelete((prev) => [...prev, imageUrl])
    }
  }

  if (!item?.name) {
    return emptyStateComponent || null
  }

  const handleEdit = () => {
    setFormData({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      tags: item.tags.map((tag) => tag.id),
    })
    setSelectedTags(item.tags)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFormData(null)
    setSelectedTags([])
    setImagesToDelete([])
    setImagesToUpload([])
    setIsEditing(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value,
    }))
  }

  const handleTagsChange = (tagIds: number[]) => {
    const itemTagEntries: [number, Tag][] = item.tags.map((tag) => [tag.id, tag])
    const allTagEntries: [number, Tag][] = allTags?.map((tag) => [tag.id, tag]) ?? []
    const tagMap = new Map<number, Tag>([...itemTagEntries, ...allTagEntries])

    const updatedTags = tagIds
      .map((id) => tagMap.get(id))
      .filter((tag): tag is Tag => tag !== undefined)

    setSelectedTags(updatedTags)
    setFormData((prev) => ({
      ...prev,
      tags: tagIds,
    }))
  }

  const submitUpdate = async () => {
    if (!formData || !onUpdate) return

    const updateData: UpdateItemData = {
      id: item.id,
      name: formData.name,
      description: formData.description,
      quantity: formData.quantity,
      tags: selectedTags.map((tag) => tag.id),
      containerId: item.containerId,
      images: imagesToUpload,
      imagesToDelete,
    }

    try {
      await onUpdate(updateData)
      setIsEditing(false)
      setFormData(null)
      setSelectedTags([])
      setImagesToUpload([])
      setImagesToDelete([])
      setIsImageDeleteConfirmOpen(false)
    } catch (error) {
      console.error('Failed to update item:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (imagesToDelete.length > 0) {
      setIsImageDeleteConfirmOpen(true)
      return
    }
    await submitUpdate()
  }

  return (
    <Section>
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <H3 id="item-section-title">Item Details</H3>
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
                  {item.images.length === 0 && !isEditing ? (
                    <CarouselItem>
                      <div className="p-1">
                        <div className="overflow-hidden rounded-lg border">
                          <PlaceholderImage />
                        </div>
                      </div>
                    </CarouselItem>
                  ) : (
                    <>
                      {item.images.map((image, index) => (
                        <CarouselItem key={image.id}>
                          <div className="p-1 relative">
                            <div
                              className={cn(
                                'overflow-hidden rounded-lg border',
                                imagesToDelete.includes(image.url) &&
                                  'border-2 border-destructive/50',
                              )}
                            >
                              <img
                                src={image.url}
                                alt={`${item.name} - ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {isEditing && (
                              <button
                                onClick={() => handleImageDelete(image.url)}
                                className={cn(
                                  'absolute top-2 right-2 p-1 rounded-full text-white',
                                  imagesToDelete.includes(image.url)
                                    ? 'bg-destructive/70 hover:bg-destructive'
                                    : 'bg-destructive/90 hover:bg-destructive',
                                )}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </CarouselItem>
                      ))}
                      {isEditing && (
                        <CarouselItem>
                          <div className="p-1">
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="h-6 w-6 mb-2" />
                                <p className="text-sm text-gray-500">Click to upload</p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                              />
                            </label>
                          </div>
                        </CarouselItem>
                      )}
                    </>
                  )}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </div>

          <form className="space-y-2" onSubmit={handleSubmit}>
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
                <TagManagement
                  tags={isEditing ? selectedTags : item.tags}
                  onChange={handleTagsChange}
                  readOnly={!isEditing}
                />
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

      <Dialog open={isImageDeleteConfirmOpen} onOpenChange={setIsImageDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Selected Images
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-muted-foreground">
              This will permanently delete {imagesToDelete.length} image
              {imagesToDelete.length > 1 ? 's' : ''}. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsImageDeleteConfirmOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={submitUpdate} disabled={isUpdating}>
              {isUpdating ? 'Deleting...' : 'Delete Images'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Section>
  )
}
