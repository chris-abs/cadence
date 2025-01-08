import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { AuthContext } from '../hooks/useAuth'
import { Toast } from '@/components/atoms'

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
