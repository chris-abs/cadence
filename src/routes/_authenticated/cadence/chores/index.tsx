import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/cadence/chores/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/cadence/chores/"!</div>
}
