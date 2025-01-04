import { useState } from 'react'
import { Input } from '@components/ui'
import { Button } from '@components/ui'
import type { RegisterCredentials } from '@/types/auth'

interface RegisterFormProps {
  onSubmit: (credentials: RegisterCredentials) => void
  error?: string
  isLoading?: boolean
}

export function RegisterForm({ onSubmit, error, isLoading }: RegisterFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ 
      email, 
      password, 
      firstName,
      lastName,
      imageUrl: '' 
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 p-4 rounded text-red-600 text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <Input
          id="firstName"
          name="firstName"
          type="text"
          label="First name"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={isLoading}
          required
        />
        
        <Input
          id="lastName"
          name="lastName"
          type="text"
          label="Last name"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={isLoading}
          required
        />
        
        <Input
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />
        
        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <Button type="submit" isLoading={isLoading}>
        Create account
      </Button>
    </form>
  )
}