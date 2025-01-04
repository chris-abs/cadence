
import { RegisterCredentials } from '@/type/auth'
import { useState } from 'react'
import { Button, ErrorMessage, Input } from '@components/ui'

interface RegisterFormProps {
  onSubmit: (credentials: RegisterCredentials) => void
  error?: string
  isLoading?: boolean
}

export function RegisterForm({ onSubmit, error, isLoading }: RegisterFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, email, password })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <ErrorMessage message={error} />
      
      <div className="rounded-md shadow-sm space-y-4">
        <Input
          id="name"
          name="name"
          type="text"
          required
          label="Full name"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />
        
        <Input
          id="email"
          name="email"
          type="email"
          required
          label="Email address"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
        
        <Input
          id="password"
          name="password"
          type="password"
          required
          label="Password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <Button type="submit" isLoading={isLoading}>
        Create account
      </Button>
    </form>
  )
}