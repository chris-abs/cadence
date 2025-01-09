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

interface RecentEntityPreview {
  id: number
  name: string
  created_at: string
}

export interface RecentResponse {
  workspaces: {
    recent: RecentEntityPreview[]
    total: number
  }
  containers: {
    recent: RecentEntityPreview[]
    total: number
  }
  items: {
    recent: RecentEntityPreview[]
    total: number
  }
  tags: {
    recent: RecentEntityPreview[]
    total: number
  }
}
