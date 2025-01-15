import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { queryClient } from '@/entity/Global/lib/queryClient'
import { queryKeys } from '@/entity/Global/lib/queryKeys'
import { api } from '@/entity/Global/utils/api'
import { useUser } from '@/queries/user'

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
      queryClient.prefetchQuery({
        queryKey: queryKeys.recent,
        queryFn: () => api.get('/recent'),
      }),
    ])
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { isError } = useUser()

  if (isError) {
    throw redirect({ to: '/login' })
  }

  return <Outlet />
}
