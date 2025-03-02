import { createFileRoute, useNavigate } from '@tanstack/react-router'
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
  ExternalLinkIcon,
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
import {
  useCurrentFamily,
  useUpdateModule,
  useCreateInvite,
  useFamilyMembers,
} from '@/Family/queries'
import { moduleDefinitions } from '@/Family/constants'
import { ModuleID, FamilyRoles } from '@/Family/types'
import { useUserWithFamily } from '@/User/hooks/useUserWithFamily'

export const Route = createFileRoute('/_authenticated/family/settings')({
  component: FamilySettingsPage,
})

function FamilySettingsPage() {
  const { data: family, isLoading } = useCurrentFamily()
  const { data: familyMembers, isLoading: isMembersLoading } = useFamilyMembers(family?.id)
  const { isParent, user } = useUserWithFamily()
  const updateModule = useUpdateModule()
  const createInvite = useCreateInvite()
  const navigate = useNavigate()
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
          if (!isEnabled) {
            toast.success(`${moduleDefinitions[moduleId].name} enabled`, {
              description: (
                <div className="flex justify-between items-center">
                  <span>Module has been activated for your family</span>
                  <Button
                    variant="link"
                    onClick={() => navigate({ to: `/cadence/${moduleId}` })}
                    className="flex items-center gap-1"
                  >
                    Open <ExternalLinkIcon className="h-3 w-3" />
                  </Button>
                </div>
              ),
            })
          } else {
            toast.info(`${moduleDefinitions[moduleId].name} disabled`, {
              description: 'Module has been deactivated for your family',
            })
          }
        },
        onError: (error) => {
          toast.error(`Failed to update ${moduleDefinitions[moduleId].name}`, {
            description: error instanceof Error ? error.message : 'Please try again',
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
          toast.success('Invitation sent', {
            description: (
              <div className="flex justify-between items-center">
                <span>{inviteEmail} has been invited to your family</span>
              </div>
            ),
          })
          setInviteDialogOpen(false)
          setInviteEmail('')
        },
        onError: (error) => {
          toast.error('Failed to send invitation', {
            description: error instanceof Error ? error.message : 'Please try again',
          })
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

                  {isMembersLoading ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Loading family members...
                      </p>
                    </div>
                  ) : !familyMembers || familyMembers.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <p>No family members found</p>
                      <p className="text-sm">This should not happen. Please contact support.</p>
                    </div>
                  ) : (
                    familyMembers.map((member) => (
                      <div
                        key={member.id}
                        className="grid grid-cols-4 p-3 items-center border-t text-sm"
                      >
                        <div className="font-medium">{`${member.firstName} ${member.lastName}`}</div>
                        <div className="text-muted-foreground">{member.email}</div>
                        <div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              member.role === 'PARENT'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                            }`}
                          >
                            {member.role === 'PARENT' ? 'Parent' : 'Child'}
                          </span>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={member.id === user?.id || !isParent}
                            title={
                              member.id === user?.id
                                ? 'You cannot modify your own role'
                                : 'Manage member'
                            }
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
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
