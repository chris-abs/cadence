import { createFileRoute, Link } from '@tanstack/react-router'
import { FolderOpen } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/Global/components/atoms'
import { PageLayout } from '@/Global/layout/PageLayout'
import { ContainerDetail } from '@/Storage/Container/components/organisms/detail/ContainerDetail'
import { useContainer } from '@/Storage/Container/queries'

export const Route = createFileRoute('/_authenticated/cadence/storage/containers/$containerId')({
  component: ContainerPage,
})

function ContainerPage() {
  const { containerId } = Route.useParams()
  const parsedContainerId = parseInt(containerId)
  const { data: container } = useContainer(parsedContainerId)

  if (!container) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Alert>
            <FolderOpen className="h-4 w-4" />
            <AlertTitle>No Containers have been found...</AlertTitle>
            <AlertDescription>
              You can create Containers in the{' '}
              <Link className="underline" to="/">
                Dashboard
              </Link>{' '}
              and use them to store Items for better organising!
            </AlertDescription>
          </Alert>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <ContainerDetail container={container} />
      </div>
    </PageLayout>
  )
}
