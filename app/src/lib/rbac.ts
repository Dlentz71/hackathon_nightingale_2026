import type { User, RbacAction } from '@/types'

const PERMISSIONS: Record<string, RbacAction[]> = {
  admin: [
    'project:create',
    'project:edit',
    'project:delete',
    'project:changeStatus',
    'project:complete',
    'task:create',
    'task:edit',
    'task:delete',
    'task:bulkDelete',
    'team:manage',
    'user:manage',
  ],
  'team-member': [
    'project:create',
    'project:edit',
    'project:delete',
    'task:create',
    'task:edit',
    'task:delete',
  ],
  viewer: [],
}

export function can(user: User | null, action: RbacAction): boolean {
  if (!user) return false
  return PERMISSIONS[user.role]?.includes(action) ?? false
}
