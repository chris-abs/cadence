import type { Container } from '@/Container/types'
import type { Item } from '@/Item/types'
import type { Tag } from '@/Tag/types'
import type { Workspace } from '@/Workspace/types'

export type SearchType = 'container' | 'item' | 'tag' | 'workspace'

interface SearchResultBase {
  id: number
  type: SearchType
  name: string
  description: string
  rank: number
}

export interface DashboardContainerSearchResult extends SearchResultBase {
  type: 'container'
  location?: string
  workspaceName?: string
}

export interface DashboardItemSearchResult extends SearchResultBase {
  type: 'item'
  containerName?: string
  containerLocation?: string
}

export interface DashboardTagSearchResult extends SearchResultBase {
  type: 'tag'
  itemCount?: number
}

export interface DashboardWorkspaceSearchResult extends SearchResultBase {
  type: 'workspace'
  containerCount?: number
}

export type DashboardSearchResult =
  | DashboardContainerSearchResult
  | DashboardItemSearchResult
  | DashboardTagSearchResult
  | DashboardWorkspaceSearchResult

export interface DashboardSearchResponse {
  containers: DashboardContainerSearchResult[]
  items: DashboardItemSearchResult[]
  tags: DashboardTagSearchResult[]
  workspaces: DashboardWorkspaceSearchResult[]
}

export type ContainerSearchResult = Omit<Container, 'user' | 'userId'> & SearchResultBase
export type ItemSearchResult = Omit<Item, 'user' | 'userId'> & SearchResultBase
export type TagSearchResult = Omit<Tag, 'user' | 'userId'> & SearchResultBase
export type WorkspaceSearchResult = Omit<Workspace, 'user' | 'userId'> & SearchResultBase

export const isItem = (item: Item | ItemSearchResult): item is Item => {
  return 'createdAt' in item && 'updatedAt' in item
}

export const isItemSearchResult = (item: Item | ItemSearchResult): item is ItemSearchResult => {
  return 'rank' in item && 'type' in item
}
