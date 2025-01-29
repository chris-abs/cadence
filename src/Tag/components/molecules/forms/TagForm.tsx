import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Tags } from 'lucide-react'

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
} from '@/Global/components/atoms'
import { CreateTagData, createTagSchema } from '@/Tag/schemas'
import { COLOURS } from '@/Global/types/colours'

interface TagFormProps {
  onSubmit: (data: CreateTagData) => Promise<void>
  error?: Error | null
  isLoading?: boolean
}

export function TagForm({ onSubmit, error, isLoading }: TagFormProps) {
  const form = useForm<CreateTagData>({
    resolver: zodResolver(createTagSchema),
    defaultValues: {
      name: '',
      colour: COLOURS[0],
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
                  <Tags className="h-4 w-4" />
                  <Input placeholder="Enter tag name" {...field} />
                </div>
              </FormControl>
              <FormDescription>What would you like to call this tag?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="colour"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Colour</FormLabel>
              <div className="flex flex-wrap gap-2">
                {COLOURS.map((colour) => (
                  <button
                    key={colour}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      field.value === colour
                        ? 'border-primary scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: colour }}
                    onClick={() => field.onChange(colour)}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Tag'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
