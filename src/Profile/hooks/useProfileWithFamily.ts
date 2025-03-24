import { useCurrentFamily } from '@/Family/queries'
import { useActiveProfile } from '@/Profile/queries'

export function useProfileWithFamily() {
  const { data: profile, isLoading: isProfileLoading } = useActiveProfile()
  const { data: family, isLoading: isFamilyLoading, isError: isFamilyError } = useCurrentFamily()

  const hasFamily = !!family
  const isParent = profile?.role === 'PARENT'
  const isChild = profile?.role === 'CHILD'
  const isOwner = profile?.isOwner || false

  return {
    profile,
    family,
    isLoading: isProfileLoading || isFamilyLoading,
    hasFamily,
    isParent,
    isChild,
    isOwner,
    isFamilyError,
  }
}
