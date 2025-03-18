export const queryKeys = {
  user: ['user'] as const,
  family: {
    all: ['family'] as const,
    detail: ['family', 'detail'] as const,
    modules: ['family', 'modules'] as const,
  },
  profile: {
    all: ['profile'] as const,
    list: ['profile', 'list'] as const,
    detail: (id: number) => ['profile', 'detail', id] as const,
    current: ['profile', 'current'] as const,
    validate: ['profile', 'validate'] as const,
  },
  search: (query: string) => ['search', query] as const,
  recent: ['recent'] as const,
  // todo: we need to modularise this
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
  chores: {
    tasks: {
      list: ['chores', 'tasks'],
      detail: (id: number) => ['chores', 'tasks', id],
      byAssignee: (assigneeId: number) => ['chores', 'tasks', 'assignee', assigneeId],
    },
    instances: {
      list: (queryString: string) => ['chores', 'instances', queryString],
      detail: (id: number) => ['chores', 'instances', id],
    },
    verification: (date: string, assigneeId: number) => [
      'chores',
      'verification',
      date,
      assigneeId,
    ],
    stats: (userId: number, startDate: string, endDate: string) => [
      'chores',
      'stats',
      userId,
      startDate,
      endDate,
    ],
  },
}
