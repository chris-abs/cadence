import { Box, Tags, FolderOpen, Package } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useDebounce } from '@/hooks/useDebounce'
import { useSearch } from '@/queries/search'
import { SearchResult, SearchType } from '@/types/search'
import { useEffect, useState } from 'react'
import { ToggleGroup, ToggleGroupItem, Tooltip, TooltipContent, TooltipTrigger } from '../atoms'
import { getSearchResultsByEntityType } from '@/utils/search'

const searchTypes: { type: SearchType; icon: typeof Box; label: string }[] = [
  { type: 'workspace', icon: Box, label: 'Workspaces' },
  { type: 'container', icon: FolderOpen, label: 'Containers' },
  { type: 'item', icon: Package, label: 'Items' },
  { type: 'tag', icon: Tags, label: 'Tags' },
]

const typeToRoute = {
  workspace: (id: number) => `/workspaces/${id}`,
  container: (id: number) => `/containers/${id}`,
  item: (id: number) => `/items/${id}`,
  tag: (id: number) => `/tags/${id}`,
} as const

interface ResultsListProps {
  results: SearchResult[]
  type: string
  Icon: typeof Box
  onClose?: () => void
}

interface ResultsSectionProps extends ResultsListProps {
  query: string
}

const ResultsList = ({ results, type, Icon, onClose }: ResultsListProps) => (
  <div className="grid grid-cols-1 gap-2">
    {results.map((result) => (
      <div key={result.id} className="bg-muted/50 border rounded-md">
        {' '}
        <Link
          to={typeToRoute[type as SearchType](result.id)}
          className="flex items-center gap-2 p-3 hover:bg-accent"
          onClick={onClose}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1">{result.name}</span>
          {result.description && (
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {result.description}
            </span>
          )}
        </Link>
      </div>
    ))}
  </div>
)

const NoResults = ({ type, query }: { type: string; query: string }) => (
  <div className="flex items-center gap-2 p-4">
    <span className="text-sm text-muted-foreground italic">
      No {type}s matching "{query}"
    </span>
  </div>
)

const ResultsSection = ({ type, results, query, Icon, onClose }: ResultsSectionProps) => {
  if (!query.trim()) return null

  return results.length > 0 ? (
    <ResultsList results={results} type={type} Icon={Icon} onClose={onClose} />
  ) : (
    <NoResults type={type} query={query} />
  )
}

interface SearchResultsProps {
  query: string
  onClose?: () => void
}

export function SearchResults({ query, onClose }: SearchResultsProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(searchTypes.map((t) => t.type))
  const debouncedSearch = useDebounce(query, 300)

  const { data, isLoading } = useSearch(debouncedSearch, {
    enabled: debouncedSearch.length > 0,
  })

  const handleValueChange = (value: string[]) => {
    if (value.length > 0) {
      setSelectedTypes(value)
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
    <div className="absolute left-[12.5%] right-[12.5%] top-full z-50 mt-2 rounded-lg border bg-background shadow-lg">
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
              className="flex-1 px-3 data-[state=on]:bg-slate-900 data-[state=on]:text-white bg-accent/50 hover:bg-accent"
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
            const results = getSearchResultsByEntityType(data, type as SearchType)
            const Icon = searchTypes.find((t) => t.type === type)?.icon || Box

            return (
              <div key={type} className="space-y-2">
                <h3 className="font-medium capitalize">{type}s</h3>
                <div className="rounded-md">
                  {isLoading ? (
                    <div className="p-4 text-sm text-muted-foreground">Loading...</div>
                  ) : (
                    <ResultsSection
                      type={type}
                      results={results}
                      query={query}
                      Icon={Icon}
                      onClose={onClose}
                    />
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
