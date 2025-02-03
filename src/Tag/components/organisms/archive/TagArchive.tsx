import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Global/components/atoms'
import { Section } from '@/Global/components/molecules'
import { useTags } from '@/Tag/queries'
import { TagCard } from '../../atoms/card'

export const TagArchive = () => {
  const { data: tags, isLoading } = useTags()

  return (
    <Section>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-shrink-0">
            <div>
              <CardTitle>All Tags</CardTitle>
              <CardDescription>View and manage all your item tags</CardDescription>
            </div>
          </div>
        </CardHeader>
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
      </Card>
    </Section>
  )
}
