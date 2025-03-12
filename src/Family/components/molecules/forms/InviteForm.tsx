import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle } from 'lucide-react'

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@/Global/components/atoms'
import { useAuth } from '@/Global/hooks/useAuth'
import { useInviteDetails } from '@/Family/queries'
import { useJoinFamily } from '@/Family/queries'
import { AcceptInviteSchema } from '@/Family/schemas'

interface InviteFormProps {
  token?: string
}

export function InviteForm({ token }: InviteFormProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const auth = useAuth()

  const { data: invite, isError, error: inviteError } = useInviteDetails(token)

  const joinFamily = useJoinFamily()

  const form = useForm({
    resolver: zodResolver(AcceptInviteSchema),
    defaultValues: {
      token: token || '',
      password: '',
      confirmPassword: '',
    },
  })

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

  const handleSubmit = async (data: { password?: string }) => {
    if (!token) return

    setIsProcessing(true)

    try {
      if (auth.isLogged()) {
        await joinFamily.mutateAsync({ token })
        toast.success('You have joined the family successfully')
        router.navigate({ to: '/cadence' })
      } else {
        await auth.acceptInvite({
          token,
          password: data.password || '',
        })

        toast.success('Account created and family joined successfully')
        router.navigate({ to: '/cadence' })
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
        <Button className="w-full" onClick={() => handleSubmit({})} disabled={isProcessing}>
          {isProcessing ? 'Processing...' : 'Accept Invitation'}
        </Button>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Create Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter a secure password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirm your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isProcessing}>
              {isProcessing ? 'Creating Account...' : 'Create Account & Join Family'}
            </Button>
          </form>
        </Form>
      )}
    </div>
  )
}
