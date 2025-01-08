import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/tags/$tagId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/tags/$tagId"!</div>
}
