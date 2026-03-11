import { ArrowRight } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useProjectStore } from '@/store/useProjectStore'
import { useTeamStore } from '@/store/useTeamStore'
import { useAssignmentStore } from '@/store/useAssignmentStore'
import { getMemberUtilization } from '@/lib/capacity'
import { getUnmetDependencies } from '@/lib/projectRules'
import { UTILIZATION_HEALTHY, UTILIZATION_AT_RISK, PROJECT_STATUS_LABELS } from '@/lib/constants'
import type { ProjectStatus } from '@/types'

interface DashboardViewProps {
  onNavigate: (view: 'projects' | 'team' | 'capacity') => void
}

// ─── Status color map ─────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  inflight: '#6366f1',
  pending: '#f59e0b',
  planning: '#8b5cf6',
  paused: '#6b7280',
  completed: '#22c55e',
}

// ─── Summary stat card ────────────────────────────────────────────────────────

function StatCard({ title, value, color = 'gray', danger }: { title: string; value: number; color?: string; danger?: boolean }) {
  return (
    <Card className={`border-l-4 ${color}`}>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold tabular-nums ${danger ? 'text-destructive' : 'text-foreground'}`}
           aria-label={`${title}: ${value}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Utilization badge ────────────────────────────────────────────────────────

function UtilBadge({ ratio }: { ratio: number }) {
  const pct = Math.round(ratio * 100)
  if (ratio > UTILIZATION_AT_RISK) {
    return (
      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
        {pct}% · Overallocated
      </span>
    )
  }
  if (ratio >= UTILIZATION_HEALTHY) {
    return (
      <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
        {pct}% · At Risk
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
      {pct}% · Healthy
    </span>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { projects, tasks } = useProjectStore()
  const { teamMembers } = useTeamStore()
  const { assignments } = useAssignmentStore()

  // Summary stats
  const openTasks = tasks.filter((t) => t.status === 'todo' || t.status === 'in-progress').length
  const blockedStatusTasks = tasks.filter((t) => t.status === 'blocked').length

  // Project status breakdown
  const statusOrder: ProjectStatus[] = ['inflight', 'pending', 'planning', 'paused', 'completed']
  const statusCounts = statusOrder
    .map((s) => ({ status: s, count: projects.filter((p) => p.status === s).length }))
    .filter((s) => s.count > 0)

  // Team capacity: sort overallocated first, then at-risk, then healthy
  const memberRows = teamMembers
    .map((m) => ({ member: m, ratio: getMemberUtilization(m, assignments) }))
    .sort((a, b) => b.ratio - a.ratio)

  const overAllocatedCount = memberRows.filter((r) => r.ratio > UTILIZATION_AT_RISK).length

  // Blocked tasks (dependency-based, not status field)
  const blockedByDeps = tasks
    .map((t) => {
      const unmet = getUnmetDependencies(t, tasks)
      if (unmet.length === 0) return null
      const project = projects.find((p) => p.id === t.projectId)
      return { task: t, project, unmetCount: unmet.length }
    })
    .filter(Boolean) as { task: typeof tasks[0]; project: typeof projects[0] | undefined; unmetCount: number }[]

  return (
    <div className="flex flex-col gap-6">
      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Projects" value={projects.length} color="border-l-indigo-500" />
        <StatCard title="Tasks" value={tasks.length} color="border-l-violet-500" />
        <StatCard title="Open Tasks" value={openTasks} color="border-l-amber-500" />
        <StatCard title="Blocked Tasks" value={blockedStatusTasks} color={blockedStatusTasks > 0 ? "border-l-red-500" : "border-l-gray-300"} danger={blockedStatusTasks > 0} />
      </div>

      {/* Two-column content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Left column */}
        <div className="flex flex-col gap-6">

          {/* Project status breakdown */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Projects by Status</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={() => onNavigate('projects')}
              >
                View all <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Button>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects yet.</p>
              ) : (
                <div className="h-[200px]" role="img" aria-label="Donut chart showing project distribution by status">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusCounts}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {statusCounts.map(({ status }) => (
                          <Cell key={status} fill={STATUS_COLORS[status] ?? '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [value, PROJECT_STATUS_LABELS[name as ProjectStatus] ?? name]}
                      />
                      <Legend
                        formatter={(value) => PROJECT_STATUS_LABELS[value as ProjectStatus] ?? value}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blocked tasks (dependency-based) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Dependency Blocks</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={() => onNavigate('projects')}
              >
                View all <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Button>
            </CardHeader>
            <CardContent>
              {blockedByDeps.length === 0 ? (
                <p className="text-sm text-green-700">
                  No blocked tasks — everything is unblocked.
                </p>
              ) : (
                <ul className="space-y-2" aria-label="Tasks blocked by dependencies">
                  {blockedByDeps.map(({ task, project, unmetCount }) => (
                    <li key={task.id} className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{task.name}</p>
                        {project && (
                          <p className="truncate text-xs text-muted-foreground">{project.name}</p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="shrink-0 border-orange-200 bg-orange-50 text-orange-700 text-xs"
                      >
                        blocked by {unmetCount}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column — team capacity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Team Capacity</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground"
              onClick={() => onNavigate('capacity')}
            >
              Full report <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Button>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No team members yet.</p>
            ) : (
              <>
                {overAllocatedCount === 0 && (
                  <p className="mb-3 text-sm text-green-700">
                    All clear — no members are overallocated.
                  </p>
                )}
                <ul className="space-y-2.5" aria-label="Team member utilization">
                  {memberRows.map(({ member, ratio }) => (
                    <li key={member.id} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{member.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{member.role}</p>
                        </div>
                        <UtilBadge ratio={ratio} />
                      </div>
                      <Progress
                        value={Math.min(Math.round(ratio * 100), 100)}
                        className={`h-1.5 ${ratio > UTILIZATION_AT_RISK ? '[&>div]:bg-red-500' : ratio >= UTILIZATION_HEALTHY ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500'}`}
                        aria-hidden="true"
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
