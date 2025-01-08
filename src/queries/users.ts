import { useQuery } from '@tanstack/react-query'
import type { User } from '@/types/user'

async function fetchUser(): Promise<User> {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('No token found')

  const response = await fetch('http://localhost:3000/user', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) throw new Error('Failed to fetch user')
  return response.json()
}

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5,
  })
}
