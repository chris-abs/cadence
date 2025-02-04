import { SearchResponse, SearchResult, SearchType } from '../types/search'

export function getSearchResultsByEntityType(
  data: SearchResponse | undefined,
  type: SearchType,
): SearchResult[] {
  if (!data) return []

  const resultMap: Record<SearchType, keyof SearchResponse> = {
    workspace: 'workspaces',
    container: 'containers',
    item: 'items',
    tag: 'tags',
  }

  return data[resultMap[type]] || []
}
