import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { PageLayout } from '@/Global/layout/PageLayout'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/Global/components/atoms'

export const Route = createFileRoute('/_authenticated/cadence/meals/')({
  component: MealsDashboard,
})

type Meal = {
  day: string
  meal: string
}

function MealsDashboard() {
  const [mealPlan, setMealPlan] = useState<Meal[]>([
    { day: 'Monday', meal: '' },
    { day: 'Tuesday', meal: '' },
    { day: 'Wednesday', meal: '' },
    { day: 'Thursday', meal: '' },
    { day: 'Friday', meal: '' },
    { day: 'Saturday', meal: '' },
    { day: 'Sunday', meal: '' },
  ])

  const handleMealChange = (day: string, meal: string) => {
    const updatedMealPlan = mealPlan.map((item) => (item.day === day ? { ...item, meal } : item))
    setMealPlan(updatedMealPlan)
  }

  return (
    <PageLayout>
      <div className="flex flex-col gap-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Meals Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Manage and plan your family meals.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {mealPlan.map((meal) => (
                <div key={meal.day} className="flex flex-col gap-2">
                  <Label htmlFor={meal.day}>{meal.day}</Label>
                  <Input
                    type="text"
                    id={meal.day}
                    placeholder="Enter meal"
                    value={meal.meal}
                    onChange={(e) => handleMealChange(meal.day, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <Button className="mt-4">Add New Meal</Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
