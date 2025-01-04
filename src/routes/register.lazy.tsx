import { RegisterForm } from '@/components/auth'
import { useRegister } from '@/lib/auth'
import { RegisterCredentials } from '@/type/auth'
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const register = useRegister()

  const handleRegister = (credentials: RegisterCredentials) => {
    register.mutate(credentials, {
      onSuccess: () => {
        navigate({ to: '/login' })
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <RegisterForm 
          onSubmit={handleRegister} 
          error={register.error?.message}
          isLoading={register.isPending}
        />
      </div>
    </div>
  )
}