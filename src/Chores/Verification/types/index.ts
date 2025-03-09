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
