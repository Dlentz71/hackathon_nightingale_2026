import type { User, RbacAction, TeamMember } from '@/types'

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

/**
 * Viewers must never be assigned to tasks.
 * A TeamMember is assignable only if no User with their teamMemberId has the 'viewer' role.
 */
export function canBeAssigned(teamMember: TeamMember, users: User[]): boolean {
  const linkedUser = users.find((u) => u.teamMemberId === teamMember.id)
  return linkedUser?.role !== 'viewer'
}
