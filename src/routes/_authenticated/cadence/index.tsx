import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PlusIcon, UserPlusIcon, HomeIcon } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from '@/Global/components/atoms'
import { CreateFamilyModal, JoinFamilyModal } from '@/Family/components/organisms/modals'
import { FamilyPanel, ModuleGrid } from '@/Global/components/organisms/family'
import { PageLayout } from '@/Global/layout/PageLayout'
import { useUserWithFamily } from '@/User/hooks/useUserWithFamily'

export const Route = createFileRoute('/_authenticated/cadence/')({
  component: CadenceDashboard,
})

function CadenceDashboard() {
  const { hasFamily, isParent, isLoading } = useUserWithFamily()

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
          {hasFamily && isParent && <Button variant="outline">Manage Family</Button>}
        </div>

        {!hasFamily ? (
          <NoFamilyView />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <ModuleGrid />
            </div>
            <div>
              <FamilyPanel />
            </div>
          </div>
        )}
      </div>
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

function NoFamilyView() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Get Started with Cadence</CardTitle>
          <CardDescription>
            Create or join a family to start using Cadence's organization modules.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button className="flex items-center gap-2" onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Create a Family
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsJoinModalOpen(true)}
          >
            <UserPlusIcon className="h-4 w-4" />
            Join a Family
          </Button>
        </CardContent>
      </Card>

      <CreateFamilyModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      <JoinFamilyModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
    </>
  )
}
