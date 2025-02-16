import { LucideIcon } from 'lucide-react'
import { SearchResultCard } from './SearchResultCard'
import { RankedEntity, SearchType } from '@/Global/utils/search'

interface ResultsListProps {
  results: RankedEntity[]
  type: SearchType
  Icon: LucideIcon
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
