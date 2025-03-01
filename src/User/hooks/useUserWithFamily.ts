import { useUser } from '../queries/user'
import { useFamily } from '@/Family/queries'

export function useUserWithFamily() {
  const { data: user, isLoading: isUserLoading } = useUser()

  const hasFamily = !!user?.familyId && user.familyId > 0

  const {
    data: family,
    isLoading: isFamilyLoading,
    isError: isFamilyError,
  } = useFamily(hasFamily ? user?.familyId : undefined)

  return {
    user,
    family,
    isLoading: isUserLoading || (hasFamily && isFamilyLoading),
    hasFamily,
    isParent: user?.role === 'PARENT',
    isChild: user?.role === 'CHILD',
    isFamilyError,
  }
}
