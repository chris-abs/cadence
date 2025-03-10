import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { invalidateQueries } from '@/Global/utils/queryInvalidation'
import { Task } from '../types'
import { CreateTaskData, UpdateTaskData } from '../schemas'

export function useTasks(assigneeId?: number) {
  return useQuery({
    queryKey: assigneeId
      ? queryKeys.chores.tasks.byAssignee(assigneeId)
      : queryKeys.chores.tasks.list,
    queryFn: () => api.get<Task[]>(assigneeId ? `/chores?assigneeId=${assigneeId}` : '/chores'),
  })
}

export function useTask(id: number) {
  return useQuery({
    queryKey: queryKeys.chores.tasks.detail(id),
    queryFn: () => api.get<Task>(`/chores/${id}`),
    enabled: !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTaskData) => api.post<Task>('/chores', data),
    onSuccess: () => {
      invalidateQueries(queryClient, {
        lists: ['chores'],
      })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateTaskData) => {
      const { id, ...updateData } = data
      return api.put<Task>(`/chores/${id}`, updateData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chores.tasks.detail(variables.id),
      })

      invalidateQueries(queryClient, {
        lists: ['chores'],
      })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.delete(`/chores/${id}`),
    onSuccess: (_, id) => {
      queryClient.removeQueries({
        queryKey: queryKeys.chores.tasks.detail(id),
      })

      invalidateQueries(queryClient, {
        lists: ['chores'],
      })
    },
  })
}

export function useRestoreTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.put(`/chores/${id}/restore`),
    onSuccess: () => {
      invalidateQueries(queryClient, {
        lists: ['chores'],
      })
    },
  })
}

export function useGenerateTaskInstances() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<void>('/chores/generate'),
    onSuccess: () => {
      invalidateQueries(queryClient, {
        lists: ['chores'],
      })
    },
  })
}
