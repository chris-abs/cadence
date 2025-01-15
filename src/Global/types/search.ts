export type SearchType = 'container' | 'item' | 'tag' | 'workspace'

export interface BaseSearchResult {
  id: number
  type: SearchType
  name: string
  description: string
  rank: number
}

export interface ContainerSearchResult extends BaseSearchResult {
  type: 'container'
  location?: string
  workspaceName?: string
}

export interface ItemSearchResult extends BaseSearchResult {
  type: 'item'
  containerName?: string
  containerLocation?: string
}

export interface TagSearchResult extends BaseSearchResult {
  type: 'tag'
  itemCount?: number
}

export interface WorkspaceSearchResult extends BaseSearchResult {
  type: 'workspace'
  containerCount?: number
}

export type SearchResult =
  | ContainerSearchResult
  | ItemSearchResult
  | TagSearchResult
  | WorkspaceSearchResult

export interface SearchResponse {
  containers: ContainerSearchResult[]
  items: ItemSearchResult[]
  tags: TagSearchResult[]
  workspaces: WorkspaceSearchResult[]
}
