import { EntityType } from '@/types/collection'

export async function createCollectionEntity(
  type: EntityType,
  data: { name: string },
): Promise<{ id: number }> {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('No token found')

  const response = await fetch(`http://localhost:3000/${type}s`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to create ${type}`)
  }

  return response.json()
}
