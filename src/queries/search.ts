import { useQuery } from '@tanstack/react-query'
import type { SearchResponse } from '@/types/search'

async function fetchSearchResults(query: string): Promise<SearchResponse> {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('No token found')
  if (!query) throw new Error('Query is required')

  console.log('Fetching search:', query)

  const response = await fetch(`http://localhost:3000/search?q=${encodeURIComponent(query)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Search failed')
  }

  const data = await response.json()
  console.log('Search response:', data)
  return data
}

export function useSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => fetchSearchResults(query),
    enabled: options?.enabled && query.length > 0,
    staleTime: 1000 * 60,
  })
}
