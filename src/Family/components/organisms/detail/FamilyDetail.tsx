import { toast } from 'sonner'

import {
  FamilyDetailSection,
  FamilyMembersSection,
  FamilyModulesSection,
} from '@/Family/components/organisms/detail/sections'
import { useUpdateFamily } from '@/Family/queries'
import { useProfiles } from '@/Profile/queries'
import { Family, UpdateFamilyData } from '@/Family/types'

interface FamilyDetailProps {
  family: Family
  currentProfileId: number
  isParent: boolean
}

export function FamilyDetail({ family, currentProfileId, isParent }: FamilyDetailProps) {
  const updateFamily = useUpdateFamily()
  const { data: profiles, isLoading: isProfilesLoading } = useProfiles()

  const handleUpdateFamily = async (data: UpdateFamilyData) => {
    try {
      await updateFamily.mutateAsync({
        familyName: data.familyName,
        status: data.status,
      })

      toast.success('Family updated', {
        description: `${data.familyName} has been updated successfully`,
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
          profiles={profiles || []}
          isParent={isParent}
          currentProfileId={currentProfileId}
          isLoading={isProfilesLoading}
        />
      </div>
    </div>
  )
}
