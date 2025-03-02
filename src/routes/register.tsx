import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/Global/components/atoms'
import { RegisterForm } from '@/Global/components/molecules'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const router = useRouter()
  const { authentication: auth } = Route.useRouteContext()
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
      router.navigate({ to: '/login' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setRegisterError(errorMessage)
      toast.error('Registration failed', {
        description: errorMessage,
      })
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-[400px]">
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
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
