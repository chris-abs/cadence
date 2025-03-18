import { ChoreInstance } from '@/Chores/Instance/types'
import { Profile } from '@/Profile/types'

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

  assignee?: Profile
  creator?: Profile
  instances?: ChoreInstance[]
}
