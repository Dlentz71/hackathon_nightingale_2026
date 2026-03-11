import { describe, it, expect } from 'vitest'
import {
  getMemberCapacity,
  getMemberUtilization,
  getProjectedUtilization,
  getTeamCapacitySummary,
  getMemberAllocationRows,
} from './capacity'
import type { TeamMember, Assignment, Task, Project } from '@/types'

const makeMember = (overrides: Partial<TeamMember> = {}): TeamMember => ({
  id: 'tm1',
  name: 'Ross Geller',
  role: 'Senior Backend Engineer',
  hoursPerWeek: 40,
  ...overrides,
})

const makeAssignment = (overrides: Partial<Assignment> = {}): Assignment => ({
  id: 'a1',
  taskId: 't1',
  memberId: 'tm1',
  hoursAllocated: 52,
  ...overrides,
})

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 't1',
  projectId: 'p1',
  name: 'Test Task',
  description: 'desc',
  estimate: { size: 'M', hours: 8 },
  status: 'todo',
  priority: 'medium',
  assignmentIds: [],
  dependencies: [],
  createdBy: 'u1',
  updatedBy: 'u1',
  createdAt: '',
  updatedAt: '',
  ...overrides,
})

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'p1',
  name: 'Test Project',
  description: 'desc',
  startDate: '2026-01-01',
  status: 'inflight',
  priority: 'medium',
  createdBy: 'u1',
  updatedBy: 'u1',
  createdAt: '',
  updatedAt: '',
  ...overrides,
})

// ─── getMemberCapacity ────────────────────────────────────────────────────────

describe('getMemberCapacity', () => {
  it('calculates quarterly capacity (hoursPerWeek × 13)', () => {
    expect(getMemberCapacity(makeMember({ hoursPerWeek: 40 }))).toBe(520)
  })

  it('handles part-time members', () => {
    expect(getMemberCapacity(makeMember({ hoursPerWeek: 20 }))).toBe(260)
  })
})

// ─── getMemberUtilization ─────────────────────────────────────────────────────

describe('getMemberUtilization', () => {
  it('returns 0 when member has no assignments', () => {
    expect(getMemberUtilization(makeMember(), [])).toBe(0)
  })

  it('returns 0 when hoursPerWeek is 0', () => {
    expect(getMemberUtilization(makeMember({ hoursPerWeek: 0 }), [makeAssignment()])).toBe(0)
  })

  it('returns correct ratio for full utilization', () => {
    const assignment = makeAssignment({ hoursAllocated: 520 })
    expect(getMemberUtilization(makeMember(), [assignment])).toBe(1.0)
  })

  it('returns ratio < 1 for under-utilization', () => {
    const assignment = makeAssignment({ hoursAllocated: 52 })
    expect(getMemberUtilization(makeMember(), [assignment])).toBeCloseTo(0.1)
  })

  it('can return ratio > 1 for over-allocation', () => {
    const assignment = makeAssignment({ hoursAllocated: 572 })
    expect(getMemberUtilization(makeMember(), [assignment])).toBeCloseTo(1.1)
  })

  it('only counts assignments belonging to the given member', () => {
    const mine = makeAssignment({ memberId: 'tm1', hoursAllocated: 52 })
    const other = makeAssignment({ id: 'a2', memberId: 'tm2', hoursAllocated: 520 })
    expect(getMemberUtilization(makeMember({ id: 'tm1' }), [mine, other])).toBeCloseTo(0.1)
  })

  it('sums hours across multiple assignments', () => {
    const a1 = makeAssignment({ id: 'a1', hoursAllocated: 100 })
    const a2 = makeAssignment({ id: 'a2', taskId: 't2', hoursAllocated: 100 })
    expect(getMemberUtilization(makeMember(), [a1, a2])).toBeCloseTo(200 / 520)
  })
})

// ─── getProjectedUtilization ──────────────────────────────────────────────────

describe('getProjectedUtilization', () => {
  it('returns 0 when capacity is 0', () => {
    expect(getProjectedUtilization(makeMember({ hoursPerWeek: 0 }), [], 100)).toBe(0)
  })

  it('includes existing assignments plus additional hours', () => {
    const existing = makeAssignment({ hoursAllocated: 260 })
    expect(getProjectedUtilization(makeMember(), [existing], 260)).toBe(1.0)
  })

  it('correctly flags over-allocation projection', () => {
    const existing = makeAssignment({ hoursAllocated: 520 })
    expect(getProjectedUtilization(makeMember(), [existing], 52)).toBeCloseTo(1.1)
  })

  it('returns projected ratio with no existing assignments', () => {
    expect(getProjectedUtilization(makeMember(), [], 52)).toBeCloseTo(0.1)
  })
})

