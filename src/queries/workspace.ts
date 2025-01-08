import { useQuery } from '@tanstack/react-query'

// TODO - implement actual workspaces into the BE
interface Workspace {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
  item_count: number
  container_count: number
}

async function fetchWorkspace(id: number): Promise<Workspace> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    id,
    name: `Workspace ${id}`,
    description: 'A mock workspace for development purposes',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    item_count: Math.floor(Math.random() * 50),
    container_count: Math.floor(Math.random() * 10),
  }
}

export function useWorkspace(id: number) {
  return useQuery({
    queryKey: ['workspace', id],
    queryFn: () => fetchWorkspace(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}
