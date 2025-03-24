import { useState } from 'react'
import { UserPlus } from 'lucide-react'

import { Button, Card, CardContent } from '@/Global/components/atoms'
import { Section } from '@/Global/components/molecules'
import { useProfileWithFamily } from '@/Profile/hooks/useProfileWithFamily'
import { CreateProfileModal } from '@/Profile/components/organisms/modals'
import { H3 } from '@/Global/components/molecules/Typography'
import { ProfilesSection } from '@/Family/components/organisms/modals/sections'

export function FamilySettingsSection() {
  const [isCreateProfileModalOpen, setIsCreateProfileModalOpen] = useState(false)
  const { profile, family, isParent } = useProfileWithFamily()

  if (!profile || !family) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading family information...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Section>
        <div className="flex justify-between items-center">
          <H3>Family Profiles</H3>
          {isParent && (
            <Button
              onClick={() => setIsCreateProfileModalOpen(true)}
              className="flex items-center gap-2"
              size="sm"
            >
              <UserPlus className="h-4 w-4" />
              Add Profile
            </Button>
          )}
        </div>

        <div className="mt-4">
          <ProfilesSection />
        </div>
      </Section>

      <Section>
        <H3>Family Account Settings</H3>
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Family Name</h4>
                <p>{family.familyName}</p>
              </div>

              <div>
                <h4 className="font-medium mb-1">Email</h4>
                <p>{family.email}</p>
              </div>

              <div>
                <h4 className="font-medium mb-1">Family ID</h4>
                <p className="font-mono">{family.id}</p>
              </div>

              <div>
                <h4 className="font-medium mb-1">Account Status</h4>
                <div
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    family.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                  }`}
                >
                  {family.status}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-1">Created</h4>
                <p>{new Date(family.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      <CreateProfileModal
        isOpen={isCreateProfileModalOpen}
        onClose={() => setIsCreateProfileModalOpen(false)}
      />
    </div>
  )
}
