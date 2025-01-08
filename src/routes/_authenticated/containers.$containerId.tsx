import { PageLayout } from '@/components/layouts'
import { useContainer } from '@/queries/container'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/containers/$containerId')({
  component: ContainerPage,
  loader: ({ params: { containerId } }) => {
    if (!/^\d+$/.test(containerId)) throw new Error('Invalid container ID')
    return { containerId: parseInt(containerId) }
  },
})

function ContainerPage() {
  const { containerId } = Route.useParams()
  const { data: container, isLoading } = useContainer(parseInt(containerId))

  if (isLoading) return <div>Loading...</div>
  if (!container) return <div>Container not found</div>

  return (
    <PageLayout>
      <h1>{container.name}</h1>
    </PageLayout>
  )
}
