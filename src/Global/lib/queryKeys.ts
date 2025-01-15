export const queryKeys = {
  user: ['user'] as const,
  search: (query: string) => ['search', query] as const,
  recent: ['recent'] as const,
  containers: {
    list: ['containers'] as const,
    detail: (id: number) => ['containers', id] as const,
  },
  workspaces: {
    list: ['workspaces'] as const,
    detail: (id: number) => ['workspaces', id] as const,
  },
  items: {
    list: ['items'] as const,
    detail: (id: number) => ['items', id] as const,
  },
  tags: {
    list: ['tags'] as const,
    detail: (id: number) => ['tags', id] as const,
  },
}
