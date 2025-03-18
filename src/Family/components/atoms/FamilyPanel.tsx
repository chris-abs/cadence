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

interface FamilyPanelProps {
  onManage?: () => void
}

export function FamilyPanel({ onManage }: FamilyPanelProps) {
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
            <CardTitle>{family.familyName}</CardTitle>
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
      </CardContent>
    </Card>
  )
}
