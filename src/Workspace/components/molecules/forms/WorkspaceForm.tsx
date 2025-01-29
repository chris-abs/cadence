import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Box } from 'lucide-react'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
  Alert,
  AlertDescription,
  Button,
  Input,
  Textarea,
} from '@/Global/components/atoms'
import { CreateWorkspaceData, createWorkspaceSchema } from '@/Workspace/schemas'

interface WorkspaceFormProps {
  onSubmit: (data: CreateWorkspaceData) => Promise<void>
  error?: Error | null
  isLoading?: boolean
}

export function WorkspaceForm({ onSubmit, error, isLoading }: WorkspaceFormProps) {
  const form = useForm<CreateWorkspaceData>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      description: '',
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  <Input placeholder="Enter workspace name" {...field} />
                </div>
              </FormControl>
              <FormDescription>
                Give your workspace a descriptive name (e.g., Garage, Workshop)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this workspace is used for..."
                  className="min-h-[100px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional details about this workspace and its purpose
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Workspace'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
