import type { TeamMember, Assignment, Task } from '@/types'

// Re-export so existing consumers (TeamView, tests) keep working
export { getMemberUtilization } from '@/lib/capacity'

/** Returns task names that block deletion (member has assignments on non-done tasks) */
export function canDeleteMember(
  member: TeamMember,
  assignments: Assignment[],
  tasks: Task[],
): { allowed: boolean; blockedBy: string[] } {
  const memberAssignments = assignments.filter((a) => a.memberId === member.id)
  const blockedBy = memberAssignments
    .map((a) => tasks.find((t) => t.id === a.taskId))
    .filter((t): t is Task => t !== undefined && t.status !== 'done')
    .map((t) => t.name)
  return { allowed: blockedBy.length === 0, blockedBy }
}

/** Returns true if the name is already used by another member (case-insensitive) */
export function isMemberNameDuplicate(
  name: string,
  members: TeamMember[],
  excludeId?: string,
): boolean {
  const normalised = name.trim().toLowerCase()
  return members.some(
    (m) => m.name.toLowerCase() === normalised && m.id !== excludeId,
  )
}
