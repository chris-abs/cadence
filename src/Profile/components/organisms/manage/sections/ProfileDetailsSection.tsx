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
import { Profile } from '@/Profile/types'

interface ProfileDetailsSectionProps {
  profile: Profile
  onUpdate: (data: Partial<Profile> & { image?: File }) => Promise<void>
  isUpdating: boolean
}

export function ProfileDetailsSection({
  profile,
  onUpdate,
  isUpdating,
}: ProfileDetailsSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Profile> & { image?: File }>({
    name: profile.name,
  })

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }))
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
    await onUpdate({
      ...formData,
      id: profile.id,
    })
    setIsEditing(false)
    setFormData({
      name: profile.name,
    })
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
                onClick={() => {
                  setIsEditing(false)
                  setFormData({
                    name: profile.name,
                  })
                }}
                disabled={isUpdating}
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
              {formData.image ? (
                <AvatarImage src={URL.createObjectURL(formData.image)} />
              ) : profile.imageUrl ? (
                <AvatarImage src={profile.imageUrl} />
              ) : (
                <AvatarFallback className="text-lg">
                  {profile.name.charAt(0).toUpperCase()}
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

          <form className="flex-1 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Profile Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
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
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={profile.role === 'PARENT' ? 'Parent' : 'Child'}
                readOnly
                className="cursor-default focus:outline-none"
              />
              {profile.isOwner && (
                <p className="text-sm text-muted-foreground mt-1">
                  This is the family owner profile
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </Section>
  )
}
