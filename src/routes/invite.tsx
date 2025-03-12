import { createFileRoute } from '@tanstack/react-router'
import { Crown } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Global/components/atoms'
import { AuthPageWrapper } from '@/Global/components/molecules'
import { InviteForm } from '@/Family/components/molecules/forms/InviteForm'

interface InviteSearchParams {
  token?: string
}

export const Route = createFileRoute('/invite')({
  component: InvitePage,
  validateSearch: (search: Record<string, unknown>): InviteSearchParams => {
    return {
      token: search.token as string | undefined,
    }
  },
})

function InvitePage() {
  const { token } = Route.useSearch()

  return (
    <AuthPageWrapper>
      <div className="w-full max-w-[500px]">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar-primary text-background">
            <Crown />
          </div>
        </div>

        <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Family Invitation</CardTitle>
            <CardDescription>You've been invited to join a family on Cadence</CardDescription>
          </CardHeader>
          <CardContent>
            <InviteForm token={token} />
          </CardContent>
        </Card>
      </div>
    </AuthPageWrapper>
  )
}
