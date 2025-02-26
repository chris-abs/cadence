import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
} from '@/Global/components/atoms'
import { Section } from '@/Global/components/molecules'
import { useTags } from '@/Tag/queries'
import { useTagSearch } from '@/Global/queries/search'
import { TagCard } from '../../atoms/card'

interface TagArchiveProps {
  searchQuery: string
}

export const TagArchive = ({ searchQuery }: TagArchiveProps) => {
  const { data: tags, isLoading: isLoadingTags } = useTags()
  const { data: searchResults, isLoading: isSearching } = useTagSearch(searchQuery, {
    enabled: !!searchQuery,
  })

  const displayData = searchQuery ? searchResults : tags
  const isLoading = isLoadingTags || (!!searchQuery && isSearching)

  return (
    <Section className="mb-4">
      <Card className="h-fit">
        <CardHeader>
          <div className="flex justify-between items-center flex-shrink-0">
            <div>
              <CardTitle>All Tags</CardTitle>
              <CardDescription>
                {searchQuery
                  ? `Search results for "${searchQuery}"`
                  : 'View and manage all your item tags'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <ScrollArea className="min-h-0 max-h-[calc(100vh-17rem)] overflow-auto">
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
                ))}
              </div>
            ) : !displayData?.length ? (
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                <span className="text-sm text-muted-foreground">
                  {searchQuery
                    ? `No tags found matching "${searchQuery}"`
                    : 'No tags found. Create one to get started.'}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 justify-center">
                {displayData.map((tag) => (
                  <div key={tag.id} className="shrink-0 w-[240px]">
                    <TagCard tag={tag} />
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
