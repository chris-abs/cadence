import { useState } from 'react'
import { Pencil, Trash2, MoreVertical } from 'lucide-react'

import {
  Input,
  Label,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Global/components/atoms'
import { cn } from '@/Global/lib/utils'
import { DeleteModal } from '@/Global/components/organisms/modals/DeleteModal'
import { Colour, COLOURS } from '@/Global/types/colours'
import { Tag } from '@/Tag/types'
import { UpdateTagData } from '@/Tag/schemas'
import { H3 } from '@/Global/components/molecules'

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
      colour: tag.colour as Colour,
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

  const handleColorSelect = (colour: Colour) => {
    setFormData((prev) => ({
      ...prev,
      colour,
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
    <section
      className={cn(
        'rounded-xl p-4',
        'bg-background border-border border',
        'transition-colors duration-200',
      )}
      aria-labelledby="tag-section-title"
    >
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <H3 id="tag-section-title" className="text-foreground">
            Tag Details
          </H3>
          {onUpdate && !isEditing ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border-border">
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
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={isUpdating}
                className="hover:bg-contrast-accent"
              >
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
            <Label htmlFor="tag-name" className="text-foreground">
              Name
            </Label>
            <Input
              id="tag-name"
              name="name"
              value={isEditing ? formData?.name : tag.name}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={cn(
                'bg-background text-foreground',
                'border-border',
                'placeholder:text-muted-foreground',
                !isEditing && 'cursor-default focus:outline-none',
              )}
              aria-label="Tag name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-description" className="text-foreground">
              Description
            </Label>
            <Input
              id="tag-description"
              name="description"
              value={isEditing ? formData?.description || '' : tag.description || ''}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={cn(
                'bg-background text-foreground',
                'border-border',
                'placeholder:text-muted-foreground',
                !isEditing && 'cursor-default focus:outline-none',
              )}
              aria-label="Tag description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-color" className="text-foreground">
              Colour
            </Label>
            {isEditing ? (
              <Popover>
                <PopoverTrigger asChild>
                  <div
                    className={cn(
                      'flex h-9 w-full rounded-md border',
                      'bg-background text-foreground',
                      'border-border',
                      'px-3 py-1 text-sm shadow-sm cursor-pointer',
                    )}
                  >
                    <div className="flex-1 flex items-center justify-between">
                      <span>{formData?.colour}</span>
                      <div
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: formData?.colour }}
                      />
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-full p-3 bg-background border-border">
                  <div className="flex flex-wrap gap-2">
                    {COLOURS.map((colour) => (
                      <button
                        key={colour}
                        type="button"
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          formData?.colour === colour
                            ? 'border-primary scale-110'
                            : 'border-transparent hover:scale-105',
                        )}
                        style={{ backgroundColor: colour }}
                        onClick={() => handleColorSelect(colour)}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <div
                className={cn(
                  'h-9 px-3 rounded-md border',
                  'bg-background text-foreground',
                  'border-border',
                  'flex items-center justify-between',
                )}
              >
                <span className="text-sm">{tag.colour}</span>
                <div
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: tag.colour }}
                />
              </div>
            )}
          </div>

          {[
            {
              id: 'tag-created',
              label: 'Created',
              value: new Date(tag.createdAt).toLocaleDateString(),
            },
            {
              id: 'tag-updated',
              label: 'Last Updated',
              value: new Date(tag.updatedAt).toLocaleDateString(),
            },
          ].map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id} className="text-foreground">
                {field.label}
              </Label>
              <Input
                id={field.id}
                value={field.value}
                readOnly
                className={cn(
                  'bg-background text-foreground',
                  'border-border',
                  'cursor-default focus:outline-none',
                )}
                aria-label={`Tag ${field.label.toLowerCase()}`}
              />
            </div>
          ))}
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
