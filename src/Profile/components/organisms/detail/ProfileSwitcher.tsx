import { useState } from 'react'
import { Crown, LockIcon } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Input,
} from '@/Global/components/atoms'
import { AuthPageWrapper } from '@/Global/components/molecules'
import { Profile } from '@/Profile/types'
import { useSelectProfile, useVerifyPin } from '@/Profile/queries'

interface ProfileSwitcherProps {
  profiles: Profile[]
  onProfileSelected?: (profile: Profile) => void
  title?: string
  description?: string
}

export function ProfileSwitcher({
  profiles,
  onProfileSelected,
  title = "Who's using Cadence?",
  description = 'Select your profile to access your family dashboard',
}: ProfileSwitcherProps) {
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selectProfile = useSelectProfile()
  const verifyPin = useVerifyPin()

  const handleProfileClick = (profile: Profile) => {
    if (profile.hasPin) {
      setSelectedProfile(profile)
      setIsPinDialogOpen(true)
    } else {
      handleSelectProfile(profile)
    }
  }

  const handleSelectProfile = async (profile: Profile, providedPin?: string) => {
    try {
      await selectProfile.mutateAsync({
        profileId: profile.id,
        pin: providedPin,
      })

      if (onProfileSelected) {
        onProfileSelected(profile)
      }
    } catch (err) {
      console.log(err)
      setError('Failed to select profile')
    }
  }

  const handlePinSubmit = async () => {
    if (!selectedProfile) return

    try {
      setError(null)

      await verifyPin.mutateAsync({
        profileId: selectedProfile.id,
        pin,
      })

      await handleSelectProfile(selectedProfile, pin)
      setIsPinDialogOpen(false)
    } catch {
      setError('Incorrect PIN')
      setPin('')
    }
  }

  return (
    <AuthPageWrapper>
      <div className="w-full max-w-4xl">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar-primary text-background">
            <Crown />
          </div>
        </div>

        <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  className="group flex flex-col items-center gap-2 rounded-md p-4 transition-colors hover:bg-accent/50"
                  onClick={() => handleProfileClick(profile)}
                >
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      {profile.imageUrl ? (
                        <AvatarImage src={profile.imageUrl} alt={profile.name} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary text-xl">
                          {profile.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {profile.hasPin && (
                      <div className="absolute -right-1 -bottom-1 rounded-full bg-background p-1 shadow-md">
                        <LockIcon className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    {profile.isOwner && (
                      <div className="absolute -right-1 -top-1 rounded-full bg-background p-1 shadow-md">
                        <Crown className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                  <span className="text-center font-medium">{profile.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {profile.role.toLowerCase()}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-16 w-16">
                {selectedProfile?.imageUrl ? (
                  <AvatarImage src={selectedProfile.imageUrl} alt={selectedProfile.name} />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedProfile?.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="text-lg font-medium">{selectedProfile?.name}</span>
            </div>

            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="text-center text-lg tracking-widest"
                maxLength={4}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePinSubmit()
                  }
                }}
              />
              {error && <div className="text-center text-sm text-destructive">{error}</div>}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsPinDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePinSubmit} disabled={!pin || verifyPin.isPending}>
              {verifyPin.isPending ? 'Verifying...' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AuthPageWrapper>
  )
}
