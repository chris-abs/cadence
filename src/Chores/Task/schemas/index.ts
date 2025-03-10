import * as z from 'zod'

const dailyOccurrenceSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
})

const weeklyOccurrenceSchema = dailyOccurrenceSchema.extend({
  daysOfWeek: z.array(z.number().min(0).max(6)).min(1, 'Select at least one day of the week'),
})

const monthlyOccurrenceSchema = dailyOccurrenceSchema.extend({
  daysOfMonth: z.array(z.number().min(1).max(31)).min(1, 'Select at least one day of the month'),
})

const customOccurrenceSchema = dailyOccurrenceSchema.extend({
  interval: z.number().min(1, 'Interval must be at least 1'),
  intervalUnit: z.enum(['day', 'week', 'month'], {
    errorMap: () => ({ message: 'Please select a valid interval unit' }),
  }),
})

export const createTaskSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    assigneeId: z.number().min(1, 'An assignee is required'),
    points: z.number().min(0, 'Points must be a positive number').default(0),
    occurrenceType: z.enum(['daily', 'weekly', 'monthly', 'custom'] as const, {
      errorMap: () => ({ message: 'Please select a valid occurrence type' }),
    }),
    occurrenceData: z.object({
      startDate: z.string().min(1, 'Start date is required'),
      endDate: z.string().optional(),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      daysOfMonth: z.array(z.number().min(1).max(31)).optional(),
      interval: z.number().min(1).optional(),
      intervalUnit: z.enum(['day', 'week', 'month']).optional(),
    }),
  })
  .refine(
    (data) => {
      switch (data.occurrenceType) {
        case 'daily':
          return dailyOccurrenceSchema.safeParse(data.occurrenceData).success
        case 'weekly':
          return weeklyOccurrenceSchema.safeParse(data.occurrenceData).success
        case 'monthly':
          return monthlyOccurrenceSchema.safeParse(data.occurrenceData).success
        case 'custom':
          return customOccurrenceSchema.safeParse(data.occurrenceData).success
        default:
          return false
      }
    },
    {
      message: 'Invalid occurrence data for the selected occurrence type',
      path: ['occurrenceData'],
    },
  )

export const updateTaskSchema = z
  .object({
    id: z.number(),
    name: z.string().min(1, 'Name is required').optional(),
    description: z.string().optional(),
    assigneeId: z.number().min(1, 'An assignee is required').optional(),
    points: z.number().min(0, 'Points must be a positive number').optional(),
    occurrenceType: z.enum(['daily', 'weekly', 'monthly', 'custom'] as const).optional(),
    occurrenceData: z
      .object({
        startDate: z.string().min(1, 'Start date is required').optional(),
        endDate: z.string().optional(),
        daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
        daysOfMonth: z.array(z.number().min(1).max(31)).optional(),
        interval: z.number().min(1).optional(),
        intervalUnit: z.enum(['day', 'week', 'month']).optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.occurrenceType || !data.occurrenceData) return true

      switch (data.occurrenceType) {
        case 'daily':
          return dailyOccurrenceSchema.partial().safeParse(data.occurrenceData).success
        case 'weekly':
          if (data.occurrenceData.daysOfWeek && data.occurrenceData.daysOfWeek.length === 0) {
            return false
          }
          return weeklyOccurrenceSchema.partial().safeParse(data.occurrenceData).success
        case 'monthly':
          if (data.occurrenceData.daysOfMonth && data.occurrenceData.daysOfMonth.length === 0) {
            return false
          }
          return monthlyOccurrenceSchema.partial().safeParse(data.occurrenceData).success
        case 'custom':
          if (
            data.occurrenceData.interval !== undefined ||
            data.occurrenceData.intervalUnit !== undefined
          ) {
            return (
              data.occurrenceData.interval !== undefined &&
              data.occurrenceData.interval > 0 &&
              data.occurrenceData.intervalUnit !== undefined
            )
          }
          return customOccurrenceSchema.partial().safeParse(data.occurrenceData).success
        default:
          return false
      }
    },
    {
      message: 'Invalid occurrence data for the selected occurrence type',
      path: ['occurrenceData'],
    },
  )

export type CreateTaskData = z.infer<typeof createTaskSchema>
export type UpdateTaskData = z.infer<typeof updateTaskSchema>
