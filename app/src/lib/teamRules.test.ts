import { describe, it, expect } from 'vitest'
import { getMemberUtilization, canDeleteMember, isMemberNameDuplicate } from './teamRules'
import type { TeamMember, Assignment, Task } from '@/types'

const makeMember = (overrides: Partial<TeamMember> = {}): TeamMember => ({
  id: 'tm1',
  name: 'Test Member',
  role: 'Engineer',
  hoursPerWeek: 40,
  ...overrides,
})

const makeAssignment = (overrides: Partial<Assignment> = {}): Assignment => ({
  id: 'a1',
  taskId: 't1',
  memberId: 'tm1',
  hoursAllocated: 8,
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
  notes: [],
  createdBy: 'u1',
  updatedBy: 'u1',
  createdAt: '',
  updatedAt: '',
  ...overrides,
})

// ─── getMemberUtilization ─────────────────────────────────────────────────────

describe('getMemberUtilization', () => {
  it('returns 0 when member has no assignments', () => {
    expect(getMemberUtilization(makeMember(), [])).toBe(0)
  })

  it('returns 0 when hoursPerWeek is 0', () => {
    const member = makeMember({ hoursPerWeek: 0 })
    const assignment = makeAssignment()
    expect(getMemberUtilization(member, [assignment])).toBe(0)
  })

  it('calculates correct ratio', () => {
    // 40 hrs/week × 13 weeks = 520 capacity; 52 hours assigned = 0.1
    const member = makeMember({ hoursPerWeek: 40 })
    const assignment = makeAssignment({ hoursAllocated: 52 })
    expect(getMemberUtilization(member, [assignment])).toBeCloseTo(0.1)
  })

  it('only counts assignments for the given member', () => {
    const member = makeMember({ id: 'tm1' })
    const mine = makeAssignment({ memberId: 'tm1', hoursAllocated: 52 })
    const other = makeAssignment({ id: 'a2', memberId: 'tm2', hoursAllocated: 520 })
    expect(getMemberUtilization(member, [mine, other])).toBeCloseTo(0.1)
  })
})

// ─── canDeleteMember ──────────────────────────────────────────────────────────

describe('canDeleteMember', () => {
  it('allows deletion when member has no assignments', () => {
    expect(canDeleteMember(makeMember(), [], []).allowed).toBe(true)
  })

  it('allows deletion when all assigned tasks are done', () => {
    const member = makeMember()
    const task = makeTask({ status: 'done' })
    const assignment = makeAssignment()
    expect(canDeleteMember(member, [assignment], [task]).allowed).toBe(true)
  })

  it('blocks deletion when member has non-done assigned tasks', () => {
    const member = makeMember()
    const task = makeTask({ status: 'in-progress', name: 'Active Task' })
    const assignment = makeAssignment()
    const result = canDeleteMember(member, [assignment], [task])
    expect(result.allowed).toBe(false)
    expect(result.blockedBy).toContain('Active Task')
  })

  it('only checks assignments for the given member', () => {
    const member = makeMember({ id: 'tm1' })
    const task = makeTask({ status: 'in-progress' })
    const otherAssignment = makeAssignment({ memberId: 'tm2' }) // different member
    expect(canDeleteMember(member, [otherAssignment], [task]).allowed).toBe(true)
  })
})

// ─── isMemberNameDuplicate ────────────────────────────────────────────────────

describe('isMemberNameDuplicate', () => {
  const members = [makeMember({ id: 'tm1', name: 'Ross Geller' })]

  it('returns false when name is unique', () => {
    expect(isMemberNameDuplicate('Rachel Green', members)).toBe(false)
  })

  it('detects duplicate case-insensitively', () => {
    expect(isMemberNameDuplicate('ross geller', members)).toBe(true)
    expect(isMemberNameDuplicate('ROSS GELLER', members)).toBe(true)
  })

  it('excludes the member being edited', () => {
    expect(isMemberNameDuplicate('Ross Geller', members, 'tm1')).toBe(false)
  })
})
