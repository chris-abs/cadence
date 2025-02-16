import type { Container } from '@/Container/types'
import type { Item } from '@/Item/types'
import type { Tag } from '@/Tag/types'
import type { Workspace } from '@/Workspace/types'

export interface RankedEntity {
  rank: number
}

export type RankedWorkspace = Workspace & RankedEntity
export type RankedContainer = Container & RankedEntity
export type RankedItem = Item & RankedEntity
export type RankedTag = Tag & RankedEntity

export interface FederatedSearchResponse {
  workspaces: RankedWorkspace[]
  containers: RankedContainer[]
  items: RankedItem[]
  tags: RankedTag[]
  taggedItems: RankedItem[]
}

export type WorkspaceSearchResponse = RankedWorkspace[]
export type ContainerSearchResponse = RankedContainer[]
export type ItemSearchResponse = RankedItem[]
export type TagSearchResponse = RankedTag[]
