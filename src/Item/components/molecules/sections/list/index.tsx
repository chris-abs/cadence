import { Section } from '@/Global/components/molecules'
import { Item } from '@/Item/types'
import { ItemList } from '../../catalogue/ItemCatalogue'
import { H3 } from '@/Global/components/molecules/Typography'

interface ItemsListSectionProps {
  items: Item[]
  emptyStateComponent?: React.ReactNode
}

export function ItemsListSection({ items, emptyStateComponent }: ItemsListSectionProps) {
  if (!items?.length) {
    return emptyStateComponent || null
  }

  return (
    <Section>
      <div className="space-y-4">
        <header className="flex justify-between items-center">
          <H3 id="items-section-title">Stored Items</H3>
        </header>
        <ItemList items={items} />
      </div>
    </Section>
  )
}
