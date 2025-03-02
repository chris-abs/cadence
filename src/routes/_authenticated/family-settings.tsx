import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  HomeIcon,
  Users,
  UserPlus,
  Mail,
  UserCog,
  PackageOpen,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'

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
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/Global/components/atoms'
import { PageLayout } from '@/Global/layout/PageLayout'
import { H2, Section } from '@/Global/components/molecules'
import { useCurrentFamily, useUpdateModule, useCreateInvite } from '@/Family/queries'
import { moduleDefinitions } from '@/Family/constants'
import { ModuleID, FamilyRoles } from '@/Family/types'
import { useUserWithFamily } from '@/User/hooks/useUserWithFamily'

export const Route = createFileRoute('/_authenticated/family-settings')({
  component: FamilySettingsPage,
})

function FamilySettingsPage() {
  const { data: family, isLoading } = useCurrentFamily()
  const { isParent } = useUserWithFamily()
  const updateModule = useUpdateModule()
  const createInvite = useCreateInvite()
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<FamilyRoles['role']>('CHILD')

  const handleModuleToggle = (moduleId: ModuleID, isEnabled: boolean) => {
    if (!family) return

    updateModule.mutate(
      {
        familyId: family.id,
        moduleId,
        isEnabled: !isEnabled,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Module updated',
            description: `${moduleDefinitions[moduleId].name} has been ${!isEnabled ? 'enabled' : 'disabled'}.`,
            variant: 'default',
          })
        },
      },
    )
  }

  const handleInviteMember = () => {
    if (!family || !inviteEmail) return

    createInvite.mutate(
      {
        familyId: family.id,
        data: {
          email: inviteEmail,
          role: inviteRole,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: 'Invite sent',
            description: `An invitation has been sent to ${inviteEmail}.`,
            variant: 'default',
          })
          setInviteDialogOpen(false)
          setInviteEmail('')
        },
      },
    )
  }

  if (isLoading || !family) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading family settings...</p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="flex flex-1 flex-col h-full">
        <div className="flex flex-1 flex-col gap-4 p-4 min-h-0">
          <Section>
            <div className="flex items-center justify-between">
              <H2 className="flex items-center gap-2">
                <HomeIcon className="h-6 w-6" />
                Family Settings
              </H2>
              {isParent && (
                <Button
                  variant="outline"
                  onClick={() => setInviteDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite Member
                </Button>
              )}
            </div>
          </Section>

          <Section className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HomeIcon className="h-5 w-5" />
                  Family Information
                </CardTitle>
                <CardDescription>Basic information about your family</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium">Family Name</span>
                    <p className="text-sm text-muted-foreground">{family.name}</p>
                  </div>
                  {isParent && (
                    <Button variant="outline" size="sm" disabled={!isParent}>
                      Edit
                    </Button>
                  )}
                </div>

                <Separator />

                <div className="space-y-0.5">
                  <span className="text-sm font-medium">Family ID</span>
                  <p className="text-sm text-muted-foreground">{family.id}</p>
                </div>

                <Separator />

                <div className="space-y-0.5">
                  <span className="text-sm font-medium">Created On</span>
                  <p className="text-sm text-muted-foreground">
                    {new Date(family.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium">Family Status</span>
                    <p className="text-sm text-muted-foreground">{family.status}</p>
                  </div>
                  {isParent && (
                    <Select disabled={!isParent} defaultValue={family.status}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PackageOpen className="h-5 w-5" />
                  Active Modules
                </CardTitle>
                <CardDescription>Manage which modules are enabled for your family</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {family.modules.map((module) => {
                  if (!moduleDefinitions[module.id]) return null

                  const ModuleIcon = moduleDefinitions[module.id].icon

                  return (
                    <div key={module.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ModuleIcon className="h-5 w-5 text-primary" />
                        <div className="space-y-0.5">
                          <span className="text-sm font-medium">
                            {moduleDefinitions[module.id].name}
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {moduleDefinitions[module.id].description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={module.isEnabled}
                        onCheckedChange={() => handleModuleToggle(module.id, module.isEnabled)}
                        disabled={!isParent}
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Family Members
                </CardTitle>
                <CardDescription>Manage family members and their roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 p-3 bg-muted/50 text-sm font-medium">
                    <div>Name</div>
                    <div>Email</div>
                    <div>Role</div>
                    <div className="text-right">Actions</div>
                  </div>

                  <div className="grid grid-cols-4 p-3 items-center border-t text-sm">
                    <div className="font-medium">Chris Abbott</div>
                    <div className="text-muted-foreground">c.abbott96@outlook.com</div>
                    <div>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                        Parent
                      </span>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" disabled>
                        <UserCog className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Pending Invites
                </CardTitle>
                <CardDescription>Track and manage pending family invitations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 p-3 bg-muted/50 text-sm font-medium">
                    <div>Email</div>
                    <div>Role</div>
                    <div>Expires</div>
                    <div className="text-right">Actions</div>
                  </div>

                  <div className="p-6 text-center text-muted-foreground">
                    <p>No pending invites</p>
                    <p className="text-sm">Invite new members using the button above</p>
                  </div>

                  {/* Sample invite - this would be mapped over actual data */}
                  <div className="grid grid-cols-4 p-3 items-center border-t text-sm">
                    <div className="text-muted-foreground">example@email.com</div>
                    <div>
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                        Child
                      </span>
                    </div>
                    <div className="text-muted-foreground">Expires in 6 days</div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Section>
        </div>
      </div>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Family Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your family. The person will receive an email with
              instructions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <Select
                value={inviteRole}
                onValueChange={(value) => setInviteRole(value as FamilyRoles['role'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARENT">Parent</SelectItem>
                  <SelectItem value="CHILD">Child</SelectItem>
                </SelectContent>
              </Select>

              <p className="text-sm text-muted-foreground pt-1">
                Parents have full administrative access to manage the family.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember} disabled={!inviteEmail}>
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
