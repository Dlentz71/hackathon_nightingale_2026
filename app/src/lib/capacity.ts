import type { TeamMember, Assignment, Task, Project } from '@/types'
import { QUARTER_WEEKS, UTILIZATION_AT_RISK } from '@/lib/constants'

// ─── Core per-member math ─────────────────────────────────────────────────────

/** Quarterly capacity in hours for a team member */
export function getMemberCapacity(member: TeamMember): number {
  return member.hoursPerWeek * QUARTER_WEEKS
}

/** Utilization ratio (0–∞) based on all assignments for the member */
export function getMemberUtilization(
  member: TeamMember,
  assignments: Assignment[],
): number {
  const capacity = getMemberCapacity(member)
  if (capacity === 0) return 0
  const totalHours = assignments
    .filter((a) => a.memberId === member.id)
    .reduce((sum, a) => sum + a.hoursAllocated, 0)
  return totalHours / capacity
}

/** Projected utilization after hypothetically adding `additionalHours` to a member */
export function getProjectedUtilization(
  member: TeamMember,
  assignments: Assignment[],
  additionalHours: number,
): number {
  const capacity = getMemberCapacity(member)
  if (capacity === 0) return 0
  const currentHours = assignments
    .filter((a) => a.memberId === member.id)
    .reduce((sum, a) => sum + a.hoursAllocated, 0)
  return (currentHours + additionalHours) / capacity
}

// ─── Dashboard aggregates ─────────────────────────────────────────────────────

export interface TeamCapacitySummary {
  memberCount: number
  totalCapacityHours: number
  totalAllocatedHours: number
  overAllocatedCount: number
}

/** Aggregate stats for the summary cards */
export function getTeamCapacitySummary(
  members: TeamMember[],
  assignments: Assignment[],
): TeamCapacitySummary {
  const totalCapacityHours = members.reduce((sum, m) => sum + getMemberCapacity(m), 0)
  const totalAllocatedHours = assignments.reduce((sum, a) => sum + a.hoursAllocated, 0)
  const overAllocatedCount = members.filter(
    (m) => getMemberUtilization(m, assignments) > UTILIZATION_AT_RISK,
  ).length
  return {
    memberCount: members.length,
    totalCapacityHours,
    totalAllocatedHours,
    overAllocatedCount,
  }
}

export interface MemberAllocationRow {
  memberId: string
  memberName: string
  utilization: number         // ratio 0–∞
  allocatedHours: number
  capacityHours: number
  byProject: Record<string, number>   // projectId → hoursAllocated
}

/**
 * Returns one row per member with total utilization and hours broken down by project.
 * Sorted by utilization descending (most overloaded first).
 */
export function getMemberAllocationRows(
  members: TeamMember[],
  assignments: Assignment[],
  tasks: Task[],
  projects: Project[],
): MemberAllocationRow[] {
  const taskProjectMap = new Map(tasks.map((t) => [t.id, t.projectId]))
  const projectIds = new Set(projects.map((p) => p.id))

  return members
    .map((member) => {
      const memberAssignments = assignments.filter((a) => a.memberId === member.id)
      const allocatedHours = memberAssignments.reduce((sum, a) => sum + a.hoursAllocated, 0)
      const capacityHours = getMemberCapacity(member)
      const utilization = capacityHours === 0 ? 0 : allocatedHours / capacityHours

      const byProject: Record<string, number> = {}
      for (const assignment of memberAssignments) {
        const projectId = taskProjectMap.get(assignment.taskId)
        if (projectId && projectIds.has(projectId)) {
          byProject[projectId] = (byProject[projectId] ?? 0) + assignment.hoursAllocated
        }
      }

      return { memberId: member.id, memberName: member.name, utilization, allocatedHours, capacityHours, byProject }
    })
    .sort((a, b) => b.utilization - a.utilization)
}
