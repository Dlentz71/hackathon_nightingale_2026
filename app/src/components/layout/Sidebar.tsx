import { LayoutDashboard, FolderKanban, Users, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

export type ViewId = 'dashboard' | 'projects' | 'team' | 'capacity'

interface NavItem {
  id: ViewId
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> },
  { id: 'projects', label: 'Projects', icon: <FolderKanban className="h-4 w-4" aria-hidden="true" /> },
  { id: 'team', label: 'Team', icon: <Users className="h-4 w-4" aria-hidden="true" /> },
  { id: 'capacity', label: 'Capacity', icon: <BarChart3 className="h-4 w-4" aria-hidden="true" /> },
]

interface SidebarProps {
  activeView: ViewId
  onNavigate: (view: ViewId) => void
}

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  return (
    <nav
      className="flex h-full w-56 flex-col border-r bg-white"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          IT Capacity Planner
        </span>
      </div>

      <Separator />

      {/* Nav items */}
      <ul className="flex flex-col gap-1 p-2" role="list">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeView
          return (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  isActive
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                )}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
