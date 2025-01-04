import { UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterCredentials {
  email: string
  password: string
  name: string
}

interface AuthResponse {
  token: string
  user: {
    id: number
    email: string
    name: string
  }
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await fetch('http://localhost:8080/users/login', {
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

    return response.json()
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await fetch('http://localhost:8080/users/register', {
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

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
}

export function useLogin(): UseMutationResult<AuthResponse, Error, LoginCredentials> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export function useRegister(): UseMutationResult<AuthResponse, Error, RegisterCredentials> {
  return useMutation({
    mutationFn: authApi.register,
  })
}
