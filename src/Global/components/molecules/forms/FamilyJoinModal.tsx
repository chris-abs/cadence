import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Ticket } from 'lucide-react'

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
} from '@/Global/components/atoms'
import { JoinFamilyData, joinFamilySchema } from '@/Global/schemas/family'

interface FamilyJoinFormProps {
  onSubmit: (data: JoinFamilyData) => Promise<void>
  error?: Error | null
  isLoading?: boolean
}

export function FamilyJoinForm({ onSubmit, error, isLoading }: FamilyJoinFormProps) {
  const form = useForm<JoinFamilyData>({
    resolver: zodResolver(joinFamilySchema),
    defaultValues: {
      token: '',
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
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invitation Token</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Enter invitation token" {...field} />
                </div>
              </FormControl>
              <FormDescription>Paste the invitation token you received</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Joining...' : 'Join Family'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
