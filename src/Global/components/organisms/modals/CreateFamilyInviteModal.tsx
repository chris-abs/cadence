import { useState } from 'react'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from '@/Global/components/atoms'
import { FamilyInviteForm } from '@/Global/components/molecules/forms'
import { useCreateInvite } from '@/Global/queries/family'
import { CreateInviteData } from '@/Global/schemas/family'
import { useUserWithFamily } from '@/User/hooks/useUserWithFamily'

interface CreateInviteModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateInviteModal({ isOpen, onClose }: CreateInviteModalProps) {
  const [error, setError] = useState<Error | null>(null)
  const { family } = useUserWithFamily()
  const createInvite = useCreateInvite()

  const handleSubmit = async (data: CreateInviteData) => {
    if (!family) {
      setError(new Error('No family selected'))
      return
    }

    try {
      const invite = await createInvite.mutateAsync({
        familyId: family.id,
        data,
      })

      onClose()

      navigator.clipboard.writeText(invite.token)

      toast.success('Invitation created', {
        description: (
          <div className="flex flex-col gap-2">
            <span>Invitation sent to {data.email}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs">Token copied to clipboard</span>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  navigator.clipboard.writeText(invite.token)
                  toast.info('Token copied')
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ),
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create invitation'))
      toast.error('Failed to create invitation')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Family Member</DialogTitle>
          <DialogDescription>
            Send an invitation to add a new member to your family.
          </DialogDescription>
        </DialogHeader>
        <FamilyInviteForm
          onSubmit={handleSubmit}
          error={error}
          isLoading={createInvite.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
