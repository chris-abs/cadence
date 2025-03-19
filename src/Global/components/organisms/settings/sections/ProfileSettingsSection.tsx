import { useState } from 'react'

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
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col gap-6 p-4">
        <ProfileDetailsSection
          profile={profile}
          onUpdate={handleUpdateProfile}
          isUpdating={isUpdating}
        />
        <ProfilePinSection
          profile={profile}
          onUpdate={handleUpdateProfile}
          isUpdating={isUpdating}
        />
      </div>
    </div>
  )
}
