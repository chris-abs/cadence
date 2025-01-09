import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    const { isLogged } = context.authentication
    if (!isLogged()) {
      throw redirect({ to: '/login' })
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        localStorage.removeItem('token')
        throw redirect({ to: '/login' })
      }
    } catch (error) {
      console.error(error)
      localStorage.removeItem('token')
      throw redirect({ to: '/login' })
    }
  },
})
