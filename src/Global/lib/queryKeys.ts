export const queryKeys = {
  user: ['user'] as const,
  search: (query: string) => ['search', query] as const,
  recent: ['recent'] as const,
  containers: {
    list: ['containers'] as const,
    detail: (id: number) => ['containers', id] as const,
    search: (query: string) => ['containers', 'search', query] as const,
    qr: (code: string) => ['containers', 'qr', code] as const,
  },
  workspaces: {
    list: ['workspaces'] as const,
    detail: (id: number) => ['workspaces', id] as const,
    search: (query: string) => ['workspaces', 'search', query] as const,
  },
  items: {
    list: ['items'] as const,
    detail: (id: number) => ['items', id] as const,
    search: (query: string) => ['items', 'search', query] as const,
  },
  tags: {
    list: ['tags'] as const,
    detail: (id: number) => ['tags', id] as const,
    search: (query: string) => ['tags', 'search', query] as const,
  },
  taggedItems: {
    search: (query: string) => ['tagged-items', 'search', query] as const,
  },
}
