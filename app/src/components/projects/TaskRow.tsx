import { Link2, Pencil, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TaskStatusBadge } from './StatusBadge'
import { PriorityIndicator } from './PriorityIndicator'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'
import { useProjectStore } from '@/store/useProjectStore'
import { useAssignmentStore } from '@/store/useAssignmentStore'
import { useTeamStore } from '@/store/useTeamStore'
import { getUnmetDependencies } from '@/lib/projectRules'
import { getMemberUtilization } from '@/lib/capacity'
import { UTILIZATION_HEALTHY, UTILIZATION_AT_RISK } from '@/lib/constants'

interface TaskRowProps {
  task: Task
  isSelected: boolean
  canEdit: boolean
  canBulkSelect: boolean
  onSelectChange: (checked: boolean) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

function memberInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function utilizationColor(ratio: number): string {
  if (ratio > UTILIZATION_AT_RISK) return 'bg-red-100 text-red-700 border-red-200'
  if (ratio >= UTILIZATION_HEALTHY) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  return 'bg-green-100 text-green-700 border-green-200'
}

export function TaskRow({
  task,
  isSelected,
  canEdit,
  canBulkSelect,
  onSelectChange,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const allTasks = useProjectStore((s) => s.tasks)
  const assignments = useAssignmentStore((s) => s.assignments)
  const teamMembers = useTeamStore((s) => s.teamMembers)

  const unmetDeps = getUnmetDependencies(task, allTasks)

  const taskAssignments = assignments.filter((a) => a.taskId === task.id)
  const assignedMembers = taskAssignments
    .map((a) => teamMembers.find((m) => m.id === a.memberId))
    .filter(Boolean) as typeof teamMembers

  const MAX_VISIBLE = 4
  const visibleMembers = assignedMembers.slice(0, MAX_VISIBLE)
  const overflow = assignedMembers.length - MAX_VISIBLE

  const assignedLabel = assignedMembers.length > 0
    ? `Assigned to: ${assignedMembers.map((m) => m.name).join(', ')}`
    : undefined

  return (
    <div
      className={cn(
        'group rounded-md border bg-card px-3 py-2.5 transition-colors hover:bg-muted/30',
        isSelected && 'border-primary/30 bg-primary/5',
      )}
    >
      {/* Row 1: checkbox + task name + action buttons */}
      <div className="flex items-start gap-2">
        {canBulkSelect && (
          <Checkbox
            id={`task-select-${task.id}`}
            checked={isSelected}
            onCheckedChange={onSelectChange}
            aria-label={`Select task: ${task.name}`}
            className="mt-0.5 shrink-0"
          />
        )}

        <span className="flex-1 text-sm font-medium leading-snug text-foreground">
          {task.name}
        </span>

        {canEdit && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(task)}
              aria-label={`Edit task: ${task.name}`}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(task)}
              aria-label={`Delete task: ${task.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      {/* Row 2: status + priority + size + dependency + assigned avatars */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <TaskStatusBadge status={task.status} />
        <PriorityIndicator priority={task.priority} showLabel />
        <Badge variant="outline" className="text-xs font-normal">
          {task.estimate.size} · {task.estimate.hours}h
        </Badge>

        {unmetDeps.length > 0 && (
          <Badge
            variant="outline"
            className="gap-1 border-orange-200 bg-orange-50 text-orange-700 text-xs font-normal"
            aria-label={`Blocked by ${unmetDeps.length} task${unmetDeps.length > 1 ? 's' : ''}`}
          >
            <Link2 className="h-3 w-3" aria-hidden="true" />
            Blocked by {unmetDeps.length}
          </Badge>
        )}

        {assignedMembers.length > 0 && (
          <div
            className="flex items-center gap-1 ml-auto"
            aria-label={assignedLabel}
            role="group"
          >
            {visibleMembers.map((member) => {
              const ratio = getMemberUtilization(member, assignments)
              return (
                <span
                  key={member.id}
                  title={member.name}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold shrink-0',
                    utilizationColor(ratio),
                  )}
                >
                  {memberInitials(member.name)}
                </span>
              )
            })}
            {overflow > 0 && (
              <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border bg-muted px-1 text-[10px] font-medium text-muted-foreground">
                +{overflow}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
