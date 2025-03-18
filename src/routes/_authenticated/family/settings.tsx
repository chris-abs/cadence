import { createFileRoute } from '@tanstack/react-router'
import { HomeIcon } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/Global/components/atoms'
import { PageLayout } from '@/Global/layout/PageLayout'
import { FamilyDetail } from '@/Family/components/organisms/detail/FamilyDetail'
import { useCurrentFamily } from '@/Family/queries'
import { useProfileWithFamily } from '@/Profile/hooks/useProfileWithFamily'

export const Route = createFileRoute('/_authenticated/family/settings')({
  component: FamilySettingsPage,
})

function FamilySettingsPage() {
  const { data: family, isLoading: isFamilyLoading } = useCurrentFamily()
  const { profile, isParent, isLoading: isUserLoading } = useProfileWithFamily()

  const isLoading = isFamilyLoading || isUserLoading

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading family settings...</p>
        </div>
      </PageLayout>
    )
  }

  if (!family || !profile) {
    return (
      <PageLayout>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Alert>
            <HomeIcon className="h-4 w-4" />
            <AlertTitle>No family found</AlertTitle>
            <AlertDescription>
              You need to create or join a family to access family settings.
            </AlertDescription>
          </Alert>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col p-4 overflow-y-auto">
        <FamilyDetail family={family} currentUserId={profile.id} isParent={isParent} />
      </div>
    </PageLayout>
  )
}
