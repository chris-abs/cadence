import { BaseSearchResult, SearchResponse, SearchType } from '../types/search'

export function getSearchResultsByEntityType(
  data: SearchResponse | undefined,
  type: SearchType,
): BaseSearchResult[] {
  if (!data) return []

  const resultMap: Record<SearchType, keyof SearchResponse> = {
    workspace: 'workspaces',
    container: 'containers',
    item: 'items',
    tagged_item: 'taggedItems',
    tag: 'tags',
  }

  return data[resultMap[type]] || []
}
