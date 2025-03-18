import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Crown } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Global/components/atoms'
import { AuthPageWrapper, RegisterForm } from '@/Global/components/molecules'
import { useAuth } from '@/Global/hooks/useAuth'

interface RegisterSearchParams {
  redirectTo?: string
  token?: string
}

export const Route = createFileRoute('/register')({
  component: RegisterPage,
  validateSearch: (search: Record<string, unknown>): RegisterSearchParams => {
    return {
      redirectTo: search.redirectTo as string | undefined,
      token: search.token as string | undefined,
    }
  },
})

function RegisterPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [registerError, setRegisterError] = useState<string | null>(null)

  const handleRegister = async (credentials: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => {
    try {
      setRegisterError(null)
      await auth.register(credentials)

      toast.success('Account created successfully')
      navigate({ to: '/login' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setRegisterError(errorMessage)
      toast.error('Registration failed', {
        description: errorMessage,
      })
    }
  }

  return (
    <AuthPageWrapper>
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar-primary text-background">
            <Crown />
          </div>
        </div>

        <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>Enter your details below to create your account</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm
              onSubmit={handleRegister}
              error={registerError}
              isLoading={auth.isRegisterLoading}
            />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthPageWrapper>
  )
}
