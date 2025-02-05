export type SearchType = 'container' | 'item' | 'tag' | 'tagged_item' | 'workspace'

export interface BaseSearchResult {
  id: number
  type: SearchType
  name: string
  description: string
  rank: number
  containerName?: string
  workspaceName?: string
}

export interface DashboardContainerSearchResult extends BaseSearchResult {
  type: 'container'
  location?: string
  workspaceName?: string
}

export interface DashboardItemSearchResult extends BaseSearchResult {
  type: 'item' | 'tagged_item'
  containerName?: string
  containerLocation?: string
}

export interface DashboardTagSearchResult extends BaseSearchResult {
  type: 'tag'
  itemCount?: number
}

export interface DashboardWorkspaceSearchResult extends BaseSearchResult {
  type: 'workspace'
  containerCount?: number
}

export type SearchResult =
  | DashboardContainerSearchResult
  | DashboardItemSearchResult
  | DashboardTagSearchResult
  | DashboardWorkspaceSearchResult

export interface SearchResponse {
  containers: DashboardContainerSearchResult[]
  items: DashboardItemSearchResult[]
  tags: DashboardTagSearchResult[]
  taggedItems: DashboardItemSearchResult[]
  workspaces: DashboardWorkspaceSearchResult[]
}
