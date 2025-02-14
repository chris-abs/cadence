import { Box } from 'lucide-react'
import type { BaseSearchResult, SearchType } from '@/Global/types/search'
import { SearchResultCard } from './SearchResultCard'

interface ResultsListProps {
  results: BaseSearchResult[]
  type: SearchType
  Icon: typeof Box
  onClose?: () => void
}

export function ResultsList({ results, Icon, onClose }: ResultsListProps) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {results.map((result) => (
        <SearchResultCard key={result.id} result={result} Icon={Icon} onClose={onClose} />
      ))}
    </div>
  )
}
