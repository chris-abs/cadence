import { queryKeys } from '@/Global/lib/queryKeys'
import { User } from '@/types'
import { api } from '@/Global/utils/api'
import { useQuery } from '@tanstack/react-query'

export function useUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => api.get<User>('/user'),
    staleTime: Infinity,
    retry: false,
  })
}
