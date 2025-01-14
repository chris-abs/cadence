import { useState } from 'react'
import { Pencil, Trash2, MoreVertical } from 'lucide-react'
import {
  Input,
  Label,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms'
import { Tag } from '@/types'
import { UpdateTagData } from '@/schemas/tag'
import { cn } from '@/lib/utils'
import { DeleteModal } from '@/components/organisms/modals/entity/DeleteModal'

interface TagSectionProps {
  tag: Tag | null
  emptyStateComponent?: React.ReactNode
  onUpdate?: (data: UpdateTagData) => Promise<void>
  isUpdating?: boolean
}

export function TagSection({ tag, emptyStateComponent, onUpdate, isUpdating }: TagSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<UpdateTagData> | null>(null)

  if (!tag?.name) {
    return emptyStateComponent || null
  }

  const handleEdit = () => {
    setFormData({
      id: tag.id,
      name: tag.name,
      description: tag.description,
      colour: tag.colour,
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
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData || !onUpdate) return

    await onUpdate({
      id: tag.id,
      ...formData,
    })

    setIsEditing(false)
    setFormData(null)
  }

  return (
    <section className="bg-background border rounded-xl p-4" aria-labelledby="tag-section-title">
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <h2 id="tag-section-title" className="text-lg font-medium">
            Tag Details
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

        <form className="space-y-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="tag-name">Name</Label>
            <Input
              id="tag-name"
              name="name"
              value={isEditing ? formData?.name : tag.name}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={cn(!isEditing && 'cursor-default focus:outline-none')}
              aria-label="Tag name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-description">Description</Label>
            <Input
              id="tag-description"
              name="description"
              value={isEditing ? formData?.description || '' : tag.description || ''}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={cn(!isEditing && 'cursor-default focus:outline-none')}
              aria-label="Tag description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-color">Color</Label>
            {isEditing ? (
              <Input
                id="tag-color"
                name="colour"
                type="color"
                value={formData?.colour || tag.colour}
                onChange={handleInputChange}
                className="h-9"
                aria-label="Tag color"
              />
            ) : (
              <div
                className="h-9 px-3 rounded-md border flex items-center"
                style={{
                  backgroundColor: tag.colour + '20',
                  color: tag.colour,
                  borderColor: tag.colour,
                }}
              >
                <span className="text-sm font-medium">{tag.colour}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-created">Created</Label>
            <Input
              id="tag-created"
              value={new Date(tag.createdAt).toLocaleDateString()}
              readOnly
              className="cursor-default focus:outline-none"
              aria-label="Tag creation date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-updated">Last Updated</Label>
            <Input
              id="tag-updated"
              value={new Date(tag.updatedAt).toLocaleDateString()}
              readOnly
              className="cursor-default focus:outline-none"
              aria-label="Tag last updated date"
            />
          </div>
        </form>
      </div>

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        entityType="tag"
        entityId={tag.id}
        entityName={tag.name}
      />
    </section>
  )
}
