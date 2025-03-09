import { User } from '@/User/types'

export type OccurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom'

export type ChoreStatus = 'pending' | 'completed' | 'verified' | 'rejected' | 'missed'

export interface OccurrenceData {
  daysOfWeek?: number[]
  daysOfMonth?: number[]
  startDate: string
  endDate?: string
  interval?: number
  intervalUnit?: string
}

export interface Chore {
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

export interface ChoreInstance {
  id: number
  choreId: number
  assigneeId: number
  familyId: number
  dueDate: string
  status: ChoreStatus
  completedAt?: string
  verifiedBy?: number
  notes: string
  createdAt: string
  updatedAt: string

  chore?: Chore
  assignee?: User
  verifier?: User
}

export interface DailyVerification {
  date: string
  assigneeId: number
  familyId: number
  isVerified: boolean
  verifiedBy?: number
  verifiedAt?: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface ChoreStats {
  totalAssigned: number
  totalCompleted: number
  totalVerified: number
  totalMissed: number
  completionRate: number
  pointsEarned: number
}
