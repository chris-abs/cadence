import { HomeIcon, UsersIcon, UserPlusIcon } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Global/components/atoms'
import { Button } from '@/Global/components/atoms'
import { useUserWithFamily } from '@/User/hooks/useUserWithFamily'

export function FamilyPanel() {
  const { family, isParent } = useUserWithFamily()

  if (!family) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HomeIcon className="h-5 w-5 text-primary" />
            <CardTitle>{family.name}</CardTitle>
          </div>
          <UsersIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <CardDescription>Manage your family settings and members</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p className="text-muted-foreground">Family ID: {family.id}</p>
          <p className="text-muted-foreground">
            Created: {new Date(family.createdAt).toLocaleDateString()}
          </p>
        </div>

        {isParent && (
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full flex items-center gap-2">
              <UserPlusIcon className="h-4 w-4" />
              Invite Member
            </Button>
            <Button variant="secondary" size="sm" className="w-full">
              Manage Family
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
