import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Package } from 'lucide-react'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/Global/components/atoms/Form'
import { Alert, AlertDescription, Button, Input, Textarea } from '@/Global/components/atoms'
import { CreateItemData, createItemSchema } from '@/Item/schemas'

interface ItemFormProps {
  onSubmit: (data: CreateItemData) => Promise<void>
  error?: Error | null
  isLoading?: boolean
  containerId?: number
}

export function ItemForm({ onSubmit, error, isLoading, containerId }: ItemFormProps) {
  const form = useForm<CreateItemData>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      name: '',
      description: '',
      quantity: 1,
      containerId,
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
                  <Package className="h-4 w-4" />
                  <Input placeholder="Enter item name" {...field} />
                </div>
              </FormControl>
              <FormDescription>What is this item called?</FormDescription>
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
                  placeholder="Describe this item..."
                  className="min-h-[100px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional details about this item</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormDescription>How many of this item are there?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Item'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
