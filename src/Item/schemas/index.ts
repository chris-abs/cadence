import * as z from 'zod'

export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  containerId: z.number().optional(),
  tagNames: z.array(z.string()).optional(),
})

export const updateItemSchema = createItemSchema.partial().extend({
  id: z.number(),
  imgUrl: z.string().optional(),
  tags: z.array(z.number()).optional(),
  containerId: z.number().optional(),
})

export type CreateItemData = z.infer<typeof createItemSchema>
export type UpdateItemData = z.infer<typeof updateItemSchema>
