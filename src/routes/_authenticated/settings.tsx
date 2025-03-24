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
      <div className="flex flex-col flex-1 p-6">
        <div className="flex items-center mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Tabs value={tab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="family">Family</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="preferences" className="h-full">
              <ProfilePreferencesSection />
            </TabsContent>

            <TabsContent value="profile" className="h-full">
              <ProfileSettingsSection />
            </TabsContent>

            <TabsContent value="family" className="h-full">
              <FamilySettingsSection />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </PageLayout>
  )
}
