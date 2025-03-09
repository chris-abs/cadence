import { User } from '@/User/types'
import { ChoreInstance } from '@/Chores/Instance/types'

export type OccurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom'

export interface OccurrenceData {
  daysOfWeek?: number[]
  daysOfMonth?: number[]
  startDate: string
  endDate?: string
  interval?: number
  intervalUnit?: string
}

export interface Task {
  id: number
  name: string
  description: string
  creatorId: number
  assigneeId: number
  familyId: number
  points: number
  occurrenceType: OccurrenceType
  occurrenceData: OccurrenceData
  createdAt: string
  updatedAt: string

  assignee?: User
  creator?: User
  instances?: ChoreInstance[]
}
