import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useProjectStore } from '@/store/useProjectStore'
import { useAuthStore } from '@/store/useAuthStore'
import { isProjectNameDuplicate } from '@/lib/projectRules'
import type { Project, Priority } from '@/types'
import { cn } from '@/lib/utils'

interface ProjectDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
}

const DEFAULT_FORM = {
  name: '',
  description: '',
  startDate: '',
  targetEndDate: '',
  priority: 'medium' as Priority,
}

export function ProjectDrawer({ open, onOpenChange, project }: ProjectDrawerProps) {
  const projects = useProjectStore((s) => s.projects)
  const { addProject, updateProject } = useProjectStore()
  const currentUser = useAuthStore((s) => s.currentUser)

  const [form, setForm] = useState(DEFAULT_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof DEFAULT_FORM, string>>>({})

  const isEditing = !!project

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setForm(project ? {
        name: project.name,
        description: project.description,
        startDate: project.startDate,
        targetEndDate: project.targetEndDate ?? '',
        priority: project.priority,
      } : DEFAULT_FORM)
      setErrors({})
    }
  }, [open, project])
  /* eslint-enable react-hooks/set-state-in-effect */

  function validate(): boolean {
    const next: typeof errors = {}
    if (!form.name.trim()) next.name = 'Name is required.'
    else if (isProjectNameDuplicate(form.name, projects, project?.id)) next.name = 'A project with this name already exists.'
    if (!form.description.trim()) next.description = 'Description is required.'
    if (!form.startDate) next.startDate = 'Start date is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !currentUser) return

    const now = new Date().toISOString()

    if (isEditing && project) {
      updateProject(project.id, {
        ...form,
        targetEndDate: form.targetEndDate || undefined,
        updatedBy: currentUser.id,
        updatedAt: now,
      })
    } else {
      const newProject: Project = {
        id: crypto.randomUUID(),
        ...form,
        targetEndDate: form.targetEndDate || undefined,
        status: 'planning',
        createdBy: currentUser.id,
        updatedBy: currentUser.id,
        createdAt: now,
        updatedAt: now,
      }
      addProject(newProject)
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{isEditing ? 'Edit project' : 'New project'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Update project details.' : 'Create a new project to start planning capacity.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="proj-name">Name <span aria-hidden="true">*</span></Label>
            <Input
              id="proj-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              aria-required="true"
              aria-describedby={errors.name ? 'proj-name-error' : undefined}
              className={cn(errors.name && 'border-destructive focus-visible:ring-destructive')}
            />
            {errors.name && (
              <p id="proj-name-error" className="text-xs text-destructive" role="alert">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proj-description">Description <span aria-hidden="true">*</span></Label>
            <Textarea
              id="proj-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              aria-required="true"
              aria-describedby={errors.description ? 'proj-desc-error' : undefined}
              className={cn(errors.description && 'border-destructive focus-visible:ring-destructive')}
            />
            {errors.description && (
              <p id="proj-desc-error" className="text-xs text-destructive" role="alert">{errors.description}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proj-priority">Priority <span aria-hidden="true">*</span></Label>
            <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}>
              <SelectTrigger id="proj-priority" aria-required="true">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proj-start">Start date <span aria-hidden="true">*</span></Label>
            <Input
              id="proj-start"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              aria-required="true"
              aria-describedby={errors.startDate ? 'proj-start-error' : undefined}
              className={cn(errors.startDate && 'border-destructive focus-visible:ring-destructive')}
            />
            {errors.startDate && (
              <p id="proj-start-error" className="text-xs text-destructive" role="alert">{errors.startDate}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proj-end">Target end date <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="proj-end"
              type="date"
              value={form.targetEndDate}
              onChange={(e) => setForm((f) => ({ ...f, targetEndDate: e.target.value }))}
              min={form.startDate || undefined}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Save changes' : 'Create project'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
