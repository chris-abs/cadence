import { EntityType } from '@/types/collection'
import { api } from '@/utils/api'

export async function createCollectionEntity(
  type: EntityType,
  data: { name: string },
): Promise<{ id: number }> {
  return api.post<{ id: number }>(`/${type}s`, data)
}
