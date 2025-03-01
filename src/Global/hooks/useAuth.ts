import { useMutation } from '@tanstack/react-query'
import { User } from '@/User/types'
import { FamilyRoles } from '@/Family/types'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterCredentials extends LoginCredentials {
  firstName: string
  lastName: string
  imageUrl?: string
}

interface AuthResponseFromAPI {
  token: string
  user: Omit<User, 'familyId' | 'role'>
  familyId?: number
  role?: FamilyRoles['role']
}

export const useAuth = () => {
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await fetch('http://localhost:3000/users/login', {
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

      const data = (await response.json()) as AuthResponseFromAPI

      localStorage.setItem('token', data.token)

      const user: User = {
        ...data.user,
        familyId: data.familyId,
        role: data.role,
      }

      localStorage.setItem('user', JSON.stringify(user))

      return { token: data.token, user }
    },
  })

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await fetch('http://localhost:3000/users/register', {
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

      const data = (await response.json()) as AuthResponseFromAPI

      localStorage.setItem('token', data.token)

      const user: User = {
        ...data.user,
        familyId: data.familyId,
        role: data.role,
      }

      localStorage.setItem('user', JSON.stringify(user))

      return { token: data.token, user }
    },
  })

  const login = async (credentials: LoginCredentials) => {
    return loginMutation.mutateAsync(credentials)
  }

  const register = async (credentials: RegisterCredentials) => {
    return registerMutation.mutateAsync(credentials)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const isLogged = () => Boolean(localStorage.getItem('token'))

  return {
    login,
    logout,
    register,
    isLogged,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    error: loginMutation.error || registerMutation.error,
  }
}

export type AuthContext = ReturnType<typeof useAuth>
