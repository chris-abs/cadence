import { Input, Label } from '@/components/atoms'
import { Tag } from '@/types'

interface TagSectionProps {
  tag: Tag | null
  emptyStateComponent?: React.ReactNode
}

export function TagSection({ tag, emptyStateComponent }: TagSectionProps) {
  if (!tag?.name) {
    return emptyStateComponent || null
  }

  return (
    <section className="bg-background border rounded-xl p-4" aria-labelledby="tag-section-title">
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <h2 id="tag-section-title" className="text-lg font-medium">
            Tag Details
          </h2>
        </header>

        <form className="space-y-2">
          <div className="space-y-2">
            <Label htmlFor="tag-name">Name</Label>
            <Input id="tag-name" value={tag.name} readOnly aria-label="Tag name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-description">Description</Label>
            <Input
              id="tag-description"
              value={tag.description || ''}
              readOnly
              aria-label="Tag description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-color">Color Sample</Label>
            <div
              className="h-9 px-3 rounded-md border flex items-center"
              style={{
                backgroundColor: tag.colour + '20',
                color: tag.colour,
                borderColor: tag.colour,
              }}
            >
              <span className="text-sm font-medium">{tag.colour}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-created">Created</Label>
            <Input
              id="tag-created"
              value={new Date(tag.createdAt).toLocaleDateString()}
              readOnly
              aria-label="Tag creation date"
            />
          </div>
        </form>
      </div>
    </section>
  )
}
