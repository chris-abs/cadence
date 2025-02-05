import { Box, FolderOpen, Package, Tag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'

import { useDebounce } from '@/Global/hooks/useDebounce'
import { useSearch } from '@/Global/queries/search'
import type { SearchType } from '@/Global/types/search'
import { cn } from '@/Global/lib'
import {
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  ScrollArea,
  ScrollBar,
} from '../../atoms'
import { H3, Muted } from '../Typography'
import { ResultsList, NoResults } from './'

const searchTypes = [
  { type: 'workspace', icon: Box, label: 'Workspaces' },
  { type: 'container', icon: FolderOpen, label: 'Containers' },
  { type: 'item', icon: Package, label: 'Items' },
  { type: 'tagged_item', icon: Tag, label: 'Tagged Items' },
] as const

interface SearchResultsProps {
  query: string
  onClose?: () => void
}

export function SearchResults({ query, onClose }: SearchResultsProps) {
  const [selectedTypes, setSelectedTypes] = useState<SearchType[]>(
    searchTypes.map((t) => t.type as SearchType),
  )
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            {selectedTypes.includes('workspace') && (
              <div>
                <H3 className="mb-2">Workspaces</H3>
                <ScrollArea className="h-[200px]">
                  {isLoading ? (
                    <Muted className="p-4">Loading...</Muted>
                  ) : data?.workspaces.length === 0 ? (
                    <NoResults type="workspace" query={query} />
                  ) : (
                    <ResultsList
                      results={data?.workspaces ?? []}
                      type="workspace"
                      Icon={Box}
                      onClose={onClose}
                    />
                  )}
                </ScrollArea>
              </div>
            )}

            {selectedTypes.includes('container') && (
              <div>
                <H3 className="mb-2">Containers</H3>
                <ScrollArea className="h-[200px]">
                  {isLoading ? (
                    <Muted className="p-4">Loading...</Muted>
                  ) : data?.containers.length === 0 ? (
                    <NoResults type="container" query={query} />
                  ) : (
                    <ResultsList
                      results={data?.containers ?? []}
                      type="container"
                      Icon={FolderOpen}
                      onClose={onClose}
                    />
                  )}
                </ScrollArea>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {selectedTypes.includes('item') && (
              <div>
                <H3 className="mb-2">Items</H3>
                <ScrollArea className="h-[200px]">
                  {isLoading ? (
                    <Muted className="p-4">Loading...</Muted>
                  ) : data?.items.length === 0 ? (
                    <NoResults type="item" query={query} />
                  ) : (
                    <ResultsList
                      results={data?.items ?? []}
                      type="item"
                      Icon={Package}
                      onClose={onClose}
                    />
                  )}
                </ScrollArea>
              </div>
            )}

            {selectedTypes.includes('tagged_item') && (
              <div>
                <H3 className="mb-2">Tagged Items</H3>
                <ScrollArea className="h-[200px]">
                  {isLoading ? (
                    <Muted className="p-4">Loading...</Muted>
                  ) : data?.taggedItems.length === 0 ? (
                    <NoResults type="tagged_item" query={query} />
                  ) : (
                    <ResultsList
                      results={data?.taggedItems ?? []}
                      type="tagged_item"
                      Icon={Package}
                      onClose={onClose}
                    />
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        {data?.tags && data.tags.length > 0 && (
          <div className="border-t border-border pt-4">
            <Muted className="text-sm mb-2">Related Tags</Muted>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {data.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to="/tags/$tagId"
                    params={{ tagId: tag.id.toString() }}
                    className={cn(
                      'px-2 py-1 rounded-md whitespace-nowrap',
                      'bg-muted hover:bg-muted/80',
                      'transition-colors duration-200',
                    )}
                    onClick={onClose}
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}
