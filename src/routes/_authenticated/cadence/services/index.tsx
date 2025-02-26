import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/cadence/services/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/cadence/services/"!</div>
}
