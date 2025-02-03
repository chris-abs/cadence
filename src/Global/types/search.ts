interface BaseSearchResult {
  id: number
  name: string
  description: string
  rank: number
}

export interface WorkspaceSearchResult extends BaseSearchResult {
  type: 'workspace'
}

export interface ContainerSearchResult extends BaseSearchResult {
  type: 'container'
}

export interface ItemSearchResult extends BaseSearchResult {
  type: 'item'
}

export interface TagSearchResult extends BaseSearchResult {
  type: 'tag'
}
