import { ScrollArea, ToggleGroup, ToggleGroupItem } from '@/Global/components/atoms'
import { Section } from '@/Global/components/molecules'
import { cn } from '@/Global/lib'
import { Tag } from '@/Tag/types'

interface TagSelectorProps {
  tags: Tag[]
  selectedTagIds: string[]
  onTagToggle: (values: string[]) => void
}

export function TagSelector({ tags, selectedTagIds, onTagToggle }: TagSelectorProps) {
  return (
    <Section>
      <ScrollArea className="w-full">
        <div className="flex gap-2 p-2 min-w-fit">
          <ToggleGroup
            type="multiple"
            value={selectedTagIds}
            onValueChange={onTagToggle}
            className="flex flex-wrap gap-2"
          >
            {tags?.map((tag) => (
              <ToggleGroupItem
                key={tag.id}
                value={String(tag.id)}
                className={cn('px-2 py-0.5 text-sm', 'flex items-center gap-1.5 whitespace-nowrap')}
                style={{
                  color: tag.colour || 'currentColor',
                }}
              >
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'currentColor' }} />
                {tag.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </ScrollArea>
    </Section>
  )
}
