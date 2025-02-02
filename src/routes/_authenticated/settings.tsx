import { createFileRoute } from '@tanstack/react-router'
import { Clock, Bell, Palette } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Separator,
} from '@/Global/components/atoms'
import { PageLayout } from '@/Global/layout/PageLayout'
import { H2, Section } from '@/Global/components/molecules'
import { useSettingsStore } from '@/Global/stores/useSettingsStore'

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const {
    theme,
    emailNotifications,
    pushNotifications,
    dateFormat,
    isCompact,
    sidebarCollapsed,
    applyTheme,
    setEmailNotifications,
    setPushNotifications,
    setDateFormat,
    setCompact,
    setSidebarCollapsed,
  } = useSettingsStore()

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col h-full">
        <div className="flex flex-1 flex-col gap-4 p-4 min-h-0">
          <Section>
            <H2>Settings</H2>
          </Section>
          <Section className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize how the application looks and feels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium">Theme</span>
                    <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                  </div>
                  <Select value={theme} onValueChange={applyTheme}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium">Compact Entity View</span>
                    <p className="text-sm text-muted-foreground">
                      Use a condensed layout for items and containers
                    </p>
                  </div>
                  <Switch checked={isCompact} onCheckedChange={setCompact} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium">Compact Sidebar View</span>
                    <p className="text-sm text-muted-foreground">Use a condensed sidebar</p>
                  </div>
                  <Switch checked={sidebarCollapsed} onCheckedChange={setSidebarCollapsed} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium">Email Notifications</span>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium">Push Notifications</span>
                    <p className="text-sm text-muted-foreground">Receive browser notifications</p>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>
              </CardContent>
            </Card>

            {/* TODO: could use the user's preferred time for createdAt */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Date & Time
                </CardTitle>
                <CardDescription>Configure date and time display preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium">Date Format</span>
                    <p className="text-sm text-muted-foreground">Choose how dates are displayed</p>
                  </div>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relative">Relative (2 hours ago)</SelectItem>
                      <SelectItem value="absolute">Absolute (Jan 23, 2024)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </Section>
        </div>
      </div>
    </PageLayout>
  )
}
