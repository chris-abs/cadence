import { Users, UserCog } from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Global/components/atoms'
import { Section } from '@/Global/components/molecules'
import { User } from '@/User/types'

interface FamilyMembersSectionProps {
  members: User[] | undefined
  isParent: boolean
  currentUserId: number
  isLoading: boolean
}

export function FamilyMembersSection({
  members,
  isParent,
  currentUserId,
  isLoading,
}: FamilyMembersSectionProps) {
  return (
    <Section>
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

            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading family members...</p>
              </div>
            ) : !members || members.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <p>No family members found</p>
                <p className="text-sm">This should not happen. Please contact support.</p>
              </div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="grid grid-cols-4 p-3 items-center border-t text-sm">
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
                      disabled={member.id === currentUserId || !isParent}
                      title={
                        member.id === currentUserId
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
    </Section>
  )
}
