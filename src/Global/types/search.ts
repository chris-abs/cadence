export type SearchType = 'container' | 'item' | 'tag' | 'workspace'

export interface BaseSearchResult {
  id: number
  type: SearchType
  name: string
  description: string
  rank: number
}

export interface DashboardContainerSearchResult extends BaseSearchResult {
  type: 'container'
  location?: string
  workspaceName?: string
}

export interface DashboardItemSearchResult extends BaseSearchResult {
  type: 'item'
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
  workspaces: DashboardWorkspaceSearchResult[]
}
