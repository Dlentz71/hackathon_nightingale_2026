import { useState } from 'react'
import { Plus, Search, Trash2, ClipboardList } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { TaskRow } from './TaskRow'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { useProjectStore } from '@/store/useProjectStore'
import { useAssignmentStore } from '@/store/useAssignmentStore'
import { canDeleteProject } from '@/lib/projectRules'
import type { Task, TaskStatus, Priority } from '@/types'

const ALL_VALUE = '__all__'

interface TaskListProps {
  projectId: string
  canEdit: boolean
  canBulkDelete: boolean
  onAddTask: () => void
  onEditTask: (task: Task) => void
}

export function TaskList({ projectId, canEdit, canBulkDelete, onAddTask, onEditTask }: TaskListProps) {
  const allTasks = useProjectStore((s) => s.tasks)
  const { deleteTask, bulkDeleteTasks } = useProjectStore()
  const { assignments } = useAssignmentStore()

  const tasks = allTasks.filter((t) => t.projectId === projectId)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | typeof ALL_VALUE>(ALL_VALUE)
  const [priorityFilter, setPriorityFilter] = useState<Priority | typeof ALL_VALUE>(ALL_VALUE)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [blockError, setBlockError] = useState<string | null>(null)

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === ALL_VALUE || t.status === statusFilter
    const matchesPriority = priorityFilter === ALL_VALUE || t.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  function handleDeleteTask(task: Task) {
    setTaskToDelete(task)
  }

  function confirmDeleteTask() {
    if (!taskToDelete) return
    deleteTask(taskToDelete.id)
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(taskToDelete.id); return next })
    setTaskToDelete(null)
  }

  function handleBulkDelete() {
    const ids = Array.from(selectedIds)
    const selectedTasks = tasks.filter((t) => ids.includes(t.id))
    const taskAssignments = assignments.filter(
      (a) => ids.includes(a.taskId),
    )
    const { allowed } = canDeleteProject(selectedTasks, taskAssignments)
    if (!allowed) {
      setBulkDeleteOpen(true)
    } else {
      setBulkDeleteOpen(true)
    }
  }

  function confirmBulkDelete() {
    bulkDeleteTasks(Array.from(selectedIds))
    setSelectedIds(new Set())
    setBlockError(null)
  }

  const selectedTasksWithActiveAssignments = tasks.filter(
    (t) => selectedIds.has(t.id) && assignments.some((a) => a.taskId === t.id && t.status !== 'done'),
  )

  const bulkDeleteWarning = selectedTasksWithActiveAssignments.length > 0
    ? `${selectedTasksWithActiveAssignments.length} selected task${selectedTasksWithActiveAssignments.length > 1 ? 's have' : ' has'} active assignments — deleting them will also remove those assignments. Continue?`
    : `Delete ${selectedIds.size} selected task${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <ClipboardList className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-foreground">No tasks yet</p>
          <p className="text-xs text-muted-foreground">Add your first task to start planning capacity.</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={onAddTask}>
            <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Add task
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
            aria-label="Search tasks"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | typeof ALL_VALUE)}>
          <SelectTrigger className="h-8 w-36 text-sm" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as Priority | typeof ALL_VALUE)}>
          <SelectTrigger className="h-8 w-36 text-sm" aria-label="Filter by priority">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {canEdit && (
          <Button size="sm" variant="outline" onClick={onAddTask} className="ml-auto h-8">
            <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Add task
          </Button>
        )}

        {canBulkDelete && selectedIds.size > 0 && (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkDelete}
            className="h-8"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Delete {selectedIds.size}
          </Button>
        )}
      </div>

      {blockError && (
        <p className="text-sm text-destructive" role="alert">{blockError}</p>
      )}

      <Separator />

      {/* Task rows */}
      <div role="list" aria-label="Task list" className="space-y-1.5">
        {filteredTasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No tasks match your filters.</p>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} role="listitem">
              <TaskRow
                task={task}
                isSelected={selectedIds.has(task.id)}
                canEdit={canEdit}
                canBulkSelect={canBulkDelete}
                onSelectChange={(checked) => {
                  setSelectedIds((prev) => {
                    const next = new Set(prev)
                    if (checked) next.add(task.id)
                    else next.delete(task.id)
                    return next
                  })
                }}
                onEdit={onEditTask}
                onDelete={handleDeleteTask}
              />
            </div>
          ))
        )}
      </div>

      {/* Single task delete */}
      <DeleteConfirmDialog
        open={!!taskToDelete}
        onOpenChange={(open) => { if (!open) setTaskToDelete(null) }}
        title="Delete task"
        description={`Delete "${taskToDelete?.name}"? This cannot be undone.`}
        onConfirm={confirmDeleteTask}
      />

      {/* Bulk delete */}
      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete selected tasks"
        description={bulkDeleteWarning}
        onConfirm={confirmBulkDelete}
        confirmLabel={`Delete ${selectedIds.size} tasks`}
      />
    </div>
  )
}
