import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Box, FolderOpen, Package, Tags } from 'lucide-react'

import { Button } from '@/Global/components/atoms/Button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/Global/components/atoms/Form'
import { Input } from '@/Global/components/atoms/Input'
import { Alert, AlertDescription } from '@/Global/components/atoms/Alert'
import { EntityType } from '@/Collection/types'

const createEntitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

type FormData = z.infer<typeof createEntitySchema>

interface CreateEntityFormProps {
  selectedType: EntityType
  onTypeChange: (type: EntityType) => void
  onSubmit: (data: FormData) => Promise<void>
  error?: Error | null
  isLoading?: boolean
}

const typeDetails = {
  workspace: {
    icon: Box,
    title: 'Create Workspace',
    namePlaceholder: 'Workspace name',
  },
  container: {
    icon: FolderOpen,
    title: 'Create Container',
    namePlaceholder: 'Container name',
  },
  item: {
    icon: Package,
    title: 'Create Item',
    namePlaceholder: 'Item name',
  },
  tag: {
    icon: Tags,
    title: 'Create Tag',
    namePlaceholder: 'Tag name',
  },
} as const

export function CreateEntityForm({
  selectedType,
  onTypeChange,
  onSubmit,
  error,
  isLoading,
}: CreateEntityFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(createEntitySchema),
    defaultValues: {
      name: '',
    },
  })

  const { icon: Icon, namePlaceholder } = typeDetails[selectedType]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-4 gap-1">
          {(Object.keys(typeDetails) as EntityType[]).map((type) => {
            const { icon: TypeIcon } = typeDetails[type]
            return (
              <Button
                key={type}
                type="button"
                variant={selectedType === type ? 'default' : 'outline'}
                onClick={() => onTypeChange(type)}
                className="w-full capitalize"
              >
                <TypeIcon className="mr-[0.5] h-4 w-4" />
                {type}
              </Button>
            )
          })}
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <Input placeholder={namePlaceholder} {...field} autoFocus />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
