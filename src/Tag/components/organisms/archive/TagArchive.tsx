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
import { TagCard } from '../../atoms/card'

export const TagArchive = () => {
  const { data: tags, isLoading } = useTags()

  return (
    <Section className="mb-4">
      <Card className="h-fit">
        <CardHeader>
          <div className="flex justify-between items-center flex-shrink-0">
            <div>
              <CardTitle>All Tags</CardTitle>
              <CardDescription>View and manage all your item tags</CardDescription>
            </div>
          </div>
        </CardHeader>
        <ScrollArea className="min-h-0 max-h-[calc(100vh-17rem)] overflow-auto">
          <CardContent>
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              <div className="flex flex-wrap gap-4 justify-center">
                {tags?.map((tag) => (
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
