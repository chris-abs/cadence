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
import { AuthPageWrapper, LoginForm } from '@/Global/components/molecules'
import { LoginCredentials } from '@/Global/types'
import { Crown } from 'lucide-react'

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
    <AuthPageWrapper>
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar-primary text-background">
            <Crown />
          </div>
        </div>

        <Card className="border-border/30 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sign in to Cadence</CardTitle>
            <CardDescription>
              Enter your credentials to access your family dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm onSubmit={handleLogin} error={loginError} isLoading={auth.isLoginLoading} />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Register here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthPageWrapper>
  )
}
