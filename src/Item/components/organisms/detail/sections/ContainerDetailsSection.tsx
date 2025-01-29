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
import { H3, Muted } from '@/Global/components/molecules/Typography'
import { DeleteModal } from 'src/Collection/components/organisms/modals/DeleteModal'
import { cn } from '@/Global/lib/utils'
import { Container } from '@/Container/types'
import { UpdateContainerData } from '@/Container/schemas'
import { NotAssignedSection, Section } from '@/Global/components/molecules'

interface ContainerDetailsSectionProps {
  container: Container | undefined
  emptyStateComponent?: React.ReactNode
  onUpdateContainer?: (data: UpdateContainerData) => Promise<void>
  onAssignOrReassign?: () => void
  isUpdating?: boolean
}

export function ContainerDetailsSection({
  container,
  emptyStateComponent,
  onUpdateContainer,
  onAssignOrReassign,
  isUpdating,
}: ContainerDetailsSectionProps) {
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
    <Section className="bg-background transition-colors duration-200">
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <H3>Container Details</H3>
          {!isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border-border">
                <DropdownMenuItem onClick={onAssignOrReassign}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  <span>Reassign Container</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {isEditing && (
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
          )}
        </header>

        <div className="grid grid-cols-2 gap-4" role="group" aria-label="Container information">
          <div className="row-span-4 flex flex-col items-center justify-center">
            <Label className="text-center mb-1.5" htmlFor="qr-code">
              QR Code
            </Label>
            <div
              className={cn(
                'w-64 h-64 rounded-lg p-3',
                'border border-border',
                'bg-background',
                'transition-colors duration-200',
              )}
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
            <Muted className="mt-2 font-mono" aria-label="QR Code value">
              {container.qrCode}
            </Muted>
          </div>

          <form className="space-y-2" onSubmit={handleSubmit}>
            {[
              {
                id: 'container-name',
                label: 'Name',
                name: 'name',
                value: isEditing ? formData?.name : container.name,
              },
              {
                id: 'container-number',
                label: 'Container Number',
                value: container.number ? `#${container.number}` : '',
                readonly: true,
              },
              {
                id: 'container-location',
                label: 'Location',
                name: 'location',
                value: isEditing ? formData?.location || '' : container.location || '',
              },
              {
                id: 'container-created',
                label: 'Created',
                value: new Date(container.createdAt).toLocaleDateString(),
                readonly: true,
              },
              {
                id: 'container-updated',
                label: 'Last Updated',
                value: new Date(container.updatedAt).toLocaleDateString(),
                readonly: true,
              },
            ].map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Input
                  id={field.id}
                  name={field.name}
                  value={field.value}
                  onChange={field.name ? handleInputChange : undefined}
                  readOnly={field.readonly || !isEditing}
                  className={cn(
                    'bg-background text-foreground',
                    'border-border',
                    'placeholder:text-muted-foreground',
                    (!isEditing || field.readonly) && 'cursor-default focus:outline-none',
                  )}
                  aria-label={`Container ${field.label.toLowerCase()}`}
                />
              </div>
            ))}
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
    </Section>
  )
}
