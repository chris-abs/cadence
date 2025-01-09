// utils/api.ts
import { ApiError, createApiError } from '../types/api'

const API_BASE_URL = 'http://localhost:3000'

interface ApiResponse<T> {
  data?: T
  error?: {
    message: string
    code?: string
  }
}

export async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  if (!token) {
    throw createApiError(401, 'No token found')
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })

    const data = (await response.json().catch(() => ({}))) as ApiResponse<T>

    if (!response.ok) {
      if (response.status === 401) {
        throw createApiError(401, 'Unauthorized')
      }
      throw createApiError(
        response.status,
        data.error?.message || `Request failed: ${response.statusText}`,
        data,
      )
    }

    return data.data ?? (data as T)
  } catch (error) {
    if ((error as ApiError).statusCode) {
      throw error
    }
    throw createApiError(500, (error as Error).message || 'Unknown error occurred')
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    fetchWithAuth<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data: unknown, options?: RequestInit) =>
    fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data: unknown, options?: RequestInit) =>
    fetchWithAuth<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchWithAuth<T>(endpoint, { ...options, method: 'DELETE' }),
}
