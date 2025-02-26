import { useState } from 'react'
import { Pencil, Trash2, MoreVertical } from 'lucide-react'

import {
  Label,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/Global/components/atoms'
import { Section } from '@/Global/components/molecules'
import { DeleteModal } from '@/Storage/Collection/components/organisms/modals'
import { Tag } from '@/Storage/Tag/types'
import { useTags } from '@/Storage/Tag/queries'
import { Item } from '@/Storage/Item/types'
import { UpdateItemData } from '@/Storage/Item/schemas'
import { ItemDetailForm } from '../../../molecules/forms'
import { ImageDeleteModal } from '../../modal'
import { ItemDetailsCarousel } from './ItemDetailsCarousel'

interface ItemDetailsFormData extends Partial<UpdateItemData> {
  images?: File[]
  imagesToDelete?: string[]
}

interface ItemDetailsSectionProps {
  item: Item | null
  emptyStateComponent?: React.ReactNode
  onUpdate?: (data: UpdateItemData) => Promise<void>
  isUpdating: boolean
}

export function ItemDetailsSection({
  item,
  emptyStateComponent,
  onUpdate,
  isUpdating,
}: ItemDetailsSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isImageDeleteConfirmOpen, setIsImageDeleteConfirmOpen] = useState(false)
  const [formData, setFormData] = useState<ItemDetailsFormData | null>(null)
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const { data: allTags } = useTags()

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

  const handleImagesChange = (images: File[], imagesToDelete: string[]) => {
    setFormData((prev) => ({
      ...prev,
      images,
      imagesToDelete,
    }))

    if (imagesToDelete.length > 0) {
      setIsImageDeleteConfirmOpen(true)
    }
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
      images: formData.images || [],
      imagesToDelete: formData.imagesToDelete || [],
    }

    try {
      await onUpdate(updateData)
      handleCancel()
      setIsImageDeleteConfirmOpen(false)
    } catch (error) {
      console.error('Failed to update item:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData?.imagesToDelete && formData.imagesToDelete.length > 0) {
      setIsImageDeleteConfirmOpen(true)
      return
    }
    await submitUpdate()
  }

  return (
    <Section>
      <Card className="h-fit">
        <CardHeader>
          <div className="flex justify-between items-center flex-shrink-0">
            <div>
              <CardTitle>Item Details</CardTitle>
              {item.description && <CardDescription>{item.description}</CardDescription>}
            </div>
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4" role="group" aria-label="Item information">
            <div className="row-span-4 flex flex-col items-center justify-center">
              <Label className="text-center mb-1.5">Image</Label>
              <ItemDetailsCarousel
                item={item}
                isEditing={isEditing}
                onImagesChange={handleImagesChange}
              />
            </div>

            <ItemDetailForm
              item={item}
              isEditing={isEditing}
              formData={formData}
              selectedTags={selectedTags}
              onInputChange={handleInputChange}
              onTagsChange={handleTagsChange}
              onSubmit={handleSubmit}
            />
          </div>

          <DeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            entityType="item"
            entityId={item.id}
            entityName={item.name}
          />

          <ImageDeleteModal
            isOpen={isImageDeleteConfirmOpen}
            onClose={() => setIsImageDeleteConfirmOpen(false)}
            count={formData?.imagesToDelete?.length || 0}
            onConfirm={submitUpdate}
            isDeleting={isUpdating}
          />
        </CardContent>
      </Card>
    </Section>
  )
}
