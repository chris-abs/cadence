import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { api } from '@/Global/utils/api'
import { queryClient, queryKeys } from '@/Global/lib'
import { useActiveProfile } from '@/Profile/queries'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    const { isLogged } = context.authentication
    if (!isLogged()) {
      throw redirect({ to: '/login' })
    }

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.profile.current,
        queryFn: () => api.get('/profile'),
      }),
    ])
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { data: activeProfile, isError } = useActiveProfile()

  if (isError) {
    throw redirect({ to: '/login' })
  }

  if (!activeProfile && location.pathname !== '/cadence/profile-select') {
    throw redirect({ to: '/cadence/profile-select' })
  }

  return <Outlet />
}
