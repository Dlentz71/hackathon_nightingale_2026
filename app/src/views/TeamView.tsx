import { useState } from 'react'
import { Pencil, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteConfirmDialog } from '@/components/projects/DeleteConfirmDialog'
import { TeamMemberDrawer } from '@/components/team/TeamMemberDrawer'
import { useTeamStore } from '@/store/useTeamStore'
import { useAssignmentStore } from '@/store/useAssignmentStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useAuthStore } from '@/store/useAuthStore'
import { can } from '@/lib/rbac'
import { getMemberUtilization, canDeleteMember } from '@/lib/teamRules'
import { UTILIZATION_HEALTHY, UTILIZATION_AT_RISK } from '@/lib/constants'
import type { TeamMember } from '@/types'

type UtilFilter = 'all' | 'healthy' | 'at-risk' | 'overallocated'

function utilizationLevel(ratio: number): UtilFilter {
  if (ratio > UTILIZATION_AT_RISK) return 'overallocated'
  if (ratio >= UTILIZATION_HEALTHY) return 'at-risk'
  return 'healthy'
}

function UtilizationBadge({ ratio }: { ratio: number }) {
  const pct = Math.round(ratio * 100)
  const level = utilizationLevel(ratio)

  const styles: Record<string, string> = {
    healthy: 'bg-green-100 text-green-800 border-green-200',
    'at-risk': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    overallocated: 'bg-red-100 text-red-800 border-red-200',
  }
  const labels: Record<string, string> = {
    healthy: 'Healthy',
    'at-risk': 'At Risk',
    overallocated: 'Overallocated',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[level]}`}
      aria-label={`${pct}% utilization — ${labels[level]}`}
    >
      {pct}%
      <span className="opacity-70">· {labels[level]}</span>
    </span>
  )
}

export function TeamView() {
  const { teamMembers, deleteTeamMember } = useTeamStore()
  const { assignments, deleteAssignmentsByMember } = useAssignmentStore()
  const { tasks } = useProjectStore()
  const currentUser = useAuthStore((s) => s.currentUser)

  const [search, setSearch] = useState('')
  const [utilFilter, setUtilFilter] = useState<UtilFilter>('all')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const isAdmin = can(currentUser, 'team:manage') && currentUser?.role === 'admin'

  // Compute display rows
  const rows = teamMembers
    .filter((m) => {
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
      if (utilFilter !== 'all') {
        const ratio = getMemberUtilization(m, assignments)
        if (utilizationLevel(ratio) !== utilFilter) return false
      }
      return true
    })
    .map((m) => ({
      member: m,
      ratio: getMemberUtilization(m, assignments),
    }))

  function handleCreate() {
    setEditingMember(null)
    setDrawerOpen(true)
  }

  function handleEdit(member: TeamMember) {
    setEditingMember(member)
    setDrawerOpen(true)
  }

  function handleDeleteClick(member: TeamMember) {
    const check = canDeleteMember(member, assignments, tasks)
    if (!check.allowed) {
      setDeleteError(
        `Cannot delete ${member.name} — they have active assignments on: ${check.blockedBy.join(', ')}.`,
      )
      setDeleteTarget(null)
      return
    }
    setDeleteError(null)
    setDeleteTarget(member)
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteAssignmentsByMember(deleteTarget.id)
    deleteTeamMember(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-56"
            aria-label="Search team members by name"
          />
          <Select value={utilFilter} onValueChange={(v) => setUtilFilter(v as UtilFilter)}>
            <SelectTrigger className="h-9 w-44" aria-label="Filter by utilization">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All utilization</SelectItem>
              <SelectItem value="healthy">Healthy (&lt; 90%)</SelectItem>
              <SelectItem value="at-risk">At Risk (90–110%)</SelectItem>
              <SelectItem value="overallocated">Overallocated (&gt; 110%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isAdmin && (
          <Button size="sm" onClick={handleCreate}>
            <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add Member
          </Button>
        )}
      </div>

      {/* Delete blocked error */}
      {deleteError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {deleteError}
          <button
            className="ml-2 underline"
            onClick={() => setDeleteError(null)}
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Table */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {teamMembers.length === 0
              ? 'No team members yet.'
              : 'No team members match your filters.'}
          </p>
          {isAdmin && teamMembers.length === 0 && (
            <Button size="sm" onClick={handleCreate}>
              <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add your first team member
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead className="text-right">Hrs / Week</TableHead>
                <TableHead>Utilization</TableHead>
                {isAdmin && <TableHead className="w-24 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ member, ratio }) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">{member.role}</TableCell>
                  <TableCell className="text-right tabular-nums">{member.hoursPerWeek}</TableCell>
                  <TableCell>
                    <UtilizationBadge ratio={ratio} />
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(member)}
                          aria-label={`Edit ${member.name}`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(member)}
                          aria-label={`Delete ${member.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Drawer */}
      <TeamMemberDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        member={editingMember}
      />

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete Team Member"
        description={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.name}? This will also remove all their assignments.`
            : ''
        }
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
