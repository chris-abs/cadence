export type EntityType = 'workspace' | 'container' | 'item' | 'tag'

export interface CollectionEntity {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface CreateEntityResponse {
  id: number
}
