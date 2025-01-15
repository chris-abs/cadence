import { useQuery } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { User } from '../types'

export function useUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => api.get<User>('/user'),
  })
}
