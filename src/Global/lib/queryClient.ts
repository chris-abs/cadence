import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '../types'

function handleAuthError(error: unknown) {
  if ((error as ApiError)?.statusCode === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    return false
  }
  return true
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: false,
      retry: (failureCount: number, error: unknown) => {
        if (!handleAuthError(error)) return false
        return failureCount < 3
      },
    },
    mutations: {
      onError: (error: unknown) => {
        handleAuthError(error)
      },
    },
  },
})
