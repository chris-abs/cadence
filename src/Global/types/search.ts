import type { Container } from '@/Container/types'
import type { Item } from '@/Item/types'
import type { Tag } from '@/Tag/types'
import type { Workspace } from '@/Workspace/types'

export interface BaseSearchResult {
  id: number
  type: SearchType
  name: string
  description: string
  rank: number
  containerName?: string
  workspaceName?: string
  colour?: string
}

export type SearchType = 'container' | 'item' | 'tag' | 'tagged_item' | 'workspace'

export interface SearchResponse {
  containers: BaseSearchResult[]
  items: BaseSearchResult[]
  tags: BaseSearchResult[]
  taggedItems: BaseSearchResult[]
  workspaces: BaseSearchResult[]
}

export type ItemSearchResponse = Array<Item & { rank: number }>
export type ContainerSearchResponse = Array<Container & { rank: number }>
export type TagSearchResponse = Array<Tag & { rank: number }>
export type WorkspaceSearchResponse = Array<Workspace & { rank: number }>
