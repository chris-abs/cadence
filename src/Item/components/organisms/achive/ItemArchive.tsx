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
import { useItems } from '@/Item/queries'
import { ItemCard } from '../../atoms/card'
import { useItemSearch } from '@/Global/queries/search'

interface ItemArchiveProps {
  searchQuery: string
}

export const ItemArchive = ({ searchQuery }: ItemArchiveProps) => {
  const { data: items, isLoading: isLoadingItems } = useItems()
  const { data: searchResults, isLoading: isSearching } = useItemSearch(searchQuery, {
    enabled: !!searchQuery,
  })
  const { isCompact } = useSettingsStore()

  const displayData = searchQuery ? searchResults : items
  const isLoading = isLoadingItems || (!!searchQuery && isSearching)

  return (
    <Section>
      <Card className="h-fit">
        <CardHeader>
          <div className="flex justify-between items-center flex-shrink-0">
            <div>
              <CardTitle>All Items</CardTitle>
              <CardDescription>
                {searchQuery
                  ? `Search results for "${searchQuery}"`
                  : 'View and manage all your inventory items'}
              </CardDescription>
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
            ) : !displayData?.length ? (
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                <span className="text-sm text-muted-foreground">
                  {searchQuery
                    ? `No items found matching "${searchQuery}"`
                    : 'No items found. Create one to get started.'}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 justify-center">
                {displayData.map((item) => (
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
        </ScrollArea>
      </Card>
    </Section>
  )
}
