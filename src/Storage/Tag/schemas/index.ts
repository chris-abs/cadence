import * as z from 'zod'

export const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  colour: z.string().optional(),
  description: z.string().optional(),
})

export const updateTagSchema = createTagSchema.partial().extend({
  id: z.number(),
})

export const updateItemTagsSchema = z.object({
  itemId: z.number(),
  tagIds: z.array(z.number()),
})

export const bulkAssignTagsSchema = z.object({
  tagIds: z.array(z.number()),
  itemIds: z.array(z.number()),
})

export type CreateTagData = z.infer<typeof createTagSchema>
export type UpdateTagData = z.infer<typeof updateTagSchema>
export type UpdateItemTagsData = z.infer<typeof updateItemTagsSchema>
export type BulkAssignTagsData = z.infer<typeof bulkAssignTagsSchema>
