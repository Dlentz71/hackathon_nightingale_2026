import { useState } from 'react'
import { ChevronDown, ChevronRight, Pencil, Trash2, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProjectStatusBadge } from './StatusBadge'
import { PriorityIndicator } from './PriorityIndicator'
import { TaskList } from './TaskList'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { useProjectStore } from '@/store/useProjectStore'
import { useAssignmentStore } from '@/store/useAssignmentStore'
import { useAuthStore } from '@/store/useAuthStore'
import { can } from '@/lib/rbac'
import { canDeleteProject, canTransitionStatus, getTaskStatusBreakdown, getProjectProgress } from '@/lib/projectRules'
import type { Project, Task, ProjectStatus } from '@/types'
import { PROJECT_STATUS_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onAddTask: (projectId: string) => void
  onEditTask: (task: Task) => void
}

export function ProjectCard({ project, onEdit, onAddTask, onEditTask }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  const tasks = useProjectStore((s) => s.tasks.filter((t) => t.projectId === project.id))
  const allTasks = useProjectStore((s) => s.tasks)
  const { deleteProject, updateProject } = useProjectStore()
  const { assignments } = useAssignmentStore()
  const currentUser = useAuthStore((s) => s.currentUser)

  const canEdit = can(currentUser, 'project:edit')
  const canDelete = can(currentUser, 'project:delete')
  const canChangeStatus = can(currentUser, 'project:changeStatus')
  const canBulkDelete = can(currentUser, 'task:bulkDelete')

  const breakdown = getTaskStatusBreakdown(tasks)
  const progress = getProjectProgress(tasks)

  const { allowed: canDel, blockedBy } = canDeleteProject(tasks, assignments)

  function handleDelete() {
    if (!canDel) return
    deleteProject(project.id)
    setDeleteOpen(false)
  }

  function handleStatusChange(next: ProjectStatus) {
    if (!currentUser) return
    const { allowed, reason } = canTransitionStatus(project, next, allTasks.filter(t => t.projectId === project.id), currentUser)
    if (!allowed) {
      setStatusError(reason ?? 'Status change not allowed.')
      return
    }
    setStatusError(null)
    updateProject(project.id, {
      status: next,
      updatedBy: currentUser.id,
      updatedAt: new Date().toISOString(),
    })
  }

  const deleteDescription = !canDel
    ? `Cannot delete: the following tasks have active assignments: ${blockedBy.join(', ')}. Reassign or complete those tasks first.`
    : `Delete "${project.name}" and all its tasks? This cannot be undone.`

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            {/* Title + badges */}
            <div className="flex flex-1 flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold truncate">{project.name}</h2>
                <PriorityIndicator priority={project.priority} showLabel />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1">
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEdit(project)}
                  aria-label={`Edit project: ${project.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                  aria-label={`Delete project: ${project.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>

          {/* Status + dates */}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {canChangeStatus ? (
              <div className="flex flex-col gap-1">
                <Select value={project.status} onValueChange={(v) => handleStatusChange(v as ProjectStatus)}>
                  <SelectTrigger
                    className="h-6 w-auto gap-1.5 border-0 bg-transparent px-0 shadow-none text-xs focus:ring-1"
                    aria-label={`Project status: ${PROJECT_STATUS_LABELS[project.status]}`}
                  >
                    <ProjectStatusBadge status={project.status} />
                    <SelectValue className="sr-only" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {statusError && (
                  <p className="text-xs text-destructive" role="alert">{statusError}</p>
                )}
              </div>
            ) : (
              <ProjectStatusBadge status={project.status} />
            )}

            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {project.startDate}
              {project.targetEndDate && ` → ${project.targetEndDate}`}
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-0 flex flex-col gap-3">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                {breakdown.done} done · {breakdown.inProgress} in progress · {breakdown.todo} todo
                {breakdown.blocked > 0 && ` · ${breakdown.blocked} blocked`}
              </span>
              <span className="text-xs font-medium">{progress}%</span>
            </div>
            <Progress
              value={progress}
              className="h-1.5"
              aria-label={`${project.name} progress: ${progress}%`}
            />
          </div>

          {/* Expand/collapse tasks */}
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-7 w-full justify-start gap-1.5 px-1 text-xs text-muted-foreground hover:text-foreground')}
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={`task-list-${project.id}`}
          >
            {expanded
              ? <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              : <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
            {breakdown.total} task{breakdown.total !== 1 ? 's' : ''}
          </Button>

          {/* Task list */}
          {expanded && (
            <div id={`task-list-${project.id}`}>
              <TaskList
                projectId={project.id}
                canEdit={canEdit}
                canBulkDelete={canBulkDelete}
                onAddTask={() => onAddTask(project.id)}
                onEditTask={onEditTask}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete project"
        description={deleteDescription}
        onConfirm={handleDelete}
        confirmLabel="Delete project"
        isDestructive={canDel}
      />
    </>
  )
}
