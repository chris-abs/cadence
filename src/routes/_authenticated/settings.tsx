import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Global/components/atoms'
import { PageLayout } from '@/Global/layout/PageLayout'
import {
  FamilySettingsSection,
  ProfilePreferencesSection,
  ProfileSettingsSection,
} from '@/Global/components/organisms/settings'

type SettingsTab = 'preferences' | 'profile' | 'family'

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
  validateSearch: (search: Record<string, unknown>) => {
    const tab = search.tab as SettingsTab | undefined
    const validTab = tab && ['preferences', 'profile', 'family'].includes(tab) ? tab : 'preferences'
    return { tab: validTab as SettingsTab }
  },
})

function SettingsPage() {
  const { tab } = useSearch<{ tab: SettingsTab }>()
  const navigate = useNavigate()

  // Update URL when tab changes, no useEffect needed
  const handleTabChange = (value: string) => {
    navigate({ search: { tab: value } }, { replace: true })
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
