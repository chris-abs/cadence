import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useDebounce } from '@/hooks/useDebounce'
import { useSearch } from '@/queries/search'
import { SearchResult, SearchType } from '@/types/search'
import { Input } from '@/components/atoms/Input'
import { PopoverContent } from '@/components/atoms/Popover'
import { Box, Tags, FolderOpen, Package } from 'lucide-react'

const typeToIcon = {
  workspace: Box,
  container: FolderOpen,
  item: Package,
  tag: Tags,
} as const

const typeToRoute = {
  workspace: (id: number) => `/workspaces/${id}`,
  container: (id: number) => `/containers/${id}`,
  item: (id: number) => `/items/${id}`,
  tag: (id: number) => `/tags/${id}`,
} as const

export function QuickSearch({ type }: { type: SearchType }) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useSearch(debouncedSearch, {
    enabled: debouncedSearch.length > 0,
  })

  const results = data?.[`${type}s`] ?? []
  const Icon = typeToIcon[type]

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
              <Link
                key={result.id}
                to={typeToRoute[type](result.id)}
                className="flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer text-sm text-muted-foreground hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{result.name}</span>
                {result.description && (
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {result.description}
                  </span>
                )}
              </Link>
            ))
          ) : debouncedSearch ? (
            <div className="p-2 text-sm text-muted-foreground">
              No {type} found for "{debouncedSearch}"
            </div>
          ) : null}
        </div>
      </div>
    </PopoverContent>
  )
}
