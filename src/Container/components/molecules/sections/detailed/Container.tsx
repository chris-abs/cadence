import { useState } from 'react'
import { Pencil, Trash2, MoreVertical, ArrowRight } from 'lucide-react'

import {
  Button,
  Input,
  Label,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Global/components/atoms'
import { cn } from '@/Global/lib/utils'
import { DeleteModal } from '@/Global/components/organisms/modals/DeleteModal'
import { Container } from '@/Container/types'
import { UpdateContainerData } from '@/Container/schemas'
import { NotAssignedSection } from '@/Global/components/molecules'

interface ContainerSectionProps {
  container: Container | undefined
  emptyStateComponent?: React.ReactNode
  onUpdateContainer?: (data: UpdateContainerData) => Promise<void>
  onAssignOrReassign: () => void
  isUpdating?: boolean
}

export function ContainerSection({
  container,
  emptyStateComponent,
  onUpdateContainer,
  onAssignOrReassign,
  isUpdating,
}: ContainerSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<UpdateContainerData> | null>(null)

  if (container?.name === '' || !container) {
    return (
      emptyStateComponent || (
        <NotAssignedSection
          title="Container"
          message="No container assigned to this item yet."
          actionLabel="Assign Container"
          onAction={onAssignOrReassign}
        />
      )
    )
  }

  const handleEdit = () => {
    setFormData({
      id: container.id,
      name: container.name,
      location: container.location,
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
    if (!formData || !onUpdateContainer) return

    await onUpdateContainer({
      id: container.id,
      name: formData.name || container.name,
      ...formData,
    })

    setIsEditing(false)
    setFormData(null)
  }

  return (
    <section
      className="bg-background border rounded-xl p-4"
      aria-labelledby="container-section-title"
    >
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <h2 id="container-section-title" className="text-lg font-medium">
            Container Details
          </h2>
          {!isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onAssignOrReassign}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Reassign Container
                </DropdownMenuItem>
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
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleCancel} disabled={isUpdating}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </header>

        <div className="grid grid-cols-2 gap-4" role="group" aria-label="Container information">
          <div className="row-span-4 flex flex-col items-center justify-center">
            <Label className="text-center mb-1.5" htmlFor="qr-code">
              QR Code
            </Label>
            <div
              className="w-64 h-64 border rounded-lg p-3 bg-white flex items-center justify-center"
              id="qr-code"
              role="img"
              aria-label={`QR Code for container ${container.name}`}
            >
              <img
                src={container.qrCodeImage}
                alt={`QR Code for container ${container.name}`}
                className="w-full h-full"
              />
            </div>
            <span
              className="text-xs text-muted-foreground mt-2 font-mono"
              aria-label="QR Code value"
            >
              {container.qrCode}
            </span>
          </div>

          <form className="space-y-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="container-name">Name</Label>
              <Input
                id="container-name"
                name="name"
                value={isEditing ? formData?.name : container.name}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={cn(!isEditing && 'cursor-default focus:outline-none')}
                aria-label="Container name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="container-number">Container Number</Label>
              <Input
                id="container-number"
                value={container.number ? `#${container.number}` : ''}
                readOnly
                className="cursor-default focus:outline-none"
                aria-label="Container number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="container-location">Location</Label>
              <Input
                id="container-location"
                name="location"
                value={isEditing ? formData?.location || '' : container.location || ''}
                onChange={handleInputChange}
                readOnly={!isEditing}
                className={cn(!isEditing && 'cursor-default focus:outline-none')}
                aria-label="Container location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="container-created">Created</Label>
              <Input
                id="container-created"
                value={new Date(container.createdAt).toLocaleDateString()}
                readOnly
                className="cursor-default focus:outline-none"
                aria-label="Container creation date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="container-updated">Last Updated</Label>
              <Input
                id="container-updated"
                value={new Date(container.updatedAt).toLocaleDateString()}
                readOnly
                className="cursor-default focus:outline-none"
                aria-label="Container last updated date"
              />
            </div>
          </form>
        </div>
      </div>

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        entityType="container"
        entityId={container.id}
        entityName={container.name}
      />
    </section>
  )
}