// ─── getTeamCapacitySummary ───────────────────────────────────────────────────

describe('getTeamCapacitySummary', () => {
  it('returns zeros for empty inputs', () => {
    const result = getTeamCapacitySummary([], [])
    expect(result).toEqual({
      memberCount: 0,
      totalCapacityHours: 0,
      totalAllocatedHours: 0,
      overAllocatedCount: 0,
    })
  })

  it('sums capacity across all members', () => {
    const members = [
      makeMember({ id: 'tm1', hoursPerWeek: 40 }),
      makeMember({ id: 'tm2', hoursPerWeek: 20 }),
    ]
    const result = getTeamCapacitySummary(members, [])
    expect(result.totalCapacityHours).toBe(780) // 520 + 260
    expect(result.memberCount).toBe(2)
  })

  it('sums all allocated hours', () => {
    const a1 = makeAssignment({ id: 'a1', hoursAllocated: 100 })
    const a2 = makeAssignment({ id: 'a2', memberId: 'tm2', hoursAllocated: 50 })
    const result = getTeamCapacitySummary([makeMember()], [a1, a2])
    expect(result.totalAllocatedHours).toBe(150)
  })

  it('counts overallocated members (> 110%)', () => {
    const member = makeMember({ hoursPerWeek: 40 }) // capacity 520
    const assignment = makeAssignment({ hoursAllocated: 580 }) // 580/520 ≈ 1.115 > 1.1
    const result = getTeamCapacitySummary([member], [assignment])
    expect(result.overAllocatedCount).toBe(1)
  })

  it('does not count members at exactly 110%', () => {
    const member = makeMember({ hoursPerWeek: 40 }) // capacity 520
    const assignment = makeAssignment({ hoursAllocated: 572 }) // 572/520 = 1.1 exactly
    const result = getTeamCapacitySummary([member], [assignment])
    expect(result.overAllocatedCount).toBe(0)
  })
})

// ─── getMemberAllocationRows ──────────────────────────────────────────────────

describe('getMemberAllocationRows', () => {
  it('returns empty array for no members', () => {
    expect(getMemberAllocationRows([], [], [], [])).toEqual([])
  })

  it('returns one row per member', () => {
    const members = [makeMember({ id: 'tm1' }), makeMember({ id: 'tm2', name: 'Rachel' })]
    const rows = getMemberAllocationRows(members, [], [], [])
    expect(rows).toHaveLength(2)
  })

  it('groups hours by project correctly', () => {
    const member = makeMember()
    const task1 = makeTask({ id: 't1', projectId: 'p1' })
    const task2 = makeTask({ id: 't2', projectId: 'p2' })
    const project1 = makeProject({ id: 'p1', name: 'Project A' })
    const project2 = makeProject({ id: 'p2', name: 'Project B' })
    const a1 = makeAssignment({ id: 'a1', taskId: 't1', hoursAllocated: 40 })
    const a2 = makeAssignment({ id: 'a2', taskId: 't2', hoursAllocated: 60 })

    const rows = getMemberAllocationRows([member], [a1, a2], [task1, task2], [project1, project2])
    expect(rows[0].byProject['p1']).toBe(40)
    expect(rows[0].byProject['p2']).toBe(60)
    expect(rows[0].allocatedHours).toBe(100)
  })

  it('sorts rows by utilization descending', () => {
    const m1 = makeMember({ id: 'tm1', hoursPerWeek: 40 }) // lower util
    const m2 = makeMember({ id: 'tm2', hoursPerWeek: 40 }) // higher util
    const a1 = makeAssignment({ memberId: 'tm1', hoursAllocated: 100 })
    const a2 = makeAssignment({ id: 'a2', memberId: 'tm2', hoursAllocated: 500 })
    const rows = getMemberAllocationRows([m1, m2], [a1, a2], [], [])
    expect(rows[0].memberId).toBe('tm2') // highest first
  })
})
