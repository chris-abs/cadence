import * as z from 'zod'

export const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  colour: z.string().min(1, 'Colour is required'),
})

export type CreateTagData = z.infer<typeof createTagSchema>
