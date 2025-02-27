import { useRouter } from '@tanstack/react-router'

export function useBreadcrumbs() {
  const router = useRouter()
  const pathname = router.state.location.pathname

  const segments = pathname.split('/').filter(Boolean)

  const breadcrumbs = []
  let currentPath = ''

  for (const segment of segments) {
    currentPath += `/${segment}`

    const label = segment.charAt(0).toUpperCase() + segment.slice(1)
    breadcrumbs.push({ label, href: currentPath })
  }

  if (breadcrumbs.length === 0) {
    breadcrumbs.push({ label: 'Dashboard', href: '/' })
  }

  return breadcrumbs
}
