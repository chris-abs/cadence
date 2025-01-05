import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layouts/PageLayout'

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
