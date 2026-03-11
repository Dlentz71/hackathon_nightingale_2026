export type TshirtSize = 'S' | 'M' | 'L' | 'XL' | 'XXL'
export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done'
export type ProjectStatus = 'planning' | 'pending' | 'inflight' | 'paused' | 'completed'
export type Priority = 'high' | 'medium' | 'low'
export type UserRole = 'admin' | 'team-member' | 'viewer'

export interface Project {
  id: string
  name: string
  description: string
  startDate: string
  targetEndDate?: string
  status: ProjectStatus
  priority: Priority
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  projectId: string
  name: string
  description: string
  estimate: { size: TshirtSize; hours: number }
  status: TaskStatus
  priority: Priority
  assignmentIds: string[]
  dependencies: string[]
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  hoursPerWeek: number
  startDate?: string
  endDate?: string
}

export interface Assignment {
  id: string
  taskId: string
  memberId: string
  hoursAllocated: number
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  teamMemberId?: string
}

export type RbacAction =
  | 'project:create'
  | 'project:edit'
  | 'project:delete'
  | 'project:changeStatus'
  | 'project:complete'
  | 'task:create'
  | 'task:edit'
  | 'task:delete'
  | 'task:bulkDelete'
  | 'team:manage'
  | 'user:manage'

export interface TaskStatusBreakdown {
  done: number
  inProgress: number
  todo: number
  blocked: number
  total: number
}
