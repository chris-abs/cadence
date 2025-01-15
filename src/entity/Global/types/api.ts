export type ApiError = {
  statusCode: number
  message: string
  data?: unknown
} & Error

export function createApiError(statusCode: number, message: string, data?: unknown): ApiError {
  return Object.assign(new Error(message), {
    statusCode,
    data,
    name: 'ApiError',
  })
}
