import { PageLayout } from '@/components/layouts'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/')({
  component: Homepage,
})

function Homepage() {
  return (
    <PageLayout>
      <div className="p-2">
        <h3>Welcome Home!</h3>
        <p>You are logged in!</p>
      </div>
    </PageLayout>
  )
}
