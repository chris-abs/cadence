import { useState } from 'react'
import { LockIcon, ShieldAlertIcon, Unlock } from 'lucide-react'

import {
  Button,
  Label,
  Alert,
  AlertDescription,
  AlertTitle,
  PinInput,
} from '@/Global/components/atoms'
import { H3, Muted, Section } from '@/Global/components/molecules'
import { Profile, UpdateProfileRequest } from '@/Profile/types'

interface ProfilePinSectionProps {
  profile: Profile
  onUpdate: (data: UpdateProfileRequest) => Promise<void>
  isUpdating: boolean
}

export function ProfilePinSection({ profile, onUpdate, isUpdating }: ProfilePinSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showRemovePin, setShowRemovePin] = useState(false)
  const [pin, setPin] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (showRemovePin) {
      await onUpdate({
        id: profile.id,
        pin: '',
        currentPin: profile.hasPin ? currentPin : undefined,
      })
      setIsEditing(false)
      setShowRemovePin(false)
      setPin('')
      setCurrentPin('')
      setConfirmPin('')
      return
    }

    if (pin !== confirmPin) {
      setError('PINs do not match')
      return
    }

    if (!/^\d{6}$/.test(pin)) {
      setError('PIN must be 6 digits')
      return
    }

    try {
      await onUpdate({
        id: profile.id,
        pin,
        currentPin: profile.hasPin ? currentPin : undefined,
      })
      setIsEditing(false)
      setPin('')
      setCurrentPin('')
      setConfirmPin('')
    } catch (err) {
      setError('Failed to update PIN')
      console.error(err)
    }
  }

  return (
    <Section>
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <H3>Security Settings</H3>
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              {profile.hasPin ? 'Change PIN' : 'Set PIN'}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(false)
                  setShowRemovePin(false)
                  setPin('')
                  setCurrentPin('')
                  setConfirmPin('')
                  setError(null)
                }}
                disabled={isUpdating}
              >
                Cancel
              </Button>
            </div>
          )}
        </header>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {profile.hasPin ? (
              <LockIcon className="h-5 w-5 text-green-500" />
            ) : (
              <Unlock className="h-5 w-5 text-yellow-500" />
            )}
            <Muted>Profile PIN</Muted>
          </div>

          <div className="text-foreground">
            {profile.hasPin ? (
              <div className="flex items-center gap-2">
                <span>PIN protection enabled</span>
                <div className="flex-1" />
                {isEditing && !showRemovePin && (
                  <Button variant="destructive" size="sm" onClick={() => setShowRemovePin(true)}>
                    Remove PIN
                  </Button>
                )}
              </div>
            ) : (
              <span>No PIN protection</span>
            )}
          </div>

          {isEditing && (
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              {error && (
                <Alert variant="destructive">
                  <ShieldAlertIcon className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {profile.hasPin && !showRemovePin && (
                <div className="space-y-2">
                  <Label htmlFor="current-pin">Current PIN</Label>
                  <PinInput
                    value={currentPin}
                    onChange={setCurrentPin}
                    length={6}
                    description="Enter your current PIN"
                    error={!!error && error.includes('current PIN')}
                    autoFocus
                  />
                </div>
              )}

              {!showRemovePin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="new-pin">{profile.hasPin ? 'New PIN' : 'PIN'}</Label>
                    <PinInput
                      value={pin}
                      onChange={setPin}
                      length={6}
                      description="PIN must be 6 digits"
                      error={
                        !!error &&
                        (error.includes('must be 6 digits') || error.includes('do not match'))
                      }
                      autoFocus={!profile.hasPin}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-pin">Confirm PIN</Label>
                    <PinInput
                      value={confirmPin}
                      onChange={setConfirmPin}
                      length={6}
                      error={!!error && error.includes('do not match')}
                    />
                  </div>
                </>
              )}

              <Button type="submit" disabled={isUpdating} className="mt-2">
                {isUpdating
                  ? 'Saving...'
                  : showRemovePin
                    ? 'Remove PIN'
                    : profile.hasPin
                      ? 'Update PIN'
                      : 'Set PIN'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </Section>
  )
}
