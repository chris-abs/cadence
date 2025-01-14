import * as z from 'zod'

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

export const updateWorkspaceSchema = createWorkspaceSchema.partial().extend({
  id: z.number(),
})

export type CreateWorkspaceData = z.infer<typeof createWorkspaceSchema>
export type UpdateWorkspaceData = z.infer<typeof updateWorkspaceSchema>
