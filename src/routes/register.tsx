import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const router = useRouter()
  const { authentication: auth } = Route.useRouteContext()

  const handleRegister = async (credentials: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => {
    try {
      await auth.register(credentials)
      router.navigate({ to: '/login' })
    } catch (error) {
      console.error('Registration failed:', error)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create your account</h2>
        <RegisterForm onSubmit={handleRegister} error={auth.error} isLoading={auth.isLoading} />
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
