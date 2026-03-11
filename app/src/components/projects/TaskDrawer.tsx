import { useEffect, useState } from 'react'
import { Check, ChevronsUpDown, TriangleAlert, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useProjectStore } from '@/store/useProjectStore'
import { useAssignmentStore } from '@/store/useAssignmentStore'
import { useTeamStore } from '@/store/useTeamStore'
import { useAuthStore } from '@/store/useAuthStore'
import { can } from '@/lib/rbac'
import { getProjectedUtilization } from '@/lib/capacity'
import { TSHIRT_HOURS, TSHIRT_SIZES, UTILIZATION_AT_RISK } from '@/lib/constants'
import type { Task, TshirtSize, TaskStatus, Priority } from '@/types'
import { cn } from '@/lib/utils'

interface TaskDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  task?: Task | null
}

const DEFAULT_FORM = {
  name: '',
  description: '',
  size: 'M' as TshirtSize,
  status: 'todo' as TaskStatus,
  priority: 'medium' as Priority,
  dependencies: [] as string[],
}

export function TaskDrawer({ open, onOpenChange, projectId, task }: TaskDrawerProps) {
  const { addTask, updateTask, tasks: allTasks } = useProjectStore()
  const { assignments, addAssignment, deleteAssignment } = useAssignmentStore()
  const { teamMembers } = useTeamStore()
  const currentUser = useAuthStore((s) => s.currentUser)

  const [form, setForm] = useState(DEFAULT_FORM)
  const [errors, setErrors] = useState<Partial<Record<'name' | 'description', string>>>({})
  const [depPopoverOpen, setDepPopoverOpen] = useState(false)

  // Assignment form state
  const [newAssignMemberId, setNewAssignMemberId] = useState('')
  const [newAssignHours, setNewAssignHours] = useState('')
  const [assignError, setAssignError] = useState('')

  const isEditing = !!task
  const canManage = can(currentUser, 'task:edit')

  // Other tasks in same project (excluding this task)
  const siblingTasks = allTasks.filter(
    (t) => t.projectId === projectId && t.id !== task?.id,
  )

  // Current assignments for this task
  const taskAssignments = task
    ? assignments.filter((a) => a.taskId === task.id)
    : []

  // Team members not yet assigned to this task
  const assignedMemberIds = new Set(taskAssignments.map((a) => a.memberId))
  const availableMembers = teamMembers.filter((m) => !assignedMemberIds.has(m.id))

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setForm(task ? {
        name: task.name,
        description: task.description,
        size: task.estimate.size,
        status: task.status,
        priority: task.priority,
        dependencies: task.dependencies,
      } : DEFAULT_FORM)
      setErrors({})
      setNewAssignMemberId('')
      setNewAssignHours('')
      setAssignError('')
    }
  }, [open, task])
  /* eslint-enable react-hooks/set-state-in-effect */

  function validate(): boolean {
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Name is required.'
    if (!form.description.trim()) next.description = 'Description is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function toggleDependency(taskId: string) {
    setForm((f) => ({
      ...f,
      dependencies: f.dependencies.includes(taskId)
        ? f.dependencies.filter((id) => id !== taskId)
        : [...f.dependencies, taskId],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !currentUser) return
    const now = new Date().toISOString()
    const hours = TSHIRT_HOURS[form.size]

    if (isEditing && task) {
      updateTask(task.id, {
        name: form.name,
        description: form.description,
        estimate: { size: form.size, hours },
        status: form.status,
        priority: form.priority,
        dependencies: form.dependencies,
        updatedBy: currentUser.id,
        updatedAt: now,
      })
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        projectId,
        name: form.name,
        description: form.description,
        estimate: { size: form.size, hours },
        status: form.status,
        priority: form.priority,
        dependencies: form.dependencies,
        assignmentIds: [],
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
        createdAt: now,
        updatedAt: now,
      }
      addTask(newTask)
    }
    onOpenChange(false)
  }

  function handleAddAssignment() {
    if (!task || !newAssignMemberId) {
      setAssignError('Please select a team member.')
      return
    }
    const hrs = parseInt(newAssignHours, 10)
    if (!newAssignHours || isNaN(hrs) || hrs < 1 || hrs > 999) {
      setAssignError('Hours must be a number between 1 and 999.')
      return
    }
    setAssignError('')

    const member = teamMembers.find((m) => m.id === newAssignMemberId)
    if (!member) return

    const assignmentId = crypto.randomUUID()
    addAssignment({ id: assignmentId, taskId: task.id, memberId: member.id, hoursAllocated: hrs })
    updateTask(task.id, {
      assignmentIds: [...task.assignmentIds, assignmentId],
      updatedBy: currentUser?.id ?? '',
      updatedAt: new Date().toISOString(),
    })

    setNewAssignMemberId('')
    setNewAssignHours('')
  }

  function handleRemoveAssignment(assignmentId: string) {
    if (!task) return
    deleteAssignment(assignmentId)
    updateTask(task.id, {
      assignmentIds: task.assignmentIds.filter((id) => id !== assignmentId),
      updatedBy: currentUser?.id ?? '',
      updatedAt: new Date().toISOString(),
    })
  }

  // Over-allocation warning for selected member
  const projectedMember = teamMembers.find((m) => m.id === newAssignMemberId)
  const additionalHrs = parseInt(newAssignHours, 10)
  const isOverAllocWarning =
    projectedMember &&
    !isNaN(additionalHrs) &&
    additionalHrs > 0 &&
    getProjectedUtilization(projectedMember, assignments, additionalHrs) > UTILIZATION_AT_RISK

  const selectedDepNames = form.dependencies
    .map((id) => siblingTasks.find((t) => t.id === id)?.name)
    .filter(Boolean)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isEditing ? "max-w-4xl w-full overflow-y-auto max-h-[90vh]" : "max-w-lg w-full overflow-y-auto max-h-[90vh]"}>
        <DialogHeader className="mb-4">
          <DialogTitle>{isEditing ? 'Edit task' : 'New task'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update task details and manage assignments.' : 'Add a task to this project.'}
          </DialogDescription>
        </DialogHeader>

        <div className={isEditing ? "grid grid-cols-2 gap-8" : ""}>
          {/* LEFT column (or single column in create mode): task form */}
          <div>
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="task-name">Name <span aria-hidden="true">*</span></Label>
                <Input
                  id="task-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  aria-required="true"
                  aria-describedby={errors.name ? 'task-name-error' : undefined}
                  className={cn(errors.name && 'border-destructive focus-visible:ring-destructive')}
                />
                {errors.name && (
                  <p id="task-name-error" className="text-xs text-destructive" role="alert">{errors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-desc">Description <span aria-hidden="true">*</span></Label>
                <Textarea
                  id="task-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  aria-required="true"
                  aria-describedby={errors.description ? 'task-desc-error' : undefined}
                  className={cn(errors.description && 'border-destructive focus-visible:ring-destructive')}
                />
                {errors.description && (
                  <p id="task-desc-error" className="text-xs text-destructive" role="alert">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="task-size">Size <span aria-hidden="true">*</span></Label>
                  <Select value={form.size} onValueChange={(v) => setForm((f) => ({ ...f, size: v as TshirtSize }))}>
                    <SelectTrigger id="task-size" aria-required="true">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TSHIRT_SIZES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s} · {TSHIRT_HOURS[s]}h
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="task-priority">Priority <span aria-hidden="true">*</span></Label>
                  <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}>
                    <SelectTrigger id="task-priority" aria-required="true">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-status">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as TaskStatus }))}>
                  <SelectTrigger id="task-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dependencies multi-select */}
              {siblingTasks.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Dependencies <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Popover open={depPopoverOpen} onOpenChange={setDepPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={depPopoverOpen}
                        aria-label="Select task dependencies"
                        className="w-full justify-between font-normal"
                      >
                        <span className="truncate text-sm">
                          {form.dependencies.length === 0
                            ? 'Select dependencies…'
                            : `${form.dependencies.length} selected`}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search tasks…" />
                        <CommandList>
                          <CommandEmpty>No tasks found.</CommandEmpty>
                          <CommandGroup>
                            {siblingTasks.map((t) => (
                              <CommandItem
                                key={t.id}
                                value={t.name}
                                onSelect={() => toggleDependency(t.id)}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    form.dependencies.includes(t.id) ? 'opacity-100' : 'opacity-0',
                                  )}
                                  aria-hidden="true"
                                />
                                {t.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedDepNames.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1" aria-label="Selected dependencies">
                      {selectedDepNames.map((name, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">{isEditing ? 'Save changes' : 'Add task'}</Button>
              </div>
            </form>
          </div>

          {/* RIGHT column: assignments (edit mode only) */}
          {isEditing && (
            <div className="border-l pl-8">
              <section aria-labelledby="assignments-heading">
                <h3 id="assignments-heading" className="mb-4 text-sm font-semibold">Assignments</h3>

                {/* Current assignment list */}
                {taskAssignments.length === 0 ? (
                  <p className="mb-4 text-xs text-muted-foreground">No one assigned yet.</p>
                ) : (
                  <ul className="mb-4 space-y-2" aria-label="Current assignments">
                    {taskAssignments.map((a) => {
                      const member = teamMembers.find((m) => m.id === a.memberId)
                      return (
                        <li key={a.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
                          <span className="flex-1 text-sm font-medium">{member?.name ?? 'Unknown'}</span>
                          <Badge variant="outline" className="text-xs font-normal">{a.hoursAllocated}h</Badge>
                          {canManage && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveAssignment(a.id)}
                              aria-label={`Remove ${member?.name ?? 'assignment'}`}
                            >
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}

                {/* Add assignment form */}
                {canManage && availableMembers.length > 0 && (
                  <div className="space-y-3">
                    {/* Over-allocation warning */}
                    {isOverAllocWarning && (
                      <div
                        role="alert"
                        className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                      >
                        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          This will push {projectedMember?.name} above 110% utilization.
                          You can still add the assignment.
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <Label htmlFor="assign-member" className="sr-only">Team member</Label>
                        <Select value={newAssignMemberId} onValueChange={setNewAssignMemberId}>
                          <SelectTrigger id="assign-member" className="h-9 text-sm">
                            <SelectValue placeholder="Select member…" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableMembers.map((m) => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-20">
                        <Label htmlFor="assign-hours" className="sr-only">Hours</Label>
                        <Input
                          id="assign-hours"
                          type="number"
                          min={1}
                          max={999}
                          step={1}
                          placeholder="hrs"
                          value={newAssignHours}
                          onChange={(e) => setNewAssignHours(e.target.value)}
                          className="h-9 text-sm"
                          aria-label="Hours allocated"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="h-9"
                        onClick={handleAddAssignment}
                      >
                        Add
                      </Button>
                    </div>

                    {assignError && (
                      <p className="text-xs text-destructive" role="alert">{assignError}</p>
                    )}
                  </div>
                )}

                {canManage && availableMembers.length === 0 && taskAssignments.length > 0 && (
                  <p className="text-xs text-muted-foreground">All team members are already assigned.</p>
                )}
              </section>
            </div>
          )}
        </div>

        {/* Create mode note */}
        {!isEditing && (
          <div className="mt-4 border-t pt-4">
            <p className="text-xs text-muted-foreground">Save this task first to add team assignments.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
