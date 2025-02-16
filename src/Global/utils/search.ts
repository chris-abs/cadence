import { FederatedSearchResponse } from '../types/search'
import type { RankedWorkspace, RankedContainer, RankedItem, RankedTag } from '../types/search'

export type RankedEntity = RankedWorkspace | RankedContainer | RankedItem | RankedTag

export type SearchType = 'workspace' | 'container' | 'item' | 'tagged_item' | 'tag'

export function getSearchResultsByEntityType(
  data: FederatedSearchResponse | undefined,
  type: SearchType,
): RankedEntity[] {
  if (!data) return []

  const resultMap: Record<SearchType, keyof FederatedSearchResponse> = {
    workspace: 'workspaces',
    container: 'containers',
    item: 'items',
    tagged_item: 'taggedItems',
    tag: 'tags',
  }

  return data[resultMap[type]] || []
}
