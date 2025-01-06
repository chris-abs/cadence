import { Popover, PopoverContent, PopoverTrigger, Input } from '@/components/atoms'
import { useSearch } from '@/queries/search'
import { SearchableType, SearchResult } from '@/types/search'
import { Link } from 'lucide-react'
import { useState } from 'react'

interface QuickSearchProps {
  type: SearchableType
  onSelect?: (result: SearchResult) => void
}

export function QuickSearch({ type, onSelect }: QuickSearchProps) {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useSearch(search)

  const results = data?.[`${type}s`] || []

  return (
    <PopoverContent side="right" className="w-80">
      <div className="space-y-4">
        <Input
          placeholder={`Search ${type}s...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <Link
                key={result.id}
                to={`/${result.path}`}
                className="block p-2 hover:bg-gray-100 rounded"
              >
                {result.name}
              </Link>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">No {type}s found</div>
          )}
        </div>
      </div>
    </PopoverContent>
  )
}
