import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { RecentResponse } from '@/Global/types'
import { Container } from '../types'
import { CreateContainerData, UpdateContainerData } from '../schemas'

export function useRecentEntities() {
  return useQuery({
    queryKey: queryKeys.recent,
    queryFn: () => api.get<RecentResponse>('/recent'),
  })
}

export function useContainer(id: number) {
  console.log('useContainer called with id:', id)
  return useQuery({
    queryKey: queryKeys.containers.detail(id),
    queryFn: () => {
      console.log('Query function executing for container:', id)
      return api.get<Container>(`/containers/${id}`)
    },
    enabled: !!id,
  })
}

export function useContainers() {
  return useQuery({
    queryKey: queryKeys.containers.list,
    queryFn: () => api.get<Container[]>('/containers'),
  })
}

export function useCreateContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateContainerData) => api.post<Container>('/containers', data),
    onSuccess: (newContainer) => {
      queryClient.setQueryData(queryKeys.containers.list, (old: Container[] = []) => {
        return [...old, newContainer]
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.recent })
    },
  })
}

export function useUpdateContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateContainerData) => api.put<Container>(`/containers/${data.id}`, data),
    onSuccess: (updatedContainer, variables) => {
      queryClient.setQueryData(queryKeys.containers.detail(variables.id), updatedContainer)
      queryClient.setQueryData(queryKeys.containers.list, (old: Container[] = []) => {
        return old.map((container) =>
          container.id === variables.id ? updatedContainer : container,
        )
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.recent })
    },
  })
}
