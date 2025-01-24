import { useState } from 'react'
import { Button } from '@/Global/components/atoms'
import { H3, Muted, Section } from '@/Global/components/molecules'
import { User } from '@/User/types'
import { EmailChangeModal } from '../../organisms/modals/EmailChangeModal'

interface UserEmailSectionProps {
  user: User
  onUpdate: (data: Partial<User>) => Promise<void>
  isUpdating: boolean
}

export function UserEmailSection({ user, onUpdate, isUpdating }: UserEmailSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <Section>
      <div className="space-y-6">
        <header className="flex justify-between items-center">
          <H3>Email Settings</H3>
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>
            Change Email
          </Button>
        </header>

        <div className="space-y-2">
          <Muted>Current Email</Muted>
          <div className="text-foreground">{user.email}</div>
        </div>
      </div>

      <EmailChangeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentEmail={user.email}
        onUpdate={onUpdate}
        isUpdating={isUpdating}
      />
    </Section>
  )
}
