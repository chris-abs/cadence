import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useProfiles } from '@/Profile/queries'
import { Profile } from '@/Profile/types'
import { ProfileSwitcher } from '@/Profile/components/organisms/detail'

export const Route = createFileRoute('/_authenticated/cadence/profile-select')({
  component: ProfileSelectPage,
})

function ProfileSelectPage() {
  const { data: profiles, isLoading } = useProfiles()
  const navigate = useNavigate()

  const handleProfileSelected = (profile: Profile) => {
    navigate({ to: '/cadence' })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading profiles...</div>
  }

  const availableProfiles = profiles || []

  return <ProfileSwitcher profiles={availableProfiles} onProfileSelected={handleProfileSelected} />
}
