import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useActiveProfile } from '@/Profile/queries/profile'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    const { isLogged } = context.authentication
    if (!isLogged()) {
      throw redirect({ to: '/login' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { data: activeProfile, isError, isLoading } = useActiveProfile()

  if (isError && location.pathname !== '/profile/select') {
    throw redirect({ to: '/profile/select' })
  }

  if (!isLoading && !activeProfile && location.pathname !== '/profile/select') {
    throw redirect({ to: '/profile/select' })
  }

  return <Outlet />
}
