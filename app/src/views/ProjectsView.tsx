import { useState } from 'react'
import { ProjectGrid } from '@/components/projects/ProjectGrid'
import { ProjectDrawer } from '@/components/projects/ProjectDrawer'
import { TaskDrawer } from '@/components/projects/TaskDrawer'
import { useProjectStore } from '@/store/useProjectStore'
import type { Project, Task } from '@/types'

export function ProjectsView() {
  const projects = useProjectStore((s) => s.projects)

  const [projectDrawerOpen, setProjectDrawerOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false)
  const [taskDrawerProjectId, setTaskDrawerProjectId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  function handleCreateProject() {
    setEditingProject(null)
    setProjectDrawerOpen(true)
  }

  function handleEditProject(project: Project) {
    setEditingProject(project)
    setProjectDrawerOpen(true)
  }

  function handleAddTask(projectId: string) {
    setEditingTask(null)
    setTaskDrawerProjectId(projectId)
    setTaskDrawerOpen(true)
  }

  function handleEditTask(task: Task) {
    setEditingTask(task)
    setTaskDrawerProjectId(task.projectId)
    setTaskDrawerOpen(true)
  }

  return (
    <>
      <ProjectGrid
        projects={projects}
        onCreateProject={handleCreateProject}
        onEditProject={handleEditProject}
        onAddTask={handleAddTask}
        onEditTask={handleEditTask}
      />

      <ProjectDrawer
        open={projectDrawerOpen}
        onOpenChange={setProjectDrawerOpen}
        project={editingProject}
      />

      {taskDrawerProjectId && (
        <TaskDrawer
          open={taskDrawerOpen}
          onOpenChange={setTaskDrawerOpen}
          projectId={taskDrawerProjectId}
          task={editingTask}
        />
      )}
    </>
  )
}
