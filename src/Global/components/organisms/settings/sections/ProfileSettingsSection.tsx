import { useState } from 'react'
import { Lock, Upload } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Global/components/atoms'
import {
  ProfileDetailsSection,
  ProfilePinSection,
} from '@/Profile/components/organisms/manage/sections'
import { useActiveProfile, useUpdateProfile } from '@/Profile/queries'
import { UpdateProfileRequest } from '@/Profile/types'

export function ProfileSettingsSection() {
  const { data: profile } = useActiveProfile()
  const updateProfile = useUpdateProfile()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdateProfile = async (data: UpdateProfileRequest) => {
    if (!profile) return

    setIsUpdating(true)
    try {
      await updateProfile.mutateAsync(data)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!profile) return null

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Manage your profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileDetailsSection
            profile={profile}
            onUpdate={handleUpdateProfile}
            isUpdating={isUpdating}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>Manage your PIN and security preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfilePinSection
            profile={profile}
            onUpdate={handleUpdateProfile}
            isUpdating={isUpdating}
          />
        </CardContent>
      </Card>
    </div>
  )
}
