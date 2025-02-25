import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Home } from 'lucide-react'

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
  Checkbox,
} from '@/Global/components/atoms'
import { CreateFamilyData, createFamilySchema } from '@/Global/schemas'
import { modulesList } from '@/Global/constants'

interface FamilyFormProps {
  onSubmit: (data: CreateFamilyData) => Promise<void>
  error?: Error | null
  isLoading?: boolean
}

export function FamilyForm({ onSubmit, error, isLoading }: FamilyFormProps) {
  const form = useForm<CreateFamilyData>({
    resolver: zodResolver(createFamilySchema),
    defaultValues: {
      name: '',
      modules: ['storage'],
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
              <FormLabel>Family Name</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Enter your family name" {...field} />
                </div>
              </FormControl>
              <FormDescription>
                This is how your family will be identified in Cadence.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="modules"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Active Modules</FormLabel>
                <FormDescription>
                  Select which modules you want to enable for your family.
                </FormDescription>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {modulesList.map((module) => (
                  <FormField
                    key={module.id}
                    control={form.control}
                    name="modules"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={module.id}
                          className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(module.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, module.id])
                                  : field.onChange(
                                      field.value?.filter((value) => value !== module.id),
                                    )
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">{module.name}</FormLabel>
                            <FormDescription className="text-xs">
                              {module.description}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Family'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
