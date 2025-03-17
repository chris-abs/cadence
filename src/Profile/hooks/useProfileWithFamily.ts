import { useCurrentFamily } from '@/Family/queries'
import { useActiveProfile } from '../queries'

export function useProfileWithFamily() {
  const { data: profile, isLoading: isProfileLoading } = useActiveProfile()

  const { data: family, isLoading: isFamilyLoading, isError: isFamilyError } = useCurrentFamily()

  const hasFamily = !!family

  return {
    profile,
    family,
    isLoading: isProfileLoading || isFamilyLoading,
    hasFamily,
    isParent: profile?.role === 'PARENT',
    isChild: profile?.role === 'CHILD',
    isOwner: profile?.isOwner || false,
    isFamilyError,
  }
}
