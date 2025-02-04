import { Box, Tags, FolderOpen, Package } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { useDebounce } from '@/Global/hooks/useDebounce'
import { getSearchResultsByEntityType } from '@/Global/utils/search'
import { useSearch } from '@/Global/queries/search'
import { H3, Muted } from './Typography'
import { cn } from '@/Global/lib'
import {
  ContainerSearchResult,
  ItemSearchResult,
  TagSearchResult,
  WorkspaceSearchResult,
} from '@/Collection/types/search'
import { ToggleGroup, ToggleGroupItem, Tooltip, TooltipContent, TooltipTrigger } from '../atoms'

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
interface SearchResultsProps {
  query: string
  onClose?: () => void
}

export function SearchResults({ query, onClose }: SearchResultsProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(searchTypes.map((t) => t.type))
  const debouncedSearch = useDebounce(query, 300)
  const { data, isLoading } = useSearch(debouncedSearch, { enabled: debouncedSearch.length > 0 })

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
            const results = getSearchResultsByEntityType(data, type as SearchType)
            const Icon = searchTypes.find((t) => t.type === type)?.icon || Box

            return (
              <div key={type} className="space-y-2">
                <H3 className="capitalize">{type}s</H3>
                <div className="rounded-md">
                  {isLoading ? (
                    <Muted className="p-4">Loading...</Muted>
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

const ResultsSection = ({ type, results, query, Icon, onClose }: ResultsSectionProps) => {
  if (!query.trim()) return null

  return results.length > 0 ? (
    <ResultsList results={results} type={type} Icon={Icon} onClose={onClose} />
  ) : (
    <NoResults type={type} query={query} />
  )
}

const ResultsList = ({ results, type, Icon, onClose }: ResultsListProps) => (
  <div className="grid grid-cols-1 gap-2">
    {results.map((result) => (
      <div
        key={result.id}
        className={cn(
          'border border-border rounded-md',
          'bg-background',
          'transition-colors duration-200',
        )}
      >
        <Link
          to={typeToRoute[type as SearchType](result.id)}
          className={cn(
            'flex items-center gap-3 p-3',
            'hover:bg-contrast-accent',
            'transition-colors duration-200',
          )}
          onClick={onClose}
        >
          <div className="shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <H3 className="truncate text-sm">{result.name}</H3>
            {type === 'item' && (
              <Muted className="truncate">
                Container: {/* TODO: Sort this shit out */}
                {(result as ItemSearchResult).containerName
                  ? `${(result as ItemSearchResult).containerName}${
                      (result as ItemSearchResult).containerLocation
                        ? `, ${(result as ItemSearchResult).containerLocation}`
                        : ''
                    }`
                  : 'unassigned'}
              </Muted>
            )}
            {type === 'container' && (
              <Muted className="truncate">
                Workspace: {(result as ContainerSearchResult).workspaceName || 'unassigned'}
                {(result as ContainerSearchResult).location &&
                  ` • ${(result as ContainerSearchResult).location}`}
              </Muted>
            )}
            {type === 'tag' && (
              <Muted className="truncate">{(result as TagSearchResult).itemCount || 0} items</Muted>
            )}
            {type === 'workspace' && (
              <Muted className="truncate">
                {(result as WorkspaceSearchResult).containerCount || 0} containers
              </Muted>
            )}
          </div>
        </Link>
      </div>
    ))}
  </div>
)

const NoResults = ({ type, query }: { type: string; query: string }) => (
  <div className="flex items-center gap-2 p-4">
    <Muted className="italic">
      No {type}s matching "{query}"
    </Muted>
  </div>
)
