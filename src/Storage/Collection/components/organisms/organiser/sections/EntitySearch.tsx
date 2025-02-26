import { Plus, Box, FolderOpen, Package, Tags } from 'lucide-react'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Global/components/atoms'
import { EntityType } from '@/Storage/Collection/types'
import { SearchInput, SearchResults } from '@/Global/components/molecules/search'

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
      <div className="relative w-3/4 py-6 mx-auto">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search across your entire collection..."
        >
          <SearchResults query={searchQuery} onClose={() => onSearchChange('')} />
        </SearchInput>
      </div>
    </div>
  )
}
