import { Button, Input } from '@/Global/components/atoms'
import { Section } from '@/Global/components/molecules'

interface ItemSearchProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedTagIds: string[]
  selectedItemIds: Set<number>
  onSave: () => void
}

export function ItemSearch({
  searchQuery,
  onSearchChange,
  selectedTagIds,
  selectedItemIds,
  onSave,
}: ItemSearchProps) {
  return (
    <Section>
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-md"
        />
        <Button
          variant="default"
          onClick={onSave}
          disabled={selectedTagIds.length === 0 || selectedItemIds.size === 0}
        >
          Save Changes
        </Button>
      </div>
    </Section>
  )
}
