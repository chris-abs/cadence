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
import { useCreateFamily } from '@/Family/queries'
import { CreateFamilyForm } from '@/Family/components/molecules/forms'
import { CreateFamilyData } from '@/Family/schemas'

interface CreateFamilyModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateFamilyModal({ isOpen, onClose }: CreateFamilyModalProps) {
  const [error, setError] = useState<Error | null>(null)
  const navigate = useNavigate()
  const createFamily = useCreateFamily()

  const handleSubmit = async (data: CreateFamilyData) => {
    try {
      await createFamily.mutateAsync({
        name: data.name,
        modules: data.modules,
      })

      onClose()

      toast.success('Family created successfully', {
        description: (
          <div className="flex justify-between items-center">
            <span>{data.name} has been created</span>
            <Button variant="link" onClick={() => navigate({ to: '/cadence' })}>
              Go to Dashboard
            </Button>
          </div>
        ),
      })

      navigate({ to: '/cadence' })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create family'))
      toast.error('Failed to create family', {
        description: err instanceof Error ? err.message : 'Please try again',
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Your Family</DialogTitle>
          <DialogDescription>
            Set up your family on Cadence and choose which modules you'd like to enable.
          </DialogDescription>
        </DialogHeader>
        <CreateFamilyForm
          onSubmit={handleSubmit}
          error={error}
          isLoading={createFamily.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
