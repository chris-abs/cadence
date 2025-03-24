import { createFileRoute } from '@tanstack/react-router'

import { PageLayout } from '@/Global/layout/PageLayout'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/Global/components/atoms'

export const Route = createFileRoute('/_authenticated/cadence/services/')({
  component: ServicesDashboard,
})

function ServicesDashboard() {
  return (
    <PageLayout>
      <div className="flex flex-col gap-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Services Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage and track your family's subscriptions and services.
            </p>
            <ul className="mt-4 space-y-2"></ul>
            <Button className="mt-4">Add New Service</Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
