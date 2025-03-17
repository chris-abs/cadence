import { useMutation } from '@tanstack/react-query'
import { Profile } from '@/Profile/types'
import { Family } from '@/Family/types'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterCredentials {
  email: string
  password: string
  familyName: string
  ownerName: string
}

interface FamilyAuthResponse {
  token: string
  family: Family
  profiles: Profile[]
}

export const useAuth = () => {
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await fetch('http://localhost:3000/family/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
      }

      const data = (await response.json()) as FamilyAuthResponse

      localStorage.setItem('token', data.token)
      localStorage.setItem('family', JSON.stringify(data.family))

      localStorage.setItem('profiles', JSON.stringify(data.profiles))

      if (data.profiles.length > 0) {
        localStorage.setItem('activeProfile', JSON.stringify(data.profiles[0]))
      }

      return data
    },
  })

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await fetch('http://localhost:3000/family/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Registration failed')
      }

      const data = (await response.json()) as FamilyAuthResponse

      localStorage.setItem('token', data.token)
      localStorage.setItem('family', JSON.stringify(data.family))

      localStorage.setItem('profiles', JSON.stringify(data.profiles))

      if (data.profiles.length > 0) {
        localStorage.setItem('activeProfile', JSON.stringify(data.profiles[0]))
      }

      return data
    },
  })

  const login = async (credentials: LoginCredentials) => {
    return loginMutation.mutateAsync(credentials)
  }

  const register = async (credentials: RegisterCredentials) => {
    const result = await registerMutation.mutateAsync(credentials)
    return result
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('family')
    localStorage.removeItem('profiles')
    localStorage.removeItem('activeProfile')
  }

  const isLogged = () => Boolean(localStorage.getItem('token'))

  return {
    login,
    logout,
    register,
    isLogged,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    error: loginMutation.error || registerMutation.error,
  }
}

export type AuthContext = ReturnType<typeof useAuth>
