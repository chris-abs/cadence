import {
  BadgeToggle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
  ScrollBar,
} from '@/Global/components/atoms'
import { Section } from '@/Global/components/molecules'
import { SimplifiedTag, Tag } from '@/Tag/types'

interface TagSelectorProps {
  tags: Tag[]
  selectedTagIds: string[]
  selectedItemIds: Set<number>
  onTagToggle: (values: string[]) => void
  onSave: () => void
  onCancel: () => void
  isUpdating: boolean
}

export function TagSelector({
  tags,
  selectedTagIds,
  selectedItemIds,
  onTagToggle,
  onSave,
  onCancel,
  isUpdating,
}: TagSelectorProps) {
  const handleTagToggle = (tagId: string, isActive: boolean) => {
    if (isActive) {
      onTagToggle([...selectedTagIds, tagId])
    } else {
      onTagToggle(selectedTagIds.filter((id) => id !== tagId))
    }
  }

  return (
    <Section>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-shrink-0">
            <div className="flex flex-col gap-2">
              <CardTitle>All Tags</CardTitle>
              <CardDescription>
                Select any number of tags and items to tag selected items, dont forget to save!
              </CardDescription>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                disabled={isUpdating}
                className="hover:bg-contrast-accent"
              >
                Cancel
              </Button>
              <Button
                onClick={onSave}
                disabled={isUpdating || selectedTagIds.length === 0 || selectedItemIds.size === 0}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex">
            <ScrollArea type="always" className="w-1 flex-1">
              <div className="min-w-max">
                <div className="flex flex-wrap gap-2 p-4 pb-6">
                  {tags?.map((tag) => {
                    const simplifiedTag: SimplifiedTag = {
                      id: tag.id,
                      name: tag.name,
                      colour: tag.colour,
                    }
                    return (
                      <BadgeToggle
                        key={tag.id}
                        tag={simplifiedTag}
                        isActive={selectedTagIds.includes(String(tag.id))}
                        onToggle={(isActive) => handleTagToggle(String(tag.id), isActive)}
                      />
                    )
                  })}
                </div>
              </div>
              <ScrollBar orientation="horizontal" className="w-full" />
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}
