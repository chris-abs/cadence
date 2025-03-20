import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { Profile, SelectProfileRequest, VerifyPinRequest } from '../types'
import { ApiError } from '@/Global/types'

export interface ProfileResponse {
  token: string
  profile: Profile
}

export function useSelectProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SelectProfileRequest) => api.post<ProfileResponse>('/profiles/select', data),
    onSuccess: (response) => {
      const { profile, token } = response

      localStorage.setItem('token', token)
      localStorage.setItem('activeProfile', JSON.stringify(profile))
      queryClient.setQueryData(queryKeys.profile.current, profile)
    },
  })
}

export function useVerifyPin() {
  return useMutation({
    mutationFn: async (data: VerifyPinRequest) => {
      try {
        return await api.post<{ token: string; profile: Profile }>('/profiles/verify', data)
      } catch (error) {
        if ((error as ApiError)?.statusCode === 401) {
          const pinError = error as ApiError
          pinError.isPinVerificationError = true
          throw pinError
        }
        throw error
      }
    },
  })
}
