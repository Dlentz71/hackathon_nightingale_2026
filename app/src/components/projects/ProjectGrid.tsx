import { useState } from 'react'
import { Plus, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProjectCard } from './ProjectCard'
import { can } from '@/lib/rbac'
import { useAuthStore } from '@/store/useAuthStore'
import { PRIORITY_ORDER } from '@/lib/constants'
import type { Project, Task, ProjectStatus, Priority } from '@/types'

type SortField = 'name' | 'startDate' | 'priority'
type SortDir = 'asc' | 'desc'

const ALL_VALUE = '__all__'

interface ProjectGridProps {
  projects: Project[]
  onCreateProject: () => void
  onEditProject: (project: Project) => void
  onAddTask: (projectId: string) => void
  onEditTask: (task: Task) => void
}

export function ProjectGrid({
  projects,
  onCreateProject,
  onEditProject,
  onAddTask,
  onEditTask,
}: ProjectGridProps) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const canCreate = can(currentUser, 'project:create')

  const [statusFilter, setStatusFilter] = useState<ProjectStatus | typeof ALL_VALUE>(ALL_VALUE)
  const [priorityFilter, setPriorityFilter] = useState<Priority | typeof ALL_VALUE>(ALL_VALUE)
  const [sortField, setSortField] = useState<SortField>('startDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const filtered = projects
    .filter((p) => statusFilter === ALL_VALUE || p.status === statusFilter)
    .filter((p) => priorityFilter === ALL_VALUE || p.priority === priorityFilter)
    .sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortField === 'startDate') cmp = a.startDate.localeCompare(b.startDate)
      else if (sortField === 'priority') cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      return sortDir === 'asc' ? cmp : -cmp
    })

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProjectStatus | typeof ALL_VALUE)}>
          <SelectTrigger className="h-8 w-40 text-sm" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inflight">Inflight</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as Priority | typeof ALL_VALUE)}>
          <SelectTrigger className="h-8 w-40 text-sm" aria-label="Filter by priority">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Sort:</span>
          {(['name', 'startDate', 'priority'] as SortField[]).map((field) => (
            <Button
              key={field}
              variant={sortField === field ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 gap-1 px-2 text-xs"
              onClick={() => toggleSort(field)}
              aria-pressed={sortField === field}
              aria-label={`Sort by ${field}${sortField === field ? `, currently ${sortDir}` : ''}`}
            >
              {field === 'startDate' ? 'Date' : field.charAt(0).toUpperCase() + field.slice(1)}
              {sortField === field && (
                <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
              )}
            </Button>
          ))}
        </div>

        {canCreate && (
          <Button size="sm" className="ml-auto h-8" onClick={onCreateProject}>
            <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            New project
          </Button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm font-medium text-foreground">No projects found</p>
          <p className="text-xs text-muted-foreground">
            {projects.length === 0
              ? 'Create your first project to get started.'
              : 'Try adjusting your filters.'}
          </p>
          {canCreate && projects.length === 0 && (
            <Button size="sm" onClick={onCreateProject}>
              <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              New project
            </Button>
          )}
        </div>
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
          aria-label="Projects grid"
        >
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={onEditProject}
              onAddTask={onAddTask}
              onEditTask={onEditTask}
            />
          ))}
        </div>
      )}
    </div>
  )
}
