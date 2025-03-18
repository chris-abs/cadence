import { Task } from '@/Chores/Task/types'
import { Profile } from '@/Profile/types'

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
  assignee?: Profile
  verifier?: Profile
}

export interface ChoreStats {
  totalAssigned: number
  totalCompleted: number
  totalVerified: number
  totalMissed: number
  completionRate: number
  pointsEarned: number
}
