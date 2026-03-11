import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTeamStore } from '@/store/useTeamStore'
import { useAuthStore } from '@/store/useAuthStore'
import { isMemberNameDuplicate } from '@/lib/teamRules'
import type { TeamMember } from '@/types'
import { cn } from '@/lib/utils'

interface TeamMemberDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member?: TeamMember | null
}

const DEFAULT_FORM = {
  name: '',
  role: '',
  hoursPerWeek: '40',
  startDate: '',
  endDate: '',
}

export function TeamMemberDrawer({ open, onOpenChange, member }: TeamMemberDrawerProps) {
  const { teamMembers, addTeamMember, updateTeamMember } = useTeamStore()
  const currentUser = useAuthStore((s) => s.currentUser)

  const [form, setForm] = useState(DEFAULT_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof DEFAULT_FORM, string>>>({})

  const isEditing = !!member

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setForm(member ? {
        name: member.name,
        role: member.role,
        hoursPerWeek: String(member.hoursPerWeek),
        startDate: member.startDate ?? '',
        endDate: member.endDate ?? '',
      } : DEFAULT_FORM)
      setErrors({})
    }
  }, [open, member])
  /* eslint-enable react-hooks/set-state-in-effect */

  function validate() {
    const next: typeof errors = {}
    const trimmedName = form.name.trim()

    if (!trimmedName) {
      next.name = 'Name is required.'
    } else if (isMemberNameDuplicate(trimmedName, teamMembers, member?.id)) {
      next.name = 'A team member with this name already exists.'
    }

    if (!form.role.trim()) {
      next.role = 'Job title is required.'
    }

    const hrs = Number(form.hoursPerWeek)
    if (!form.hoursPerWeek || isNaN(hrs) || !Number.isInteger(hrs) || hrs < 1 || hrs > 80) {
      next.hoursPerWeek = 'Hours per week must be a whole number between 1 and 80.'
    }

    if (form.startDate && form.endDate && form.endDate <= form.startDate) {
      next.endDate = 'End date must be after start date.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !currentUser) return

    const now = new Date().toISOString()
    const hrs = parseInt(form.hoursPerWeek, 10)

    if (isEditing && member) {
      updateTeamMember(member.id, {
        name: form.name.trim(),
        role: form.role.trim(),
        hoursPerWeek: hrs,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      })
    } else {
      const newMember: TeamMember = {
        id: `tm-${now}`,
        name: form.name.trim(),
        role: form.role.trim(),
        hoursPerWeek: hrs,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      }
      addTeamMember(newMember)
    }

    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Team Member' : 'New Team Member'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update this team member's details."
              : 'Add a new person to the team roster.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="member-name">
              Name <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="member-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              aria-required="true"
              aria-describedby={errors.name ? 'member-name-error' : undefined}
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && (
              <p id="member-name-error" className="text-sm text-destructive" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          {/* Job title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="member-role">
              Job Title <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="member-role"
              placeholder="e.g. Senior Backend Engineer"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              aria-required="true"
              aria-describedby={errors.role ? 'member-role-error' : undefined}
              className={cn(errors.role && 'border-destructive')}
            />
            {errors.role && (
              <p id="member-role-error" className="text-sm text-destructive" role="alert">
                {errors.role}
              </p>
            )}
          </div>

          {/* Hours per week */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="member-hours">
              Hours / Week <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="member-hours"
              type="number"
              min={1}
              max={80}
              step={1}
              value={form.hoursPerWeek}
              onChange={(e) => setForm((f) => ({ ...f, hoursPerWeek: e.target.value }))}
              aria-required="true"
              aria-describedby={errors.hoursPerWeek ? 'member-hours-error' : undefined}
              className={cn('w-32', errors.hoursPerWeek && 'border-destructive')}
            />
            {errors.hoursPerWeek && (
              <p id="member-hours-error" className="text-sm text-destructive" role="alert">
                {errors.hoursPerWeek}
              </p>
            )}
          </div>

          {/* Start date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="member-start">Start Date</Label>
            <Input
              id="member-start"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              className="w-48"
            />
          </div>

          {/* End date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="member-end">End Date</Label>
            <Input
              id="member-end"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              aria-describedby={errors.endDate ? 'member-end-error' : undefined}
              className={cn('w-48', errors.endDate && 'border-destructive')}
            />
            {errors.endDate && (
              <p id="member-end-error" className="text-sm text-destructive" role="alert">
                {errors.endDate}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit">{isEditing ? 'Save Changes' : 'Add Member'}</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
