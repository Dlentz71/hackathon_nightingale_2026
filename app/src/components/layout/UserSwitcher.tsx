import { ChevronDown, User } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useTeamStore } from '@/store/useTeamStore'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  'team-member': 'Team Member',
  viewer: 'Viewer',
}

const ROLE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  'team-member': 'secondary',
  viewer: 'outline',
}

export function UserSwitcher() {
  const { currentUser, setCurrentUser } = useAuthStore()
  const { users } = useTeamStore()

  if (!currentUser || users.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentUser.id}
        onValueChange={(id) => {
          const user = users.find((u) => u.id === id)
          if (user) setCurrentUser(user)
        }}
      >
        <SelectTrigger
          className="h-8 w-auto gap-2 border-0 bg-transparent px-2 text-sm shadow-none focus:ring-1 [&>svg]:hidden"
          aria-label="Switch active user"
        >
          <User className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium">{currentUser.name}</span>
          <Badge variant={ROLE_VARIANTS[currentUser.role]} className="text-xs">
            {ROLE_LABELS[currentUser.role] ?? currentUser.role}
          </Badge>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        </SelectTrigger>
        <SelectContent align="end">
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <span className="flex items-center gap-2">
                <span>{user.name}</span>
                <Badge variant={ROLE_VARIANTS[user.role]} className="text-xs">
                  {ROLE_LABELS[user.role] ?? user.role}
                </Badge>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
