import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useLogin } from '../lib/auth'
import { LoginCredentials } from '@/type/auth'
import { LoginForm } from '@components/auth'

export const Route = createLazyFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()

  const handleLogin = (credentials: LoginCredentials) => {
    login.mutate(credentials, {
      onSuccess: () => {
        navigate({ to: '/' })
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <LoginForm 
          onSubmit={handleLogin} 
          error={login.error?.message}
          isLoading={login.isPending}
        />
      </div>
    </div>
  )
}