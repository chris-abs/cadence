import { useState } from 'react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Global/components/atoms'
import {
  FamilyDetailSection,
  FamilyInvitesSection,
  FamilyMembersSection,
  FamilyModulesSection,
} from '@/Family/components/organisms/detail/sections'
import { useUpdateFamily, useCreateInvite, useFamilyMembers } from '@/Family/queries'
import { FamilyInvite, FamilyRoles, Family } from '@/Family/types'
import { UpdateFamilyData } from '@/Family/schemas'

interface FamilyDetailProps {
  family: Family
  currentUserId: number
  isParent: boolean
}

export function FamilyDetail({ family, currentUserId, isParent }: FamilyDetailProps) {
  const updateFamily = useUpdateFamily()
  const createInvite = useCreateInvite()
  const { data: familyMembers, isLoading: isMembersLoading } = useFamilyMembers(family?.id)

  //todo: placeholder
  const familyInvites: FamilyInvite[] = []
  const isInvitesLoading = false

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<FamilyRoles['role']>('CHILD')

  const handleInviteMember = () => {
    if (!family || !inviteEmail) return

    createInvite.mutate(
      {
        familyId: family.id,
        data: {
          email: inviteEmail,
          role: inviteRole,
        },
      },
      {
        onSuccess: () => {
          toast.success('Invitation sent', {
            description: `${inviteEmail} has been invited to your family`,
          })
          setInviteDialogOpen(false)
          setInviteEmail('')
        },
        onError: (error) => {
          toast.error('Failed to send invitation', {
            description: error instanceof Error ? error.message : 'Please try again',
          })
        },
      },
    )
  }

  const handleUpdateFamily = async (data: UpdateFamilyData) => {
    try {
      await updateFamily.mutateAsync({
        familyId: family.id,
        data: {
          id: family.id,
          name: data.name,
          status: data.status,
        },
      })

      toast.success('Family updated', {
        description: `${data.name} has been updated successfully`,
      })
    } catch (err) {
      toast.error('Failed to update family', {
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        duration: 3000,
      })
      throw err
    }
  }

  //todo: placeholder
  const handleResendInvite = () => {
    toast.info('Resend feature coming soon')
  }

  const handleCancelInvite = () => {
    toast.info('Cancel invite feature coming soon')
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="space-y-8">
        <FamilyDetailSection
          family={family}
          isParent={isParent}
          onUpdate={handleUpdateFamily}
          isUpdating={updateFamily.isPending}
        />

        <FamilyModulesSection family={family} isParent={isParent} />

        <FamilyMembersSection
          members={familyMembers}
          isParent={isParent}
          currentUserId={currentUserId}
          isLoading={isMembersLoading}
        />

        <FamilyInvitesSection
          invites={familyInvites}
          isParent={isParent}
          isLoading={isInvitesLoading}
          onResend={handleResendInvite}
          onCancel={handleCancelInvite}
        />
      </div>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Family Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your family. The person will receive an email with
              instructions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <Select
                value={inviteRole}
                onValueChange={(value) => setInviteRole(value as FamilyRoles['role'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARENT">Parent</SelectItem>
                  <SelectItem value="CHILD">Child</SelectItem>
                </SelectContent>
              </Select>

              <p className="text-sm text-muted-foreground pt-1">
                Parents have full administrative access to manage the family.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember} disabled={!inviteEmail || createInvite.isPending}>
              {createInvite.isPending ? 'Sending...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
