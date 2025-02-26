import type { Workspace } from '@/Storage/Workspace/types'
import type { Container } from '@/Storage/Container/types'
import type { Item } from '@/Storage/Item/types'
import type { Tag } from '@/Storage/Tag/types'

export type SearchType = 'workspace' | 'container' | 'item' | 'tagged_item' | 'tag'

export interface RankedEntityBase<T extends SearchType> {
  type: T
  rank: number
}

export type RankedWorkspace = Workspace & RankedEntityBase<'workspace'>
export type RankedContainer = Container & RankedEntityBase<'container'>
export type RankedItem = Item & (RankedEntityBase<'item'> | RankedEntityBase<'tagged_item'>)
export type RankedTag = Tag & RankedEntityBase<'tag'>

export type RankedEntity = RankedWorkspace | RankedContainer | RankedItem | RankedTag

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
