import { Check, Plus, Loader2 } from 'lucide-react'

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/Global/components/atoms'
import { Tag } from '@/Tag/types'
import { useTags } from '@/Tag/queries'

interface TagSelectorProps {
  selectedTags: Tag[]
  onChange: (tags: Tag[]) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function TagSelector({ selectedTags, onChange, isOpen, onOpenChange }: TagSelectorProps) {
  const { data: allTags, isLoading } = useTags()

  const handleSelect = (value: string) => {
    const selectedTag = allTags?.find((tag) => tag.name === value)
    if (!selectedTag) return

    const isSelected = selectedTags.some((tag) => tag.id === selectedTag.id)
    if (isSelected) {
      onChange(selectedTags.filter((tag) => tag.id !== selectedTag.id))
    } else {
      onChange([...selectedTags, selectedTag])
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search tags..." />
          <CommandList>
            <CommandEmpty>No tags found</CommandEmpty>
            <CommandGroup>
              {isLoading && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              {!isLoading &&
                allTags?.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={handleSelect}
                    className="cursor-pointer"
                  >
                    <div
                      className="h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: tag.colour }}
                    />
                    <span className="flex-1">{tag.name}</span>
                    {selectedTags.some((t) => t.id === tag.id) && (
                      <Check className="h-4 w-4 ml-2" />
                    )}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
