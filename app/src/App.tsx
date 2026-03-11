import { useState } from 'react'
import { Sidebar, type ViewId } from '@/components/layout/Sidebar'
import { UserSwitcher } from '@/components/layout/UserSwitcher'
import { DashboardView } from '@/views/DashboardView'
import { ProjectsView } from '@/views/ProjectsView'
import { TeamView } from '@/views/TeamView'
import { CapacityView } from '@/views/CapacityView'
import { Separator } from '@/components/ui/separator'

const VIEW_TITLES: Record<ViewId, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  team: 'Team',
  capacity: 'Capacity',
}

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard')

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-6">
          <h1 className="text-sm font-semibold text-foreground">
            {VIEW_TITLES[activeView]}
          </h1>
          <UserSwitcher />
        </header>

        <Separator />

        <main
          id="main-content"
          className="flex-1 overflow-auto p-6"
          tabIndex={-1}
        >
          {activeView === 'dashboard' && (
            <DashboardView onNavigate={setActiveView} />
          )}
          {activeView === 'projects' && <ProjectsView />}
          {activeView === 'team' && <TeamView />}
          {activeView === 'capacity' && <CapacityView />}
        </main>
      </div>
    </div>
  )
}
