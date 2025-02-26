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
import { LoginForm } from '@/Global/components/molecules'
import { LoginCredentials } from '@/Global/types'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const { authentication: auth } = Route.useRouteContext()
  const [loginError, setLoginError] = useState<string | null>(null)

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      setLoginError(null)
      await auth.login(credentials)
      router.navigate({ to: '/cadence' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setLoginError(errorMessage)
      toast.error('Login failed', {
        description: errorMessage,
      })
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSubmit={handleLogin} error={loginError} isLoading={auth.isLoading} />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary underline-offset-4 hover:underline">
              Register here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
