import { memo } from 'react'
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

const TagItem = memo(
  ({ tag, isSelected, onSelect }: { tag: Tag; isSelected: boolean; onSelect: () => void }) => (
    <CommandItem value={tag.name} onSelect={onSelect} className="cursor-pointer">
      <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: tag.colour }} />
      <span className="flex-1">{tag.name}</span>
      {isSelected && <Check className="h-4 w-4 ml-2" />}
    </CommandItem>
  ),
)

TagItem.displayName = 'TagItem'

export function TagSelector({ selectedTags, onChange, isOpen, onOpenChange }: TagSelectorProps) {
  const { data: allTags, isLoading } = useTags()

  const handleTagSelect = (selectedTag: Tag) => {
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
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 py-1 text-sm border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground"
        >
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
                  <TagItem
                    key={tag.id}
                    tag={tag}
                    isSelected={selectedTags.some((t) => t.id === tag.id)}
                    onSelect={() => handleTagSelect(tag)}
                  />
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
