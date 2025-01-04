import { useMutation } from '@tanstack/react-query'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterCredentials extends LoginCredentials {
  firstName: string
  lastName: string
  imageUrl?: string
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

      const data = await response.json()
      localStorage.setItem('token', data.token)
      return data
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

      return response.json()
    },
  })

  const login = async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials)
  }

  const register = async (credentials: RegisterCredentials) => {
    await registerMutation.mutateAsync(credentials)
  }

  const logout = () => {
    localStorage.removeItem('token')
  }

  const isLogged = () => Boolean(localStorage.getItem('token'))

  return { 
    login, 
    logout, 
    register,
    isLogged,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    error: loginMutation.error || registerMutation.error
  }
}

export type AuthContext = ReturnType<typeof useAuth>