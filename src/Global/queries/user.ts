import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/Global/lib/queryKeys'
import { api } from '@/Global/utils/api'
import { User } from '../types'

export function useUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => api.get<User>('/user'),
    staleTime: Infinity,
    retry: false,
  })
}
