import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, UserPlus } from 'lucide-react'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Alert,
  AlertDescription,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Global/components/atoms'
import { CreateInviteData, createInviteSchema } from '@/Global/schemas/family'

interface InviteFormProps {
  onSubmit: (data: CreateInviteData) => Promise<void>
  error?: Error | null
  isLoading?: boolean
}

export function FamilyInviteForm({ onSubmit, error, isLoading }: InviteFormProps) {
  const form = useForm<CreateInviteData>({
    resolver: zodResolver(createInviteSchema),
    defaultValues: {
      email: '',
      role: 'CHILD',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Enter email address" {...field} />
                </div>
              </FormControl>
              <FormDescription>The email address of the person you want to invite</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PARENT">Parent</SelectItem>
                  <SelectItem value="CHILD">Child</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Parents can manage the family and all modules. Children have limited access.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
