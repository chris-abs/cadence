export interface BaseSearchResult {
  id: number
  type: 'container' | 'item' | 'tag' | 'workspace'
  name: string
  description: string
  rank: number
}

export interface SearchResponse {
  containers: BaseSearchResult[]
  items: BaseSearchResult[]
  tags: BaseSearchResult[]
  workspaces: BaseSearchResult[]
}
