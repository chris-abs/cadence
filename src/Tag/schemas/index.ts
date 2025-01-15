import * as z from 'zod'

import { COLOURS } from '@/Global/types'

export const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  colour: z.enum(COLOURS).optional(),
  description: z.string().optional(),
})

export const updateTagSchema = createTagSchema.partial().extend({
  id: z.number(),
})

export const updateItemTagsSchema = z.object({
  itemId: z.number(),
  tagIds: z.array(z.number()),
})

export type CreateTagData = z.infer<typeof createTagSchema>
export type UpdateTagData = z.infer<typeof updateTagSchema>
export type UpdateItemTagsData = z.infer<typeof updateItemTagsSchema>
