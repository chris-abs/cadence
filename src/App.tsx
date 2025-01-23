import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/Global/lib/queryClient'
import { useAuth } from './Global/hooks/useAuth'
import { ThemeProvider } from '@/Global/providers/ThemeProvider'
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,
  context: { authentication: undefined! },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function InnerApp() {
  const authentication = useAuth()

  return (
    <>
      <ThemeProvider />
      <RouterProvider router={router} context={{ authentication }} />
    </>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InnerApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
