import { Box } from 'lucide-react'
import type { SearchResult, SearchType } from '@/Global/types/search'
import { SearchResultCard } from './SearchResultCard'

interface ResultsListProps {
  results: SearchResult[]
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
