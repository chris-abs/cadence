import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Global/components/atoms'
import { PageLayout } from '@/Global/layout/PageLayout'
import {
  FamilySettingsSection,
  ProfilePreferencesSection,
  ProfileSettingsSection,
} from '@/Global/components/organisms/settings/sections'

type SettingsTab = 'preferences' | 'profile' | 'family'

interface SettingsSearchParams {
  tab?: SettingsTab
}

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
  validateSearch: (search: Record<string, unknown>): SettingsSearchParams => {
    const tab = search.tab as string | undefined
    const validTab =
      tab && ['preferences', 'profile', 'family'].includes(tab)
        ? (tab as SettingsTab)
        : 'preferences'
    return { tab: validTab }
  },
})

function SettingsPage() {
  const { tab = 'preferences' } = Route.useSearch()
  const navigate = useNavigate()

  const handleTabChange = (value: string) => {
    const newTab = ['preferences', 'profile', 'family'].includes(value)
      ? (value as SettingsTab)
      : 'preferences'

    navigate({
      to: '/settings',
      search: { tab: newTab },
      replace: true,
    })
  }

  return (
    <PageLayout>
      <div className="container py-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="family">Family</TabsTrigger>
          </TabsList>

          <TabsContent value="preferences" className="mt-6">
            <ProfilePreferencesSection />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <ProfileSettingsSection />
          </TabsContent>

          <TabsContent value="family" className="mt-6">
            <FamilySettingsSection />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
