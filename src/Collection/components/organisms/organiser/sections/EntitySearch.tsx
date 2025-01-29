import { Plus, Box, FolderOpen, Package, Tags, Search } from 'lucide-react'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from '@/Global/components/atoms'
import { SearchResults } from '@/Global/components/molecules'
import { EntityType } from '@/Global/types'

interface EntitySearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onCreateEntity: (type: EntityType) => void
}

export function EntitySearch({ searchQuery, onSearchChange, onCreateEntity }: EntitySearchProps) {
  return (
    <div className="bg-background border rounded-xl">
      <div className="flex shrink-0 items-center justify-between p-4">
        <h1 className="text-xl font-semibold">Collections Overview</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onCreateEntity('workspace')}>
              <Box className="mr-2 h-4 w-4" />
              New Workspace
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateEntity('container')}>
              <FolderOpen className="mr-2 h-4 w-4" />
              New Container
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateEntity('item')}>
              <Package className="mr-2 h-4 w-4" />
              New Item
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCreateEntity('tag')}>
              <Tags className="mr-2 h-4 w-4" />
              New Tag
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="relative w-3/4 mx-auto">
        <div className="relative pb-4 pt-4">
          <div className="relative cursor-text">
            <Input
              type="search"
              placeholder="Search across all collections..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-12 pl-4 pr-16 radius-xl [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-14 top-0 h-12 px-2 hover:text-foreground text-muted-foreground"
              >
                ✕
              </button>
            )}
            <Button
              variant="default"
              size="icon"
              className="absolute right-0 top-0 radius-xl rounded-l-none h-12 w-12"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {searchQuery.trim() && (
          <SearchResults query={searchQuery} onClose={() => onSearchChange('')} />
        )}
      </div>
    </div>
  )
}
