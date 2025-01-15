import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FolderOpen } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/entity/Global/components/atoms/Form'
import { Alert, AlertDescription, Button, Input } from '@/entity/Global/components/atoms'
import { createContainerSchema, type CreateContainerData } from '@/schemas/container'

interface ContainerFormProps {
  onSubmit: (data: CreateContainerData) => Promise<void>
  error?: Error | null
  isLoading?: boolean
}

export function ContainerForm({ onSubmit, error, isLoading }: ContainerFormProps) {
  const form = useForm<CreateContainerData>({
    resolver: zodResolver(createContainerSchema),
    defaultValues: {
      name: '',
      location: '',
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
                  <FolderOpen className="h-4 w-4" />
                  <Input placeholder="Enter container name" {...field} />
                </div>
              </FormControl>
              <FormDescription>A unique name to identify your container</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Garage, Basement, Storage Unit" {...field} />
              </FormControl>
              <FormDescription>Where this container is physically stored</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Container'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
