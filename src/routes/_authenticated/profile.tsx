import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/Global/layout/PageLayout'
import { User } from '@/User/types'
import { UserEmailSection, UserProfileSection } from '@/User/components/molecules/sections'
import { useUpdateUser, useUser } from '@/User/queries/user'

export const Route = createFileRoute('/_authenticated/profile')({
  component: UserPage,
})

function UserPage() {
  const { data: user } = useUser()
  const updateUser = useUpdateUser()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdateProfile = async (data: Partial<User>) => {
    if (!user) return

    setIsUpdating(true)
    try {
      await updateUser.mutateAsync({
        id: user.id,
        ...data,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user) return null

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col gap-6 p-4">
          <UserProfileSection user={user} onUpdate={handleUpdateProfile} isUpdating={isUpdating} />
          <UserEmailSection user={user} onUpdate={handleUpdateProfile} isUpdating={isUpdating} />
        </div>
      </div>
    </PageLayout>
  )
}
