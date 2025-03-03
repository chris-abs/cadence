import { Mail, AlertTriangle, CheckCircle } from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Global/components/atoms'
import { Section } from '@/Global/components/molecules'
import { FamilyInvite } from '@/Family/types'

interface FamilyInvitesSectionProps {
  invites: FamilyInvite[] | undefined
  isParent: boolean
  isLoading: boolean
  onResend?: (invite: FamilyInvite) => void
  onCancel?: (invite: FamilyInvite) => void
}

export function FamilyInvitesSection({
  invites,
  isParent,
  isLoading,
  onResend,
  onCancel,
}: FamilyInvitesSectionProps) {
  const getExpiryText = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt)
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return 'Expired'
    } else if (diffDays === 0) {
      return 'Expires today'
    } else if (diffDays === 1) {
      return 'Expires tomorrow'
    } else {
      return `Expires in ${diffDays} days`
    }
  }

  return (
    <Section>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invites
          </CardTitle>
          <CardDescription>Track and manage pending family invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-4 p-3 bg-muted/50 text-sm font-medium">
              <div>Email</div>
              <div>Role</div>
              <div>Expires</div>
              <div className="text-right">Actions</div>
            </div>

            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading invites...</p>
              </div>
            ) : !invites || invites.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <p>No pending invites</p>
                <p className="text-sm">Invite new members using the button above</p>
              </div>
            ) : (
              invites.map((invite) => (
                <div key={invite.id} className="grid grid-cols-4 p-3 items-center border-t text-sm">
                  <div className="text-muted-foreground">{invite.email}</div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        invite.role === 'PARENT'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                      }`}
                    >
                      {invite.role === 'PARENT' ? 'Parent' : 'Child'}
                    </span>
                  </div>
                  <div className="text-muted-foreground">{getExpiryText(invite.expiresAt)}</div>
                  <div className="flex justify-end gap-2">
                    {isParent && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onResend && onResend(invite)}
                          title="Resend invite"
                        >
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onCancel && onCancel(invite)}
                          title="Cancel invite"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}
