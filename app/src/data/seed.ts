import seedData from './seed-data.json'
import { useProjectStore } from '@/store/useProjectStore'
import { useTeamStore } from '@/store/useTeamStore'
import { useAssignmentStore } from '@/store/useAssignmentStore'
import { useAuthStore } from '@/store/useAuthStore'
import type { Project, Task, TeamMember, Assignment, User } from '@/types'

/**
 * Hydrates all stores from seed data on first boot.
 * Guard: only runs if the projects store is empty (localStorage has no data yet).
 */
export function hydrateSeedData() {
  const { projects, setProjects, setTasks } = useProjectStore.getState()

  // Already has data — don't overwrite
  if (projects.length > 0) return

  setProjects(seedData.projects as Project[])
  setTasks(seedData.tasks as Task[])

  useTeamStore.getState().setTeamMembers(seedData.teamMembers as TeamMember[])
  useTeamStore.getState().setUsers(seedData.users as User[])

  useAssignmentStore.getState().setAssignments(seedData.assignments as Assignment[])

  // Set the first admin user as the active user
  const firstAdmin = (seedData.users as User[]).find((u) => u.role === 'admin')
  if (firstAdmin) {
    useAuthStore.getState().setCurrentUser(firstAdmin)
  }
}
