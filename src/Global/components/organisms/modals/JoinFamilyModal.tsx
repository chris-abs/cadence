import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from '@/Global/components/atoms'
import { useJoinFamily } from '@/Global/queries/family'
import { JoinFamilyData } from '@/Global/schemas/family'
import { FamilyJoinForm } from '../../molecules'

interface JoinFamilyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function JoinFamilyModal({ isOpen, onClose }: JoinFamilyModalProps) {
  const [error, setError] = useState<Error | null>(null)
  const navigate = useNavigate()
  const joinFamily = useJoinFamily()

  const handleSubmit = async (data: JoinFamilyData) => {
    try {
      await joinFamily.mutateAsync(data)
      onClose()

      toast.success('Family joined successfully', {
        description: (
          <div className="flex justify-between items-center">
            <span>You are now part of this family</span>
            <Button variant="link" onClick={() => navigate({ to: '/cadence' })}>
              Go to Dashboard
            </Button>
          </div>
        ),
      })

      navigate({ to: '/cadence' })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to join family'))
      toast.error('Failed to join family')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Family</DialogTitle>
          <DialogDescription>
            Enter the invitation token you received to join a family.
          </DialogDescription>
        </DialogHeader>
        <FamilyJoinForm onSubmit={handleSubmit} error={error} isLoading={joinFamily.isPending} />
      </DialogContent>
    </Dialog>
  )
}
