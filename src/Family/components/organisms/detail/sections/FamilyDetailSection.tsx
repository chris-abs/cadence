import { useState } from 'react'
import { toast } from 'sonner'
import { HomeIcon, Pencil, MoreVertical } from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Global/components/atoms'
import { Section } from '@/Global/components/molecules'
import { Family, FamilyStatus } from '@/Family/types'
import { UpdateFamilyData } from '@/Family/schemas'
import { useUpdateFamily } from '@/Family/queries'
import { UpdateFamilyDetailsForm } from '@/Family/components/molecules/forms'

interface FamilyDetailSectionProps {
  family: Family
  isParent: boolean
}

export function FamilyDetailSection({ family, isParent }: FamilyDetailSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<UpdateFamilyData> | null>(null)
  const updateFamily = useUpdateFamily()

  const handleEdit = () => {
    setFormData({
      id: family.id,
      name: family.name,
      status: family.status,
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

  const handleStatusChange = (status: FamilyStatus) => {
    setFormData((prev) => ({
      ...prev,
      status,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData) return

    const updateData: UpdateFamilyData = {
      id: family.id,
      name: formData.name || family.name,
      status: formData.status || family.status,
    }

    updateFamily.mutate(
      {
        familyId: family.id,
        data: updateData,
      },
      {
        onSuccess: () => {
          toast.success('Family settings updated', {
            description: 'Your changes have been saved successfully.',
          })
          setIsEditing(false)
        },
        onError: (error) => {
          toast.error('Failed to update family settings', {
            description: error instanceof Error ? error.message : 'Please try again',
          })
        },
      },
    )
  }

  return (
    <Section>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HomeIcon className="h-5 w-5" />
                Family Information
              </CardTitle>
              <CardDescription>Basic information about your family</CardDescription>
            </div>
            {isParent && !isEditing ? (
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
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isEditing ? (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleCancel} disabled={updateFamily.isPending}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={updateFamily.isPending}>
                  {updateFamily.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <UpdateFamilyDetailsForm
            family={family}
            isEditing={isEditing}
            formData={formData}
            onInputChange={handleInputChange}
            onStatusChange={handleStatusChange}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </Section>
  )
}
