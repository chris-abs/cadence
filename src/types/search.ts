export type SearchType = 'containers' | 'items' | 'tags' | 'workspaces'

export interface SearchResult {
  id: number
  type: 'container' | 'item' | 'tag' | 'workspace'
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
