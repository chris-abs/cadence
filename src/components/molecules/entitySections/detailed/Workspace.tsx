// components/molecules/entitySections/detailed/Workspace.tsx
import { useState } from 'react'
import {
  Input,
  Label,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms'
import { Workspace } from '@/types'
import { UpdateWorkspaceData } from '@/schemas/workspace'
import { Pencil, Trash2, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DeleteModal } from '@/components/organisms/modals/entity/DeleteModal'

interface WorkspaceSectionProps {
  workspace: Workspace | null
  emptyStateComponent?: React.ReactNode
  onUpdate?: (data: UpdateWorkspaceData) => Promise<void>
  isUpdating?: boolean
}

export function WorkspaceSection({
  workspace,
  emptyStateComponent,
  onUpdate,
  isUpdating,
}: WorkspaceSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<UpdateWorkspaceData> | null>(null)

  if (!workspace?.name) {
    return emptyStateComponent || null
  }

  const handleEdit = () => {
    setFormData({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
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
      id: workspace.id,
      ...formData,
    })

    setIsEditing(false)
    setFormData(null)
  }

  return (
    <section
      className="bg-background border rounded-xl p-4"
      aria-labelledby="workspace-section-title"
    >
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <h2 id="workspace-section-title" className="text-lg font-medium">
            Workspace Details
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
            <Label htmlFor="workspace-name">Name</Label>
            <Input
              id="workspace-name"
              name="name"
              value={isEditing ? formData?.name : workspace.name}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={cn(!isEditing && 'cursor-default focus:outline-none')}
              aria-label="Workspace name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-description">Description</Label>
            <Input
              id="workspace-description"
              name="description"
              value={isEditing ? formData?.description || '' : workspace.description || ''}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={cn(!isEditing && 'cursor-default focus:outline-none')}
              aria-label="Workspace description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-created">Created</Label>
            <Input
              id="workspace-created"
              value={new Date(workspace.createdAt).toLocaleDateString()}
              readOnly
              className="cursor-default focus:outline-none"
              aria-label="Workspace creation date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-updated">Last Updated</Label>
            <Input
              id="workspace-updated"
              value={new Date(workspace.updatedAt).toLocaleDateString()}
              readOnly
              className="cursor-default focus:outline-none"
              aria-label="Workspace last updated date"
            />
          </div>
        </form>
      </div>

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        entityType="workspace"
        entityId={workspace.id}
        entityName={workspace.name}
      />
    </section>
  )
}
