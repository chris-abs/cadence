import { HomeIcon, UsersIcon } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Global/components/atoms'
import { useProfileWithFamily } from '@/Profile/hooks/useProfileWithFamily'

export function FamilyPanel() {
  const { family, isLoading } = useProfileWithFamily()

  if (isLoading) {
    return <p>Loading...</p>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HomeIcon className="h-5 w-5 text-primary" />
            <CardTitle>{family?.familyName}</CardTitle>
          </div>
          <UsersIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <CardDescription>Manage your family settings and members</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <p className="text-muted-foreground">Family ID: {family?.id}</p>
        </div>
      </CardContent>
    </Card>
  )
}
