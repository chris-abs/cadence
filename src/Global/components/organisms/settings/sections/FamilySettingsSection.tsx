import { FamilyDetail } from '@/Family/components/organisms/detail'
import { useCurrentFamily } from '@/Family/queries'
import { useProfileWithFamily } from '@/Profile/hooks/useProfileWithFamily'

export function FamilySettingsSection() {
  const { data: family, isLoading: isFamilyLoading } = useCurrentFamily()
  const { profile, isParent, isLoading: isProfileLoading } = useProfileWithFamily()

  if (isProfileLoading || isFamilyLoading) {
    return <p>Loading...</p>
  }

  return <FamilyDetail family={family} currentProfileId={profile?.id} isParent={isParent} />
}
