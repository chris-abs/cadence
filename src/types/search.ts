export type SearchableType = 'workspace' | 'container' | 'item' | 'tag'

export interface SearchResult {
  id: number
  type: SearchableType
  name: string
  description: string
  rank: number
  path?: string
}

export interface SearchResponse {
  workspaces: SearchResult[]
  containers: SearchResult[]
  items: SearchResult[]
  tags: SearchResult[]
}
