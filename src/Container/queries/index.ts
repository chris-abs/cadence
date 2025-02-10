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

      invalidateQueries(queryClient, {
        exactIds: {
          workspaceId: newContainer.workspaceId,
        },
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
      const oldContainer = queryClient.getQueryData<Container>(
        queryKeys.containers.detail(variables.id),
      )

      queryClient.setQueryData(queryKeys.containers.detail(variables.id), updatedContainer)

      queryClient.setQueryData(queryKeys.containers.list, (old: Container[] = []) => {
        return old.map((container) =>
          container.id === variables.id ? updatedContainer : container,
        )
      })

      if (oldContainer?.workspaceId !== updatedContainer.workspaceId) {
        invalidateQueries(queryClient, {
          exactIds: {
            workspaceId: oldContainer?.workspaceId,
            containerIds: [variables.id],
          },
          lists: ['containers'],
        })
      }

      if (oldContainer?.items?.length !== updatedContainer.items?.length) {
        invalidateQueries(queryClient, {
          exactIds: {
            itemIds: updatedContainer.items?.map((item) => item.id),
          },
          lists: ['items'],
        })
      }
    },
  })
}

export function useDeleteContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const container = queryClient.getQueryData<Container>(queryKeys.containers.detail(id))
      const relationshipIds = {
        workspaceId: container?.workspaceId,
        itemIds: container?.items?.map((item) => item.id) || [],
      }

      await api.delete(`/containers/${id}`)
      return relationshipIds
    },
    onSuccess: (relationshipIds, deletedId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.containers.detail(deletedId),
      })

      queryClient.setQueryData(queryKeys.containers.list, (old: Container[] = []) => {
        return old.filter((container) => container.id !== deletedId)
      })

      invalidateQueries(queryClient, {
        exactIds: {
          workspaceId: relationshipIds.workspaceId,
          itemIds: relationshipIds.itemIds,
        },
        lists: ['containers'],
      })
    },
  })
}
