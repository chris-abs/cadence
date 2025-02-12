import { useState } from 'react'
import { Pencil, Trash2, MoreVertical, ArrowRight } from 'lucide-react'

import {
  Button,
  Label,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Global/components/atoms'
import { NotAssignedSection, Section, H3 } from '@/Global/components/molecules'
import { cn } from '@/Global/lib/utils'
import { DeleteModal } from '@/Collection/components/organisms/modals'
import { Workspace } from '@/Workspace/types'
import { UpdateWorkspaceData } from '@/Workspace/schemas'

interface WorkspaceDetailsSectionProps {
  workspace: Workspace | null
  emptyStateComponent?: React.ReactNode
  onUpdate?: (data: UpdateWorkspaceData) => Promise<void>
  onAssignOrReassign?: () => void
  isUpdating?: boolean
  allowReassignment?: boolean
}

export function WorkspaceDetailsSection({
  workspace,
  emptyStateComponent,
  onUpdate,
  onAssignOrReassign,
  isUpdating,
  allowReassignment,
}: WorkspaceDetailsSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<UpdateWorkspaceData> | null>(null)

  if (!workspace?.name) {
    return (
      emptyStateComponent || (
        <NotAssignedSection
          title="Workspace"
          message="No workspace assigned to this container yet."
          actionLabel="Assign Workspace"
          onAction={onAssignOrReassign}
        />
      )
    )
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
    <Section>
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <H3>Workspace Details</H3>
          {onUpdate && !isEditing ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {allowReassignment && (
                  <DropdownMenuItem onClick={onAssignOrReassign}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    <span>Reassign Workspace</span>
                  </DropdownMenuItem>
                )}
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-created">Created</Label>
            <Input
              id="workspace-created"
              value={new Date(workspace.createdAt).toLocaleDateString()}
              readOnly
              className="cursor-default focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-updated">Last Updated</Label>
            <Input
              id="workspace-updated"
              value={new Date(workspace.updatedAt).toLocaleDateString()}
              readOnly
              className="cursor-default focus:outline-none"
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
    </Section>
  )
}
