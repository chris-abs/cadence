import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/Global/lib/queryKeys'
import { api } from '@/Global/utils/api'
import { UpdateUserData, User } from '../types'

export function useUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => api.get<User>('/user'),
    staleTime: Infinity,
    retry: false,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateUserData) => {
      const formData = new FormData()
      formData.append('firstName', data.firstName || '')
      formData.append('lastName', data.lastName || '')

      if (data.image instanceof File) {
        formData.append('image', data.image)
      }

      return api.put<User>(`/users/${data.id}`, formData)
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.user, updatedUser)
      queryClient.invalidateQueries({ queryKey: queryKeys.user })
    },
  })
}

// TODO: could do something like this for password verification when updating user's email
export function useVerifyPassword() {
  return useMutation({
    mutationFn: (data: { password: string }) =>
      api.post<{ verified: boolean }>('/user/verify-password', data),
  })
}

// TODO: could possibly require this to update email independant of the general update user api endpoint
export function useUpdateEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post<User>('/user/update-email', data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.user, updatedUser)
      queryClient.invalidateQueries({
        queryKey: queryKeys.user,
      })
    },
  })
}
