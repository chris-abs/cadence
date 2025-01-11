import * as z from 'zod'

const containerBaseSchema = {
  name: z.string().min(1, 'Name is required'),
  location: z.string().optional(),
  workspaceId: z.number().optional(),
}

export const createContainerSchema = z.object(containerBaseSchema)

export const updateContainerSchema = z.object({
  ...containerBaseSchema,
  id: z.number(),
})

export type CreateContainerData = z.infer<typeof createContainerSchema>
export type UpdateContainerData = z.infer<typeof updateContainerSchema>
