import { useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/Global/utils/api'
import { queryKeys } from '@/Global/lib/queryKeys'
import { Profile, SelectProfileRequest, VerifyPinRequest } from '../types'

export interface ProfileSelectionResponse {
  profile: Profile
}

export function useSelectProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SelectProfileRequest) =>
      api.post<ProfileSelectionResponse>('/profiles/select', data),
    onSuccess: (response) => {
      const profile = response.profile

      localStorage.setItem('activeProfile', JSON.stringify(profile))
      queryClient.setQueryData(queryKeys.profile.current, profile)
    },
  })
}

export function useVerifyPin() {
  return useMutation({
    mutationFn: (data: VerifyPinRequest) =>
      api.post<{ verified: boolean }>('/profiles/verify', data),
  })
}
