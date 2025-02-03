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
import { ContainerCard } from '../../atoms/card'

export const ContainerArchive = () => {
  const { data: containers, isLoading } = useContainers()

  return (
    <Section className="mb-4">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>All Containers</CardTitle>
          <CardDescription>View and manage all your storage containers</CardDescription>
        </CardHeader>
        <ScrollArea className="min-h-0 max-h-[calc(100vh-17rem)] overflow-auto">
          <CardContent>
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              <div className="flex flex-wrap gap-4 justify-center">
                {containers?.map((container) => (
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
