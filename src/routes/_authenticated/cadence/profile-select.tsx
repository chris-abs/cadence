import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useProfiles } from '@/Profile/queries'
import { ProfileSwitcher } from '@/Profile/components/organisms/detail'

export const Route = createFileRoute('/_authenticated/cadence/profile-select')({
  component: ProfileSelectPage,
})

function ProfileSelectPage() {
  const { data, isLoading } = useProfiles()
  const navigate = useNavigate()

  const handleProfileSelected = () => {
    navigate({ to: '/cadence' })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading profiles...</div>
  }

  const profiles = data?.profiles || []

  return <ProfileSwitcher profiles={profiles} onProfileSelected={handleProfileSelected} />
}
