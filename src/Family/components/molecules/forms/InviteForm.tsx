import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle } from 'lucide-react'

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  FormLabel,
  Input,
} from '@/Global/components/atoms'
import { useAuth } from '@/Global/hooks/useAuth'
import { useInviteDetails, useJoinFamily } from '@/Family/queries'

interface InviteFormProps {
  token?: string
}

export function InviteForm({ token }: InviteFormProps) {
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const auth = useAuth()

  const { data: invite, isError, error: inviteError } = useInviteDetails(token)

  const joinFamily = useJoinFamily()

  if (!token) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Invalid Invitation Link</AlertTitle>
        <AlertDescription>
          This invitation link is missing a token. Please check the link and try again.
        </AlertDescription>
      </Alert>
    )
  }

  if (isError || !invite) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Invalid Invitation</AlertTitle>
        <AlertDescription>
          {inviteError instanceof Error
            ? inviteError.message
            : 'This invitation is invalid or has expired'}
        </AlertDescription>
      </Alert>
    )
  }

  const handleSubmit = async () => {
    if (!token) return

    setIsProcessing(true)

    try {
      if (auth.isLogged()) {
        await joinFamily.mutateAsync({ token })
        toast.success('You have joined the family successfully')
        navigate({ to: '/cadence' })
      } else {
        toast.info('Please log in to accept this invitation', {
          description: 'You need an account to join a family',
        })
        navigate({
          to: '/login',
          search: {
            redirectTo: '/invite',
            token,
          },
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process invitation'
      toast.error('Failed to process invitation', {
        description: errorMessage,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Valid Invitation</AlertTitle>
        <AlertDescription>
          You've been invited to join as a <strong>{invite.role.toLowerCase()}</strong>
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <FormLabel>Email</FormLabel>
        <Input readOnly value={invite.email} className="bg-muted" />
        <p className="text-xs text-muted-foreground">
          This invitation was sent to this email address
        </p>
      </div>

      {auth.isLogged() ? (
        <Button className="w-full" onClick={() => handleSubmit()} disabled={isProcessing}>
          {isProcessing ? 'Processing...' : 'Accept Invitation'}
        </Button>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You need to log in or create an account to join this family.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => navigate({ to: '/register' })}>
              Create Account
            </Button>
            <Button onClick={() => handleSubmit()} disabled={isProcessing}>
              Sign In
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
