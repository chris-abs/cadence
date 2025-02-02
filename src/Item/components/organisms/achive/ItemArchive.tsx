import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Global/components/atoms'
import { Section, ViewToggle } from '@/Global/components/molecules'
import { useSettingsStore } from '@/Global/stores/useSettingsStore'
import { cn } from '@/Global/lib'
import { useItems } from '@/Item/queries'
import { ItemCard } from '../../atoms/card'

export const ItemArchive = () => {
  const { data: items, isLoading } = useItems()
  const { isCompact } = useSettingsStore()

  return (
    <Section>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-shrink-0">
            <div>
              <CardTitle>All Items</CardTitle>
              <CardDescription>View and manage all your inventory items</CardDescription>
            </div>
            <ViewToggle />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="flex flex-wrap gap-4 justify-center">
              {items?.map((item) => (
                <div
                  key={item.id}
                  className={cn('shrink-0', isCompact ? 'w-[200px]' : 'w-[280px]')}
                >
                  <ItemCard item={item} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Section>
  )
}
