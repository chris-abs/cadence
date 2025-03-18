import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useActiveProfile } from '@/Profile/queries/profile'
import { useAuth } from './useAuth'

export function useRequireProfile() {
  const { isLogged } = useAuth()
  const { data: profile, isLoading } = useActiveProfile()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLogged()) {
      navigate({ to: '/login' })
      return
    }

    if (!isLoading && !profile && window.location.pathname !== '/cadence/profile-select') {
      navigate({ to: '/cadence/profile-select' })
    }
  }, [isLogged, profile, isLoading, navigate])

  return { profile, isLoading }
}
