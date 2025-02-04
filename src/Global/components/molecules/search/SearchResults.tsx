import { Box, Tags, FolderOpen, Package } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useDebounce } from '@/Global/hooks/useDebounce'
import { getSearchResultsByEntityType } from '@/Global/utils/search'
import { useSearch } from '@/Global/queries/search'
import { cn } from '@/Global/lib'
import { ToggleGroup, ToggleGroupItem, Tooltip, TooltipContent, TooltipTrigger } from '../../atoms'
import { H3, Muted } from '../Typography'
import type { SearchType } from '@/Global/types/search'
import { ResultsList, NoResults } from './'

const searchTypes = [
  { type: 'workspace', icon: Box, label: 'Workspaces' },
  { type: 'container', icon: FolderOpen, label: 'Containers' },
  { type: 'item', icon: Package, label: 'Items' },
  { type: 'tag', icon: Tags, label: 'Tags' },
] as const

interface SearchResultsProps {
  query: string
  onClose?: () => void
}

export function SearchResults({ query, onClose }: SearchResultsProps) {
  const [selectedTypes, setSelectedTypes] = useState<SearchType[]>(searchTypes.map((t) => t.type))
  const debouncedSearch = useDebounce(query, 300)
  const { data, isLoading } = useSearch(debouncedSearch, {
    enabled: debouncedSearch.length > 0,
  })

  const handleValueChange = (value: string[]) => {
    if (value.length > 0) {
      setSelectedTypes(value as SearchType[])
    }
  }

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  if (!query) return null

  return (
    <div
      className={cn(
        'absolute left-[12.5%] right-[12.5%] top-full z-50 mt-2',
        'rounded-lg border border-border',
        'bg-background shadow-lg',
      )}
    >
      <div className="p-4 space-y-4">
        <ToggleGroup
          type="multiple"
          value={selectedTypes}
          onValueChange={handleValueChange}
          className="w-full grid grid-cols-4 sm:flex sm:justify-start gap-2"
        >
          {searchTypes.map(({ type, icon: Icon, label }) => (
            <ToggleGroupItem
              key={type}
              value={type}
              aria-label={`Toggle ${label}`}
              className={cn(
                'flex-1 px-3',
                'bg-background hover:bg-contrast-accent',
                'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
                'transition-colors duration-200',
              )}
            >
              <div className="xl:hidden">
                <Tooltip>
                  <TooltipTrigger>
                    <Icon className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              </div>
              <div className="hidden xl:flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </div>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          {selectedTypes.map((type) => {
            const results = getSearchResultsByEntityType(data, type)
            const Icon = searchTypes.find((t) => t.type === type)?.icon || Box

            return (
              <div key={type} className="space-y-2">
                <H3 className="capitalize">{type}s</H3>
                <div className="rounded-md">
                  {isLoading ? (
                    <Muted className="p-4">Loading...</Muted>
                  ) : results.length === 0 ? (
                    <NoResults type={type} query={query} />
                  ) : (
                    <ResultsList results={results} type={type} Icon={Icon} onClose={onClose} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
