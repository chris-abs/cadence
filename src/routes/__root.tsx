import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { AuthContext } from '../Global/hooks/useAuth'
import { Toast } from '@/Global/components/atoms'

interface RouterContext {
  authentication: AuthContext
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <Outlet />
      <Toast />
    </>
  )
}
