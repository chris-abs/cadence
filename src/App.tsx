import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ApiError } from './types/api'
import { useAuth } from './hooks/useAuth'
import { routeTree } from './routeTree.gen'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount: number, error: unknown) => {
        if ((error as ApiError)?.statusCode === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
          return false
        }
        return failureCount < 3
      },
      staleTime: 1000 * 60 * 5,
    },
    mutations: {
      onError: (error: unknown) => {
        if ((error as ApiError)?.statusCode === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
      },
    },
  },
})

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
  return <RouterProvider router={router} context={{ authentication }} />
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
