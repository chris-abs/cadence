import { Section } from '@/Global/components/molecules'
import { SearchInput } from '@/Global/components/molecules/SearchInput'

interface ItemSearchProps {
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function ItemSearch({ searchQuery, onSearchChange }: ItemSearchProps) {
  return (
    <Section className="p-2">
      <div className="relative w-3/4 py-6 mx-auto">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search for items.."
          className="w-full"
        />
      </div>
    </Section>
  )
}
