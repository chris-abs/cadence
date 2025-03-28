import * as z from 'zod'

const moduleIDEnum = z.enum(['storage', 'chores', 'meals', 'services'])

export const CreateFamilySchema = z.object({
  name: z.string().min(2, { message: 'Family name must be at least 2 characters' }),
  modules: z.array(moduleIDEnum).refine((val) => val.length > 0, {
    message: 'Select at least one module',
  }),
})

export const UpdateFamilySchema = z.object({
  id: z.number(),
  name: z.string().min(2, { message: 'Family name must be at least 2 characters' }),
  status: z.enum(['ACTIVE', 'INACTIVE'] as const).optional(),
})

export type CreateFamilyData = z.infer<typeof CreateFamilySchema>
export type UpdateFamilyData = z.infer<typeof UpdateFamilySchema>
