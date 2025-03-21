import * as z from 'zod'

export const CreateProfileSchema = z.object({
  name: z.string().min(2, { message: 'Profile name must be at least 2 characters' }),
  role: z.enum(['admin', 'user', 'guest']),
  pin: z
    .string()
    .refine((val) => val === '' || /^\d{6}$/.test(val), {
      message: 'PIN must be 6 digits or empty',
    })
    .optional()
    .or(z.literal('')),
  image: z.instanceof(File).optional(),
})

export type CreateProfileFormData = z.infer<typeof CreateProfileSchema>
