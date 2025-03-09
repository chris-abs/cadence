import { User } from '@/User/types'
import { Task } from '@/Chores/Task/types'

export type ChoreStatus = 'pending' | 'completed' | 'verified' | 'rejected' | 'missed'

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

  chore?: Task
  assignee?: User
  verifier?: User
}

export interface ChoreStats {
  totalAssigned: number
  totalCompleted: number
  totalVerified: number
  totalMissed: number
  completionRate: number
  pointsEarned: number
}
