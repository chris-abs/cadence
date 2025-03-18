import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { PageLayout } from '@/Global/layout/PageLayout'
import { Profile } from '@/Profile/types'
import { useUpdateProfile, useActiveProfile } from '@/Profile/queries/profile'
import {
  ProfileDetailsSection,
  ProfilePinSection,
} from '@/Profile/components/organisms/detail/sections'

export const Route = createFileRoute('/_authenticated/cadence/profile')({
  component: ProfileManagePage,
})

function ProfileManagePage() {
  const { data: profile } = useActiveProfile()
  const updateProfile = useUpdateProfile()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdateProfile = async (
    data: Partial<Profile> & {
      image?: File
      pin?: string
      currentPin?: string
    },
  ) => {
    if (!profile) return

    setIsUpdating(true)
    try {
      await updateProfile.mutateAsync({
        id: profile.id,
        ...data,
      })
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
