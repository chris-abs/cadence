export const queryKeys = {
  user: ['user'] as const,
  family: {
    detail: (id: number) => ['family', id] as const,
    current: ['family', 'current'] as const,
    members: (id: number) => ['family', id, 'members'] as const,
    modules: (id: number) => ['family', id, 'modules'] as const,
    invites: (id: number) => ['family', id, 'invites'] as const,
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
