import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Container } from '@/types/container'
import { api } from '@/utils/api'
import type { CreateContainerData, UpdateContainerData } from '@/schemas/container'
import { queryKeys } from '@/lib/queryKeys'
import { RecentResponse } from '@/types'

export function useRecentEntities() {
  return useQuery({
    queryKey: queryKeys.recent,
    queryFn: () => api.get<RecentResponse>('/recent'),
  })
}

export function useContainer(id: number) {
  return useQuery({
    queryKey: queryKeys.containers.detail(id),
    queryFn: () => api.get<Container>(`/containers/${id}`),
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
