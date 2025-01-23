import { Section } from '@/Global/components/molecules'
import { H2 } from '@/Global/components/molecules/Typography'
import { Item } from '@/Item/types'
import { ItemList } from '../../catalogue/ItemCatalogue'

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
          <H2 id="items-section-title">Tagged Items</H2>
        </header>
        <ItemList items={items} />
      </div>
    </Section>
  )
}
