import { useMutation } from '@tanstack/react-query'
import type { LoginCredentials, RegisterCredentials, AuthResponse } from '@/types/auth'

const BASE_URL = 'http://localhost:3000'

export const authApi = {
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await fetch(`${BASE_URL}/users/register`, {
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

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await fetch(`${BASE_URL}/users/login`, {
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
}

export function useRegister() {
  return useMutation({
    mutationFn: authApi.register,
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: authApi.login,
  })
}