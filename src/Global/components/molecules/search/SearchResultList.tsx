import { LucideIcon } from 'lucide-react'
import { SearchResultCard } from './SearchResultCard'
import { RankedEntity } from '@/Global/types/search'
import { SearchType } from '@/Global/utils/search'

interface ResultsListProps {
  results: RankedEntity[]
  type: SearchType
  Icon: LucideIcon
  onClose?: () => void
}

export function ResultsList({ results, type, Icon, onClose }: ResultsListProps) {
  const filteredResults = results.filter((result) => result.type === type)

  return (
    <div className="grid grid-cols-1 gap-2">
      {filteredResults.map((result) => (
        <SearchResultCard key={result.id} result={result} Icon={Icon} onClose={onClose} />
      ))}
    </div>
  )
}
