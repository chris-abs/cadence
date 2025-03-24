import { Family, FamilyStatus } from '@/Family/types'
import { UpdateFamilyData } from '@/Family/schemas'
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Global/components/atoms'
import { cn } from '@/Global/lib/utils'

interface UpdateFamilyDetailsFormProps {
  family: Family
  isEditing: boolean
  formData: Partial<UpdateFamilyData> | null
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onStatusChange: (status: FamilyStatus) => void
  onSubmit: (e: React.FormEvent) => void
}

export function UpdateFamilyDetailsForm({
  family,
  isEditing,
  formData,
  onInputChange,
  onStatusChange,
  onSubmit,
}: UpdateFamilyDetailsFormProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="family-name">Family Name</Label>
        <Input
          id="family-name"
          name="name"
          value={isEditing ? formData?.name || '' : family.familyName}
          onChange={onInputChange}
          readOnly={!isEditing}
          className={cn(!isEditing && 'cursor-default focus:outline-none')}
          aria-label="Family name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="family-status">Family Status</Label>
        {isEditing ? (
          <Select
            value={formData?.status || family.status}
            onValueChange={(value) => onStatusChange(value as FamilyStatus)}
          >
            <SelectTrigger id="family-status">
              <SelectValue placeholder="Select family status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="family-status"
            value={family.status}
            readOnly
            className="cursor-default focus:outline-none"
            aria-label="Family status"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="family-id">Family ID</Label>
        <Input
          id="family-id"
          value={family.id.toString()}
          readOnly
          className="cursor-default focus:outline-none"
          aria-label="Family ID"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="family-created">Created On</Label>
        <Input
          id="family-created"
          value={new Date(family.createdAt).toLocaleDateString()}
          readOnly
          className="cursor-default focus:outline-none"
          aria-label="Family creation date"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="family-updated">Last Updated</Label>
        <Input
          id="family-updated"
          value={new Date(family.updatedAt).toLocaleDateString()}
          readOnly
          className="cursor-default focus:outline-none"
          aria-label="Family last updated date"
        />
      </div>
    </form>
  )
}
