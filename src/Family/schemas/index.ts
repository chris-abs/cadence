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
})

export const CreateFamilyInviteSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  role: z.enum(['PARENT', 'CHILD'], {
    required_error: 'Please select a role',
  }),
})

export const JoinFamilySchema = z.object({
  token: z.string().min(1, { message: 'Invitation token is required' }),
})

export type CreateFamilyData = z.infer<typeof CreateFamilySchema>
export type UpdateFamilyData = z.infer<typeof UpdateFamilySchema>
export type CreateFamilyInviteData = z.infer<typeof CreateFamilyInviteSchema>
export type JoinFamilyData = z.infer<typeof JoinFamilySchema>
