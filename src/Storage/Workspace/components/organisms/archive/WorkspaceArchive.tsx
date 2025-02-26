import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
} from '@/Global/components/atoms'
import { Section } from '@/Global/components/molecules'
import { useWorkspaces } from '@/Workspace/queries'
import { useWorkspaceSearch } from '@/Global/queries/search'
import { WorkspaceCard } from '../../atoms/card'

interface WorkspaceArchiveProps {
  searchQuery: string
}

export const WorkspaceArchive = ({ searchQuery }: WorkspaceArchiveProps) => {
  const { data: workspaces, isLoading: isLoadingWorkspaces } = useWorkspaces()
  const { data: searchResults, isLoading: isSearching } = useWorkspaceSearch(searchQuery, {
    enabled: !!searchQuery,
  })

  const displayData = searchQuery ? searchResults : workspaces
  const isLoading = isLoadingWorkspaces || (!!searchQuery && isSearching)

  return (
    <Section className="mb-4">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>All Workspaces</CardTitle>
          <CardDescription>
            {searchQuery
              ? `Search results for "${searchQuery}"`
              : 'View and manage all your organisational workspaces'}
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
                    ? `No workspaces found matching "${searchQuery}"`
                    : 'No workspaces found. Create one to get started.'}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 justify-center">
                {displayData.map((workspace) => (
                  <div key={workspace.id} className="shrink-0 w-[320px]">
                    <WorkspaceCard workspace={workspace} />
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
