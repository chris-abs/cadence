import { createFileRoute } from '@tanstack/react-router'

import { Button, Card, CardContent, CardHeader, CardTitle } from '@/Global/components/atoms'
import { PageLayout } from '@/Global/layout/PageLayout'

export const Route = createFileRoute('/_authenticated/cadence/chores/')({
  component: ChoresDashboard,
})

function ChoresDashboard() {
  return (
    <PageLayout>
      <div className="flex flex-col gap-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Chores Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Manage and assign household chores.</p>
            <Button>Add New Chore</Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
