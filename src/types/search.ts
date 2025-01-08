export type SearchType = 'container' | 'item' | 'tag' | 'workspace'

export interface SearchResult {
  id: number
  type: SearchType
  name: string
  description: string
  rank: number
}

export interface SearchResponse {
  containers: SearchResult[]
  items: SearchResult[]
  tags: SearchResult[]
  workspaces: SearchResult[]
}
