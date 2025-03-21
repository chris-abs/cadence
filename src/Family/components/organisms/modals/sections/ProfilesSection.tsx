import { UserPlus, UserCog, Crown } from 'lucide-react'

import {
  Card,
  CardContent,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Global/components/atoms'
import { useProfileWithFamily } from '@/Profile/hooks/useProfileWithFamily'
import { Profile } from '@/Profile/types'
import { useProfiles } from '@/Profile/queries'

interface ProfilesSectionProps {
  onCreateProfile: () => void
}

export function ProfilesSection({ onCreateProfile }: ProfilesSectionProps) {
  const { profile: currentProfile } = useProfileWithFamily()
  const { data: profiles, isLoading: isProfilesLoading } = useProfiles()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Family Members</h3>
        <Button onClick={onCreateProfile} size="sm" className="flex gap-2 items-center">
          <UserPlus className="h-4 w-4" />
          Add Profile
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md">
            <div className="grid grid-cols-4 p-3 bg-muted/50 text-sm font-medium">
              <div>Profile</div>
              <div>Role</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>

            {isProfilesLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading family members...</p>
              </div>
            ) : !profiles?.profiles.length ? (
              <div className="p-6 text-center text-muted-foreground">
                <p>No family members found</p>
                <p className="text-sm">This should not happen. Please contact support.</p>
              </div>
            ) : (
              profiles.profiles.map((profile) => (
                <ProfileRow
                  key={profile.id}
                  profile={profile}
                  isCurrentProfile={currentProfile?.id === profile.id}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ProfileRowProps {
  profile: Profile
  isCurrentProfile: boolean
}

function ProfileRow({ profile, isCurrentProfile }: ProfileRowProps) {
  return (
    <div
      className={`grid grid-cols-4 p-3 items-center border-t text-sm ${
        isCurrentProfile ? 'bg-accent/20' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          {profile.imageUrl ? (
            <AvatarImage src={profile.imageUrl} alt={profile.name} />
          ) : (
            <AvatarFallback className="bg-primary/10 text-primary">
              {profile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <p className="font-medium">{profile.name}</p>
          {isCurrentProfile && <p className="text-xs text-muted-foreground">Current profile</p>}
        </div>
      </div>
      <div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            profile.role === 'PARENT'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
          }`}
        >
          {profile.role === 'PARENT' ? 'Parent' : 'Child'}
        </span>
      </div>
      <div>
        {profile.isOwner && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            <Crown className="h-3 w-3" /> Owner
          </span>
        )}
        {profile.hasPin && (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 px-2.5 py-0.5 text-xs font-medium ml-1">
            PIN Protected
          </span>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <UserCog className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit Profile</DropdownMenuItem>
            {!profile.isOwner && (
              <DropdownMenuItem className="text-destructive">Delete Profile</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
