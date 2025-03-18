import { toast } from 'sonner'

import {
  FamilyDetailSection,
  FamilyMembersSection,
  FamilyModulesSection,
} from '@/Family/components/organisms/detail/sections'
import { useUpdateFamily, useFamilyMembers } from '@/Family/queries'
import { Family } from '@/Family/types'
import { UpdateFamilyData } from '@/Family/schemas'

interface FamilyDetailProps {
  family: Family
  currentUserId: number
  isParent: boolean
}

export function FamilyDetail({ family, currentUserId, isParent }: FamilyDetailProps) {
  const updateFamily = useUpdateFamily()
  const { data: familyMembers, isLoading: isMembersLoading } = useFamilyMembers(family?.id)

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
      </div>
    </div>
  )
}
