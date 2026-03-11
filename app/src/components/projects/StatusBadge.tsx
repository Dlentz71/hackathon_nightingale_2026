import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TaskStatus, ProjectStatus } from '@/types'
import { TASK_STATUS_LABELS, PROJECT_STATUS_LABELS } from '@/lib/constants'

const TASK_STATUS_STYLES: Record<TaskStatus, string> = {
  'todo': 'bg-slate-100 text-slate-700 border-slate-200',
  'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
  'blocked': 'bg-red-50 text-red-700 border-red-200',
  'done': 'bg-green-50 text-green-700 border-green-200',
}

const PROJECT_STATUS_STYLES: Record<ProjectStatus, string> = {
  planning: 'bg-slate-100 text-slate-700 border-slate-200',
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  inflight: 'bg-blue-50 text-blue-700 border-blue-200',
  paused: 'bg-orange-50 text-orange-700 border-orange-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
}

interface TaskStatusBadgeProps {
  status: TaskStatus
  className?: string
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('font-normal', TASK_STATUS_STYLES[status], className)}
    >
      {TASK_STATUS_LABELS[status]}
    </Badge>
  )
}

interface ProjectStatusBadgeProps {
  status: ProjectStatus
  className?: string
}

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('font-normal', PROJECT_STATUS_STYLES[status], className)}
    >
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  )
}
