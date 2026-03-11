import { useState } from 'react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer, LabelList,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTeamStore } from '@/store/useTeamStore'
import { useAssignmentStore } from '@/store/useAssignmentStore'
import { useProjectStore } from '@/store/useProjectStore'
import {
  getTeamCapacitySummary,
  getMemberAllocationRows,
} from '@/lib/capacity'
import { UTILIZATION_HEALTHY, UTILIZATION_AT_RISK } from '@/lib/constants'

const ALL_VALUE = '__all__'

// Fixed colour palette for up to 6 projects
const PROJECT_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#14b8a6',
]

function utilizationFill(ratio: number): string {
  if (ratio > UTILIZATION_AT_RISK) return '#ef4444'   // red
  if (ratio >= UTILIZATION_HEALTHY) return '#f59e0b'  // amber
  return '#22c55e'                                     // green
}

// ─── Summary stat card ────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  sub,
  danger,
}: {
  title: string
  value: string | number
  sub?: string
  danger?: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={`text-3xl font-bold tabular-nums ${danger ? 'text-destructive' : 'text-foreground'}`}
          aria-label={`${title}: ${value}`}
        >
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function UtilTooltip({ active, payload }: { active?: boolean; payload?: { payload: { memberName: string; allocatedHours: number; capacityHours: number; utilization: number } }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">{d.memberName}</p>
      <p>{Math.round(d.utilization * 100)}% utilization</p>
      <p>{d.allocatedHours}h allocated / {d.capacityHours}h capacity</p>
    </div>
  )
}

function AllocTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}h
        </p>
      ))}
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function CapacityView() {
  const { teamMembers } = useTeamStore()
  const { assignments } = useAssignmentStore()
  const { projects, tasks } = useProjectStore()

  const [projectFilter, setProjectFilter] = useState(ALL_VALUE)

  // Filter assignments to selected project
  const filteredAssignments = projectFilter === ALL_VALUE
    ? assignments
    : (() => {
        const taskIds = new Set(
          tasks.filter((t) => t.projectId === projectFilter).map((t) => t.id)
        )
        return assignments.filter((a) => taskIds.has(a.taskId))
      })()

  const summary = getTeamCapacitySummary(teamMembers, filteredAssignments)
  const allocationRows = getMemberAllocationRows(teamMembers, filteredAssignments, tasks, projects)

  // Chart data — utilization
  const utilChartData = allocationRows.map((r) => ({
    ...r,
    utilizationPct: Math.round(r.utilization * 100),
  }))

  // Chart data — stacked allocation by project
  // Build list of projects that have at least one assignment in current filter
  const activeProjectIds = [...new Set(
    filteredAssignments
      .map((a) => tasks.find((t) => t.id === a.taskId)?.projectId)
      .filter(Boolean) as string[]
  )]
  const activeProjects = projects.filter((p) => activeProjectIds.includes(p.id))

  const allocChartData = allocationRows.map((r) => {
    const row: Record<string, string | number> = { memberName: r.memberName }
    for (const p of activeProjects) {
      row[p.name] = r.byProject[p.id] ?? 0
    }
    return row
  })

  const hasData = assignments.length > 0 && teamMembers.length > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filter by project:</span>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="h-9 w-56" aria-label="Filter by project">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Team Members"
          value={summary.memberCount}
        />
        <StatCard
          title="Total Capacity"
          value={`${summary.totalCapacityHours.toLocaleString()} hrs`}
          sub={`across ${summary.memberCount} members × 13 weeks`}
        />
        <StatCard
          title="Total Allocated"
          value={`${summary.totalAllocatedHours.toLocaleString()} hrs`}
          sub={
            summary.totalCapacityHours > 0
              ? `${Math.round((summary.totalAllocatedHours / summary.totalCapacityHours) * 100)}% of capacity`
              : undefined
          }
        />
        <StatCard
          title="Overallocated"
          value={summary.overAllocatedCount}
          sub="members above 110%"
          danger={summary.overAllocatedCount > 0}
        />
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">No assignment data yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Open a task and add team assignments to see capacity data here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Utilization chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="h-[320px]"
                role="img"
                aria-label="Horizontal bar chart showing utilization percentage per team member"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={utilChartData}
                    margin={{ top: 4, right: 60, left: 16, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, Math.max(150, Math.ceil(Math.max(...utilChartData.map((d) => d.utilizationPct)) / 10) * 10 + 10)]}
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="memberName"
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<UtilTooltip />} />
                    <ReferenceLine x={100} stroke="#6b7280" strokeDasharray="4 4" label={{ value: '100%', position: 'top', fontSize: 11, fill: '#6b7280' }} />
                    <Bar dataKey="utilizationPct" radius={[0, 4, 4, 0]} maxBarSize={28}>
                      {utilChartData.map((entry) => (
                        <Cell key={entry.memberId} fill={utilizationFill(entry.utilization)} />
                      ))}
                      <LabelList
                        dataKey="utilizationPct"
                        position="right"
                        formatter={(v) => `${v}%`}
                        style={{ fontSize: 11, fill: '#374151' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Allocation by project chart */}
          {activeProjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Allocation by Project</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="h-[320px]"
                  role="img"
                  aria-label="Stacked bar chart showing hours allocated per project per team member"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={allocChartData}
                      margin={{ top: 4, right: 16, left: 16, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} unit="h" />
                      <YAxis type="category" dataKey="memberName" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip content={<AllocTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {activeProjects.map((project, i) => (
                        <Bar
                          key={project.id}
                          dataKey={project.name}
                          stackId="alloc"
                          fill={PROJECT_COLORS[i % PROJECT_COLORS.length]}
                          radius={i === activeProjects.length - 1 ? [0, 4, 4, 0] : undefined}
                          maxBarSize={28}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
