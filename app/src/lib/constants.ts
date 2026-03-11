import type { TshirtSize, TaskStatus, ProjectStatus, Priority } from '@/types'

export const TSHIRT_HOURS: Record<TshirtSize, number> = {
  S: 4,
  M: 8,
  L: 16,
  XL: 32,
  XXL: 40,
}

export const TSHIRT_SIZES: TshirtSize[] = ['S', 'M', 'L', 'XL', 'XXL']

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'blocked': 'Blocked',
  'done': 'Done',
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  pending: 'Pending',
  inflight: 'Inflight',
  paused: 'Paused',
  completed: 'Completed',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export const PROJECT_STATUS_ORDER: Record<ProjectStatus, number> = {
  planning: 0,
  pending: 1,
  inflight: 2,
  paused: 3,
  completed: 4,
}

export const QUARTER_WEEKS = 13
export const OVERALLOCATION_THRESHOLD = 1.0

export const UTILIZATION_HEALTHY = 0.9   // < 90 % → green
export const UTILIZATION_AT_RISK = 1.1   // 90–110 % → yellow, > 110 % → red
