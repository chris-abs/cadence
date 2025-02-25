import * as z from 'zod'

export const createFamilySchema = z.object({
  name: z.string().min(2, { message: 'Family name must be at least 2 characters' }),
  modules: z.array(z.string()).refine((val) => val.length > 0, {
    message: 'Select at least one module',
  }),
})

export const updateFamilySchema = z.object({
  id: z.number(),
  name: z.string().min(2, { message: 'Family name must be at least 2 characters' }),
})

export const createInviteSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  role: z.enum(['PARENT', 'CHILD'], {
    required_error: 'Please select a role',
  }),
})

export const joinFamilySchema = z.object({
  token: z.string().min(1, { message: 'Invitation token is required' }),
})

export type CreateFamilyData = z.infer<typeof createFamilySchema>
export type UpdateFamilyData = z.infer<typeof updateFamilySchema>
export type CreateInviteData = z.infer<typeof createInviteSchema>
export type JoinFamilyData = z.infer<typeof joinFamilySchema>
