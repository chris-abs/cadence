import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/cadence/meals/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/cadence/meals/"!</div>
}
