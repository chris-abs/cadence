import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Global/components/atoms'
import { PageLayout } from '@/Global/layout/PageLayout'

export const Route = createFileRoute('/_authenticated/cadence/chores/')({
  component: ChoresDashboard,
})

function ChoresDashboard() {
  const [filter, setFilter] = useState('all')

  return (
    <PageLayout>
      <div className="flex flex-col gap-4 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Chores Overview</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Chores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chores</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Manage and assign household chores.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="chore-streak">Longest Chore Streak</Label>
                <Input type="text" id="chore-streak" placeholder="7 Days (Dishes)" readOnly />
              </div>
              <div>
                <Label htmlFor="total-chores">Total Chores Completed</Label>
                <Input type="text" id="total-chores" placeholder="125" readOnly />
              </div>
            </div>
            <Button className="mt-4">Add New Chore</Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
