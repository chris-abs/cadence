import { useState } from 'react'
import { Upload } from 'lucide-react'

import {
  Button,
  Input,
  Label,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/Global/components/atoms'
import { H3, Section } from '@/Global/components/molecules'
import { cn } from '@/Global/lib'
import { User } from '@/User/types'

interface UserProfileSectionProps {
  user: User
  onUpdate: (data: Partial<User>) => Promise<void>
  isUpdating: boolean
}

export function UserProfileSection({ user, onUpdate, isUpdating }: UserProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<User>>({
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
  })

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // TODO: file upload imlementation
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onUpdate(formData)
    setIsEditing(false)
  }

  return (
    <Section>
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <H3>Profile Information</H3>
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setIsEditing(false)}
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

        <div className="flex gap-8">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-24 w-24">
              {formData.imageUrl ? (
                <AvatarImage src={formData.imageUrl} />
              ) : (
                <AvatarFallback className="text-lg">
                  {`${user.firstName[0]}${user.lastName[0]}`}
                </AvatarFallback>
              )}
            </Avatar>
            {isEditing && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <div>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </div>
                  </Button>
                </label>
              </div>
            )}
          </div>

          <form className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                  className={cn(
                    'bg-background text-foreground',
                    'border-border',
                    !isEditing && 'cursor-default focus:outline-none',
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  readOnly={!isEditing}
                  className={cn(
                    'bg-background text-foreground',
                    'border-border',
                    !isEditing && 'cursor-default focus:outline-none',
                  )}
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </Section>
  )
}
