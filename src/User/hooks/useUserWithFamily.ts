import { useUser } from '../queries/user'
import { useFamily } from '@/Family/queries'

export function useUserWithFamily() {
  const { data: user, isLoading: isUserLoading } = useUser()
  const { data: family, isLoading: isFamilyLoading } = useFamily(user?.familyId ?? 0)

  return {
    user,
    family,
    isLoading: isUserLoading || isFamilyLoading,
    hasFamily: !!user?.familyId,
    isParent: user?.role === 'PARENT',
    isChild: user?.role === 'CHILD',
  }
}
