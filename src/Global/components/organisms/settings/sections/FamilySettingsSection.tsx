import { FamilyDetail } from '@/Family/components/organisms/detail'
import { useCurrentFamily } from '@/Family/queries'
import { useProfileWithFamily } from '@/Profile/hooks/useProfileWithFamily'

export function FamilySettingsSection() {
  const { data: family } = useCurrentFamily()
  const { profile, isParent } = useProfileWithFamily()

  return (
    <div className="flex flex-1 flex-col p-4 overflow-y-auto">
      <FamilyDetail family={family} currentProfileId={profile.id} isParent={isParent} />
    </div>
  )
}
