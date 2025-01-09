import { useQuery } from '@tanstack/react-query'
import type { RecentResponse } from '@/types/collection'

async function fetchRecentEntities(): Promise<RecentResponse> {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('No token found')

  const response = await fetch('http://localhost:3000/recent', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch recent entities')
  }

  return response.json()
}

export function useRecentEntities() {
  return useQuery({
    queryKey: ['recent'],
    queryFn: fetchRecentEntities,
    staleTime: 1000 * 60 * 5,
  })
}
