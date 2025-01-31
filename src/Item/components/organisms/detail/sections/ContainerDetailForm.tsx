import { UpdateContainerData } from '@/Container/schemas'
import { Container } from '@/Container/types'
import { Input, Label } from '@/Global/components/atoms'
import { cn } from '@/Global/lib'

interface ContainerDetailFormProps {
  container: Container
  isEditing: boolean
  formData: Partial<UpdateContainerData> | null
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => void
}

export function ContainerDetailForm({
  container,
  isEditing,
  formData,
  onInputChange,
  onSubmit,
}: ContainerDetailFormProps) {
  return (
    <form className="space-y-2" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="container-name">Name</Label>
        <Input
          id="container-name"
          name="name"
          value={isEditing ? formData?.name : container.name}
          onChange={onInputChange}
          readOnly={!isEditing}
          className={cn(!isEditing && 'cursor-default focus:outline-none')}
          aria-label="Container name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="container-location">Location</Label>
        <Input
          id="container-location"
          name="location"
          value={isEditing ? formData?.location || '' : container.location || ''}
          onChange={onInputChange}
          readOnly={!isEditing}
          className={cn(!isEditing && 'cursor-default focus:outline-none')}
          aria-label="Container location"
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
  )
}
