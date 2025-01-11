import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Container } from '@/types/container'
import { api } from '@/utils/api'
import type { CreateContainerData, UpdateContainerData } from '@/schemas/container'

export function useContainer(id: number) {
  return useQuery({
    queryKey: ['container', id],
    queryFn: () => api.get<Container>(`/containers/${id}`),
    enabled: !!id,
  })
}

export function useContainers() {
  return useQuery({
    queryKey: ['containers'],
    queryFn: () => api.get<Container[]>('/containers'),
  })
}

export function useCreateContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateContainerData) => api.post<Container>('/containers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent'] })
    },
  })
}

export function useUpdateContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateContainerData) => api.put<Container>(`/containers/${data.id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['container', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['recent'] })
    },
  })
}
