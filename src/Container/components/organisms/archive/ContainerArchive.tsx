import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Global/components/atoms'
import { Section } from '@/Global/components/molecules'
import { useContainers } from '@/Container/queries'
import { ContainerCard } from '../../atoms/card'

export const ContainerArchive = () => {
  const { data: containers, isLoading } = useContainers()

  return (
    <Section>
      <Card>
        <CardHeader>
          <CardTitle>All Containers</CardTitle>
          <CardDescription>View and manage all your storage containers</CardDescription>
        </CardHeader>
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
      </Card>
    </Section>
  )
}
