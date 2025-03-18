import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { api } from '@/Global/utils/api'
import { queryClient, queryKeys } from '@/Global/lib'
import { useUser } from '@/User/queries/user'
import { useActiveProfile } from '@/Profile/queries/profile'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    const { isLogged } = context.authentication
    if (!isLogged()) {
      throw redirect({ to: '/login' })
    }

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.user,
        queryFn: () => api.get('/user'),
      }),
    ])
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { isError: isUserError } = useUser()
  const { data: activeProfile, isError: isProfileError } = useActiveProfile()

  if (isUserError) {
    throw redirect({ to: '/login' })
  }

  if (!activeProfile && !isProfileError && location.pathname !== '/cadence/profile-select') {
    throw redirect({ to: '/cadence/profile-select' })
  }

  return <Outlet />
}
