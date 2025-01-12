import { useQuery } from '@tanstack/react-query'
import type { User } from '@/types/user'
import { api } from '@/utils/api'
import { queryKeys } from '@/lib/queryKeys'

export function useUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => api.get<User>('/user'),
  })
}
