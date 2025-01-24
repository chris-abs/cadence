import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail } from 'lucide-react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/Global/components/atoms'
import { Muted } from '@/Global/components/molecules/Typography'

interface EmailChangeModalProps {
  isOpen: boolean
  onClose: () => void
  currentEmail: string
  onUpdate: (data: { email: string }) => Promise<void>
  isUpdating: boolean
}

const emailChangeSchema = z.object({
  newEmail: z
    .string()
    .email('Please enter a valid email address')
    .refine((email) => email.length > 0, 'Email is required'),
  currentPassword: z.string().min(1, 'Current password is required for security verification'),
})

type EmailChangeForm = z.infer<typeof emailChangeSchema>

export function EmailChangeModal({
  isOpen,
  onClose,
  currentEmail,
  onUpdate,
  isUpdating,
}: EmailChangeModalProps) {
  const [step, setStep] = useState<'verify' | 'confirm'>('verify')

  const form = useForm<EmailChangeForm>({
    resolver: zodResolver(emailChangeSchema),
    defaultValues: {
      newEmail: '',
      currentPassword: '',
    },
  })

  const handleSubmit = async (data: EmailChangeForm) => {
    try {
      if (step === 'verify') {
        // TODO: password verify perhaps?
        setStep('confirm')
        return
      }

      await onUpdate({ email: data.newEmail })
      form.reset()
      setStep('verify')
      onClose()
    } catch (error) {
      // TODO: sort this shit
      console.error(error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Email Address</DialogTitle>
          <DialogDescription>
            Update your email address. This change requires password verification and email
            confirmation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Muted>Current Email</Muted>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{currentEmail}</span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your new email"
                        {...field}
                        className="bg-background text-foreground border-border"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your current password"
                        {...field}
                        className="bg-background text-foreground border-border"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isUpdating}
                className="hover:bg-contrast-accent"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Processing...' : step === 'verify' ? 'Verify' : 'Confirm Change'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
