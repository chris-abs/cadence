import {
  Input,
  Label,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/atoms'
import { Item } from '@/types'

interface ItemSectionProps {
  item: Item | null
  emptyStateComponent?: React.ReactNode
}

export function ItemSection({ item, emptyStateComponent }: ItemSectionProps) {
  if (!item?.name) {
    return emptyStateComponent || null
  }

  return (
    <section className="bg-background border rounded-xl p-4" aria-labelledby="item-section-title">
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <h2 id="item-section-title" className="text-lg font-medium">
            Item Details
          </h2>
        </header>

        <div className="grid grid-cols-2 gap-4" role="group" aria-label="Item information">
          <div className="row-span-4 flex flex-col items-center justify-center">
            <Label className="text-center mb-1.5">Image</Label>
            <div className="w-64 relative">
              <Carousel className="w-full">
                <CarouselContent>
                  <CarouselItem>
                    <div className="p-1">
                      <div className="overflow-hidden rounded-lg border">
                        {item.imgUrl ? (
                          <img
                            src={item.imgUrl}
                            alt={item.name}
                            className="aspect-square w-full object-cover"
                          />
                        ) : (
                          <div className="aspect-square w-full bg-muted flex items-center justify-center">
                            <span className="text-sm text-muted-foreground">
                              No image available
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="hidden" />
                <CarouselNext className="hidden" />
              </Carousel>
            </div>
          </div>

          <form className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor="item-name">Name</Label>
              <Input id="item-name" value={item.name} readOnly aria-label="Item name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <Input
                id="item-description"
                value={item.description || ''}
                readOnly
                aria-label="Item description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-quantity">Quantity</Label>
              <Input
                id="item-quantity"
                value={item.quantity.toString()}
                readOnly
                aria-label="Item quantity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-created">Created</Label>
              <Input
                id="item-created"
                value={new Date(item.createdAt).toLocaleDateString()}
                readOnly
                aria-label="Item creation date"
              />
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
