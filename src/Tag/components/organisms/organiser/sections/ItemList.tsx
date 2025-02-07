import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
} from '@/Global/components/atoms'
import { Section, ViewToggle } from '@/Global/components/molecules'
import { useSettingsStore } from '@/Global/stores/useSettingsStore'
import { cn } from '@/Global/lib'
import { SelectableItemCard } from '@/Item/components/atoms/card'
import { Item } from '@/Item/types'

interface ItemListProps {
  items: Item[]
  selectedItemIds: Set<number>
  onItemToggle: (itemId: number) => void
  isLoading: boolean
}

export function ItemList({ items, selectedItemIds, onItemToggle, isLoading }: ItemListProps) {
  const { isCompact } = useSettingsStore()

  return (
    <Section>
      <ScrollArea className="min-h-0 max-h-[calc(100vh-31rem)] overflow-auto">
        <Card className="h-fit">
          <CardHeader>
            <div className="flex justify-between items-center flex-shrink-0">
              <div>
                <CardTitle>All Items</CardTitle>
                <CardDescription>Select items to assign tags to.</CardDescription>
              </div>
              <ViewToggle />
            </div>
          </CardHeader>
          <ScrollArea className="min-h-0 max-h-[calc(100vh-19rem)] overflow-auto">
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'rounded-md bg-muted animate-pulse',
                        isCompact ? 'h-[100px]' : 'h-[200px]',
                      )}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 p-2 justify-center">
                  {items.map((item) => (
                    <SelectableItemCard
                      key={item.id}
                      item={item}
                      isSelected={selectedItemIds.has(item.id)}
                      onSelect={onItemToggle}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </ScrollArea>
    </Section>
  )
}
