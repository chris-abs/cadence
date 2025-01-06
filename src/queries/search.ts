import { useQuery } from '@tanstack/react-query'
import type { SearchResponse } from '@/types/search'

async function fetchSearchResults(query: string = ''): Promise<SearchResponse> {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('No token found')

  const response = await fetch(
    `http://localhost:3000/search?q=${encodeURIComponent(query || '')}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) throw new Error('Search failed')
  return response.json()
}

export function useSearch(query: string, type?: 'container' | 'item' | 'tag') {
  const { data, ...rest } = useQuery({
    queryKey: ['search', query],
    queryFn: () => fetchSearchResults(query),
  })

  if (data && type) {
    return {
      data: {
        [type]: data[`${type}s`],
      },
      ...rest,
    }
  }

  return { data, ...rest }
}
