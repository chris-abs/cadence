import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useProfiles } from '@/Profile/queries'
import { ProfileSwitcher } from '@/Profile/components/organisms/detail'
import { useSelectProfile } from '@/Profile/queries'

export const Route = createFileRoute('/_authenticated/cadence/profile-select')({
  component: ProfileSelectPage,
})

function ProfileSelectPage() {
  const { data: profiles, isLoading } = useProfiles()
  const navigate = useNavigate()
  const selectProfile = useSelectProfile()

  const handleProfileSelected = () => {
    navigate({ to: '/cadence' })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading profiles...</div>
  }

  if (profiles?.length === 1) {
    const onlyProfile = profiles[0]

    if (!onlyProfile.hasPin) {
      selectProfile.mutate(
        {
          profileId: onlyProfile.id,
        },
        {
          onSuccess: () => navigate({ to: '/cadence' }),
        },
      )

      return (
        <div className="flex items-center justify-center h-screen">Loading your profile...</div>
      )
    }

    // If has pin, show profile switcher which will handle PIN entry
  }

  return <ProfileSwitcher profiles={profiles || []} onProfileSelected={handleProfileSelected} />
}
