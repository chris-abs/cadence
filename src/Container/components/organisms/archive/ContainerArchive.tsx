import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
} from '@/Global/components/atoms'
import { Section } from '@/Global/components/molecules'
import { useContainers } from '@/Container/queries'
import { useContainerSearch } from '@/Global/queries/search'
import { ContainerCard } from '../../atoms/card'

interface ContainerArchiveProps {
  searchQuery: string
}

export const ContainerArchive = ({ searchQuery }: ContainerArchiveProps) => {
  const { data: containers, isLoading: isLoadingContainers } = useContainers()
  const { data: searchResults, isLoading: isSearching } = useContainerSearch(searchQuery, {
    enabled: !!searchQuery,
  })

  const displayData = searchQuery ? searchResults : containers
  const isLoading = isLoadingContainers || (!!searchQuery && isSearching)

  return (
    <Section className="mb-4">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>All Containers</CardTitle>
          <CardDescription>
            {searchQuery
              ? `Search results for "${searchQuery}"`
              : 'View and manage all your storage containers'}
          </CardDescription>
        </CardHeader>
        <ScrollArea className="min-h-0 max-h-[calc(100vh-17rem)] overflow-auto">
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 rounded-md bg-muted animate-pulse" />
                ))}
              </div>
            ) : !displayData?.length ? (
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                <span className="text-sm text-muted-foreground">
                  {searchQuery
                    ? `No containers found matching "${searchQuery}"`
                    : 'No containers found. Create one to get started.'}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 justify-center">
                {displayData.map((container) => (
                  <div key={container.id} className="shrink-0 w-[280px]">
                    <ContainerCard container={container} />
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
