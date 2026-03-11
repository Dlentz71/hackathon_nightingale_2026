import { describe, it, expect } from 'vitest'
import {
  getUnmetDependencies,
  canMoveToInProgress,
  canDeleteProject,
  canTransitionStatus,
  getTaskStatusBreakdown,
  getProjectProgress,
  isProjectNameDuplicate,
} from './projectRules'
import type { Task, Project, Assignment, User } from '@/types'

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
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

const adminUser: User = { id: 'u1', name: 'Admin', email: 'a@a.com', role: 'admin' }
const memberUser: User = { id: 'u2', name: 'Member', email: 'b@b.com', role: 'team-member' }

// ─── getUnmetDependencies ────────────────────────────────────────────────────

describe('getUnmetDependencies', () => {
  it('returns empty array when task has no dependencies', () => {
    const task = makeTask()
    expect(getUnmetDependencies(task, [task])).toEqual([])
  })

  it('returns empty array when all dependencies are done', () => {
    const dep = makeTask({ id: 'dep-1', status: 'done' })
    const task = makeTask({ dependencies: ['dep-1'] })
    expect(getUnmetDependencies(task, [dep, task])).toEqual([])
  })

  it('returns unmet dependency when not done', () => {
    const dep = makeTask({ id: 'dep-1', status: 'in-progress' })
    const task = makeTask({ dependencies: ['dep-1'] })
    const result = getUnmetDependencies(task, [dep, task])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('dep-1')
  })
})

// ─── canMoveToInProgress ────────────────────────────────────────────────────

describe('canMoveToInProgress', () => {
  it('allows when no dependencies', () => {
    const task = makeTask()
    expect(canMoveToInProgress(task, [task]).allowed).toBe(true)
  })

  it('blocks when dependency is not done', () => {
    const dep = makeTask({ id: 'dep-1', status: 'todo' })
    const task = makeTask({ dependencies: ['dep-1'] })
    const result = canMoveToInProgress(task, [dep, task])
    expect(result.allowed).toBe(false)
    expect(result.blockedBy).toHaveLength(1)
  })

  it('allows when all dependencies are done', () => {
    const dep = makeTask({ id: 'dep-1', status: 'done' })
    const task = makeTask({ dependencies: ['dep-1'] })
    expect(canMoveToInProgress(task, [dep, task]).allowed).toBe(true)
  })
})

// ─── canDeleteProject ────────────────────────────────────────────────────────

describe('canDeleteProject', () => {
  it('allows deletion when no tasks', () => {
    expect(canDeleteProject([], []).allowed).toBe(true)
  })

  it('allows deletion when tasks have no assignments', () => {
    const task = makeTask({ assignmentIds: [] })
    expect(canDeleteProject([task], []).allowed).toBe(true)
  })

  it('allows deletion when all assigned tasks are done', () => {
    const task = makeTask({ id: 't1', status: 'done', assignmentIds: ['a1'] })
    const assignment: Assignment = { id: 'a1', taskId: 't1', memberId: 'm1', hoursAllocated: 8 }
    expect(canDeleteProject([task], [assignment]).allowed).toBe(true)
  })

  it('blocks deletion when assigned tasks are not done', () => {
    const task = makeTask({ id: 't1', name: 'Blocked Task', status: 'in-progress', assignmentIds: ['a1'] })
    const assignment: Assignment = { id: 'a1', taskId: 't1', memberId: 'm1', hoursAllocated: 8 }
    const result = canDeleteProject([task], [assignment])
    expect(result.allowed).toBe(false)
    expect(result.blockedBy).toContain('Blocked Task')
  })
})

// ─── canTransitionStatus ────────────────────────────────────────────────────

describe('canTransitionStatus', () => {
  it('allows any transition for admin (except constrained ones)', () => {
    const project = makeProject()
    const result = canTransitionStatus(project, 'pending', [], adminUser)
    expect(result.allowed).toBe(true)
  })

  it('blocks Completed transition for non-admin', () => {
    const project = makeProject()
    const result = canTransitionStatus(project, 'completed', [], memberUser)
    expect(result.allowed).toBe(false)
  })

  it('blocks Completed if assigned tasks are not done', () => {
    const task = makeTask({ status: 'in-progress', assignmentIds: ['a1'] })
    const project = makeProject()
    const result = canTransitionStatus(project, 'completed', [task], adminUser)
    expect(result.allowed).toBe(false)
  })

  it('allows Completed when all assigned tasks are done', () => {
    const task = makeTask({ status: 'done', assignmentIds: ['a1'] })
    const project = makeProject()
    const result = canTransitionStatus(project, 'completed', [task], adminUser)
    expect(result.allowed).toBe(true)
  })

  it('blocks Paused when tasks are in-progress', () => {
    const task = makeTask({ status: 'in-progress' })
    const project = makeProject()
    const result = canTransitionStatus(project, 'paused', [task], adminUser)
    expect(result.allowed).toBe(false)
  })

  it('allows Paused when no tasks are in-progress', () => {
    const task = makeTask({ status: 'todo' })
    const project = makeProject()
    const result = canTransitionStatus(project, 'paused', [task], adminUser)
    expect(result.allowed).toBe(true)
  })
})

// ─── getTaskStatusBreakdown ──────────────────────────────────────────────────

describe('getTaskStatusBreakdown', () => {
  it('returns all zeros for empty array', () => {
    const result = getTaskStatusBreakdown([])
    expect(result).toEqual({ done: 0, inProgress: 0, todo: 0, blocked: 0, total: 0 })
  })

  it('counts correctly across statuses', () => {
    const tasks = [
      makeTask({ status: 'done' }),
      makeTask({ status: 'done' }),
      makeTask({ status: 'in-progress' }),
      makeTask({ status: 'blocked' }),
      makeTask({ status: 'todo' }),
    ]
    const result = getTaskStatusBreakdown(tasks)
    expect(result).toEqual({ done: 2, inProgress: 1, todo: 1, blocked: 1, total: 5 })
  })
})

// ─── getProjectProgress ──────────────────────────────────────────────────────

describe('getProjectProgress', () => {
  it('returns 0 for empty task list', () => {
    expect(getProjectProgress([])).toBe(0)
  })

  it('returns 100 when all tasks are done', () => {
    const tasks = [makeTask({ status: 'done' }), makeTask({ status: 'done' })]
    expect(getProjectProgress(tasks)).toBe(100)
  })

  it('returns correct percentage', () => {
    const tasks = [
      makeTask({ status: 'done' }),
      makeTask({ status: 'todo' }),
      makeTask({ status: 'todo' }),
      makeTask({ status: 'todo' }),
    ]
    expect(getProjectProgress(tasks)).toBe(25)
  })
})

// ─── isProjectNameDuplicate ──────────────────────────────────────────────────

describe('isProjectNameDuplicate', () => {
  const projects = [makeProject({ id: 'p1', name: 'Central Perk App' })]

  it('returns false when name is unique', () => {
    expect(isProjectNameDuplicate('New Project', projects)).toBe(false)
  })

  it('detects duplicate case-insensitively', () => {
    expect(isProjectNameDuplicate('central perk app', projects)).toBe(true)
    expect(isProjectNameDuplicate('CENTRAL PERK APP', projects)).toBe(true)
  })

  it('excludes the project being edited', () => {
    expect(isProjectNameDuplicate('Central Perk App', projects, 'p1')).toBe(false)
  })
})
