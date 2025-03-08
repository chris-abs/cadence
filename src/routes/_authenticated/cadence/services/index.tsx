import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { PageLayout } from '@/Global/layout/PageLayout'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/Global/components/atoms'

export const Route = createFileRoute('/_authenticated/cadence/services/')({
  component: ServicesDashboard,
})

type Service = {
  id: string
  name: string
  description: string
  cost: number
  renewalDate: string
}

function ServicesDashboard() {
  const [services, setServices] = useState<Service[]>([
    {
      id: '1',
      name: 'Netflix',
      description: 'Streaming service for movies and TV shows',
      cost: 15.99,
      renewalDate: '2024-07-15',
    },
    {
      id: '2',
      name: 'Spotify',
      description: 'Music streaming service',
      cost: 9.99,
      renewalDate: '2024-07-22',
    },
  ])

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
            <ul className="mt-4 space-y-2">
              {services.map((service) => (
                <li key={service.id} className="border rounded-md p-4 shadow-sm">
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  <p className="text-sm text-gray-500">{service.description}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-gray-700">Cost: \( {service.cost} \)</span>
                    <span className="text-sm text-gray-700">Renewal: {service.renewalDate}</span>
                  </div>
                </li>
              ))}
            </ul>
            <Button className="mt-4">Add New Service</Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
