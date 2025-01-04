import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { LoginForm } from '@/components/auth/LoginForm'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const { authentication: auth } = Route.useRouteContext()

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      await auth.login(credentials)
      router.navigate({ to: '/' })
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign in to your account</h2>
        <LoginForm onSubmit={handleLogin} error={auth.error} isLoading={auth.isLoading} />
        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
