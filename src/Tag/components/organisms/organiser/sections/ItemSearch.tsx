import { Button } from '@/Global/components/atoms'
import { Section } from '@/Global/components/molecules'
import { SearchInput } from '@/Global/components/molecules/SearchInput'

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
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search for items.."
          className="max-w-xl"
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
