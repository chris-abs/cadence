import { Input, Label } from '@/Global/components/atoms'
import { cn } from '@/Global/lib/utils'
import { UpdateItemData } from '@/Storage/Item/schemas'
import { Item } from '@/Storage/Item/types'
import { Tag } from '@/Storage/Tag/types'
import { TagManagement } from '../../organisms/detail/sections'

interface ItemDetailFormProps {
  item: Item
  isEditing: boolean
  formData: Partial<UpdateItemData> | null
  selectedTags: Tag[]
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onTagsChange: (tagIds: number[]) => void
  onSubmit: (e: React.FormEvent) => void
}

export function ItemDetailForm({
  item,
  isEditing,
  formData,
  selectedTags,
  onInputChange,
  onTagsChange,
  onSubmit,
}: ItemDetailFormProps) {
  return (
    <form className="space-y-2" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="item-name">Name</Label>
        <Input
          id="item-name"
          name="name"
          value={isEditing ? formData?.name : item.name}
          onChange={onInputChange}
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
          onChange={onInputChange}
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
          onChange={onInputChange}
          readOnly={!isEditing}
          className={cn(!isEditing && 'cursor-default focus:outline-none')}
          aria-label="Item quantity"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="item-tags">Tags</Label>
        <TagManagement
          tags={isEditing ? selectedTags : item.tags}
          onChange={onTagsChange}
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
  )
}
