import { useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useSearch } from '@/queries/search'
import { SearchResult, SearchType } from '@/types/search'
import { Input } from '@/components/atoms/Input'
import { PopoverContent } from '@/components/atoms/Popover'

export function QuickSearch({ type }: { type: SearchType }) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useSearch(debouncedSearch, {
    enabled: debouncedSearch.length > 0,
  })

  const results = data?.[type] ?? []

  return (
    <PopoverContent side="right" className="w-80">
      <div className="space-y-4">
        <Input
          placeholder={`Search ${type}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="p-2 text-sm text-muted-foreground">Loading...</div>
          ) : debouncedSearch && results.length > 0 ? (
            results.map((result: SearchResult) => (
              <div
                key={result.id}
                className="flex items-center p-2 hover:bg-accent rounded-md cursor-pointer"
              >
                <span className="flex-1">{result.name}</span>
              </div>
            ))
          ) : debouncedSearch ? (
            <div className="p-2 text-sm text-muted-foreground">No results found</div>
          ) : null}
        </div>
      </div>
    </PopoverContent>
  )
}
