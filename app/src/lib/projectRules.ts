import type { Project, Task, Assignment, User, ProjectStatus, TaskStatusBreakdown } from '@/types'

/** Returns tasks whose unmet dependencies block them from starting */
export function getUnmetDependencies(task: Task, allTasks: Task[]): Task[] {
  return task.dependencies
    .map(depId => allTasks.find(t => t.id === depId))
    .filter((dep): dep is Task => dep !== undefined && dep.status !== 'done')
}

/** True if all dependencies are done and task can move to in-progress */
export function canMoveToInProgress(
  task: Task,
  allTasks: Task[],
): { allowed: boolean; blockedBy: Task[] } {
  const blockedBy = getUnmetDependencies(task, allTasks)
  return { allowed: blockedBy.length === 0, blockedBy }
}

/** Returns task names that block project deletion (assigned + not done) */
export function canDeleteProject(
  tasks: Task[],
  assignments: Assignment[],
): { allowed: boolean; blockedBy: string[] } {
  const assignedTaskIds = new Set(assignments.map(a => a.taskId))
  const blockedBy = tasks
    .filter(t => assignedTaskIds.has(t.id) && t.status !== 'done')
    .map(t => t.name)
  return { allowed: blockedBy.length === 0, blockedBy }
}

/** Validates a project status transition */
export function canTransitionStatus(
  _project: Project,
  nextStatus: ProjectStatus,
  tasks: Task[],
  user: User,
): { allowed: boolean; reason?: string } {
  if (nextStatus === 'completed') {
    if (user.role !== 'admin') {
      return { allowed: false, reason: 'Only admins can mark a project as Completed.' }
    }
    const assignedTasks = tasks.filter(t => t.assignmentIds.length > 0)
    const allDone = assignedTasks.every(t => t.status === 'done')
    if (!allDone) {
      return { allowed: false, reason: 'All assigned tasks must be done before completing the project.' }
    }
  }

  if (nextStatus === 'paused') {
    const hasActiveTasks = tasks.some(t => t.status === 'in-progress')
    if (hasActiveTasks) {
      return { allowed: false, reason: 'A project cannot be paused while tasks are in progress.' }
    }
  }

  return { allowed: true }
}

/** Breakdown of task statuses for a project */
export function getTaskStatusBreakdown(tasks: Task[]): TaskStatusBreakdown {
  return tasks.reduce(
    (acc, task) => {
      acc.total++
      if (task.status === 'done') acc.done++
      else if (task.status === 'in-progress') acc.inProgress++
      else if (task.status === 'blocked') acc.blocked++
      else acc.todo++
      return acc
    },
    { done: 0, inProgress: 0, todo: 0, blocked: 0, total: 0 } as TaskStatusBreakdown,
  )
}

/** Progress percentage (0-100) based on done tasks */
export function getProjectProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0
  const done = tasks.filter(t => t.status === 'done').length
  return Math.round((done / tasks.length) * 100)
}

/** Case-insensitive duplicate name check */
export function isProjectNameDuplicate(
  name: string,
  projects: Project[],
  excludeId?: string,
): boolean {
  const normalised = name.trim().toLowerCase()
  return projects.some(
    p => p.name.toLowerCase() === normalised && p.id !== excludeId,
  )
}
