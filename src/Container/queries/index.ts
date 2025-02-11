import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { invalidateQueries } from '@/Global/utils/queryInvalidation'
import { Container } from '../types'
import { CreateContainerData, UpdateContainerData } from '../schemas'

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

      queryClient.refetchQueries({
        queryKey: queryKeys.workspaces.list,
        exact: true,
      })

      queryClient.refetchQueries({
        queryKey: queryKeys.items.list,
        exact: true,
      })

      invalidateQueries(queryClient, {
        lists: ['containers'],
      })
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

      const oldContainer = queryClient.getQueryData<Container>(
        queryKeys.containers.detail(variables.id),
      )
      if (oldContainer?.workspaceId !== updatedContainer.workspaceId) {
        if (oldContainer?.workspaceId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.workspaces.detail(oldContainer.workspaceId),
          })
        }
        if (updatedContainer.workspaceId) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.workspaces.detail(updatedContainer.workspaceId),
          })
        }
        queryClient.refetchQueries({
          queryKey: queryKeys.workspaces.list,
          exact: true,
        })
      }

      invalidateQueries(queryClient, {
        lists: ['containers'],
      })
    },
  })
}

export function useDeleteContainer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/containers/${id}`),
    onSuccess: (_, deletedId) => {
      // Remove deleted container cache
      queryClient.removeQueries({
        queryKey: queryKeys.containers.detail(deletedId),
      })

      // Immediately update containers list view
      queryClient.setQueryData(queryKeys.containers.list, (old: Container[] = []) => {
        return old.filter((container) => container.id !== deletedId)
      })

      // Invalidate ALL item queries (both list and detail)
      queryClient.invalidateQueries({
        queryKey: ['items'],
      })

      // Invalidate related entity lists
      queryClient.invalidateQueries({
        queryKey: ['workspaces'],
      })

      queryClient.invalidateQueries({
        queryKey: ['containers'],
      })
    },
  })
}
