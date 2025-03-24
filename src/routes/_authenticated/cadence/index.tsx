import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HomeIcon } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from '@/Global/components/atoms'
import { FamilyPanel, ModuleGrid } from '@/Family/components/atoms'
import { PageLayout } from '@/Global/layout/PageLayout'
import { useProfileWithFamily } from '@/Profile/hooks/useProfileWithFamily'
import { FamilyManagementModal } from '@/Family/components/organisms/modals'

export const Route = createFileRoute('/_authenticated/cadence/')({
  component: CadenceDashboard,
})

function CadenceDashboard() {
  const [isManageFamilyOpen, setIsManageFamilyOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'modules'>('members')
  const { hasFamily, isParent, isLoading } = useProfileWithFamily()

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <PageLayout>
      <div className="flex flex-col gap-8 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HomeIcon className="h-7 w-7" />
            <h1 className="text-3xl font-bold">Welcome to Cadence</h1>
          </div>
          {hasFamily && isParent && (
            <Button variant="outline" onClick={() => setIsManageFamilyOpen(true)}>
              Manage Family
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ModuleGrid />
          </div>
          <div>
            <FamilyPanel />
          </div>
        </div>
      </div>

      <FamilyManagementModal
        isOpen={isManageFamilyOpen}
        onClose={() => setIsManageFamilyOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </PageLayout>
  )
}

function LoadingState() {
  return (
    <PageLayout>
      <div className="flex flex-col gap-8 p-6">
        <div className="flex items-center gap-2">
          <HomeIcon className="h-7 w-7" />
          <h1 className="text-3xl font-bold">Welcome to Cadence</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading your family data...</CardTitle>
            <CardDescription>Please wait while we retrieve your information.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center p-6">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
