export type SearchType = 'workspaces' | 'containers' | 'items' | 'tags'

export interface SearchResult {
  id: number
  type: SearchType
  name: string
  description: string
  rank: number
}

export interface SearchResponse {
  workspaces: SearchResult[]
  containers: SearchResult[]
  items: SearchResult[]
  tags: SearchResult[]
}
