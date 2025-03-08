import { createFileRoute } from '@tanstack/react-router'

import { PageLayout } from '@/Global/layout/PageLayout'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/Global/components/atoms'

export const Route = createFileRoute('/_authenticated/cadence/meals/')({
  component: MealsDashboard,
})

function MealsDashboard() {
  return (
    <PageLayout>
      <div className="flex flex-col gap-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Meals Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Manage and plan your family meals.</p>
            <Button>Add New Meal</Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
