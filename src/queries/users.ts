import { useQuery } from '@tanstack/react-query'
import type { User } from '@/types/user'
import { api } from '@/utils/api'

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => api.get<User>('/user'),
  })
}
