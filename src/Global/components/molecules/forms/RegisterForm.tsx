import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import {
  Alert,
  AlertDescription,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Input,
} from '@/Global/components/atoms'
import { registerSchema } from '@/User/schemas/auth'

type FormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSubmit: (credentials: FormData) => void
  error?: string | null
  isLoading?: boolean
}

export function RegisterForm({ onSubmit, error, isLoading }: RegisterFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert
            variant="destructive"
            className="border-destructive/30 bg-destructive/10 text-destructive"
          >
            <AlertDescription className="capitalize">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John"
                    {...field}
                    className={
                      form.formState.errors.firstName
                        ? 'border-destructive'
                        : 'border-border/50 bg-background/50 transition-all duration-200 focus-visible:ring-primary'
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Doe"
                    {...field}
                    className={
                      form.formState.errors.lastName
                        ? 'border-destructive'
                        : 'border-border/50 bg-background/50 transition-all duration-200 focus-visible:ring-primary'
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="email@example.com"
                  {...field}
                  className={
                    form.formState.errors.email
                      ? 'border-destructive'
                      : 'border-border/50 bg-background/50 transition-all duration-200 focus-visible:ring-primary'
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••"
                  {...field}
                  className={
                    form.formState.errors.password
                      ? 'border-destructive'
                      : 'border-border/50 bg-background/50 transition-all duration-200 focus-visible:ring-primary'
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 transition-all duration-200"
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
    </Form>
  )
}
