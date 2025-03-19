import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { PageLayout } from '@/Global/layout/PageLayout'
import { UpdateProfileRequest } from '@/Profile/types'
import { useUpdateProfile, useActiveProfile } from '@/Profile/queries/profile'
import {
  ProfileDetailsSection,
  ProfilePinSection,
} from '@/Profile/components/organisms/manage/sections'

export const Route = createFileRoute('/_authenticated/profile/settings')({
  component: ProfileManagePage,
})

function ProfileManagePage() {
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
    <PageLayout>
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
    </PageLayout>
  )
}
