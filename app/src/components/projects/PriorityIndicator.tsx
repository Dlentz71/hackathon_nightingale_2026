import { ArrowUp, ArrowRight, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Priority } from '@/types'
import { PRIORITY_LABELS } from '@/lib/constants'

const PRIORITY_CONFIG: Record<Priority, { icon: React.ReactNode; className: string }> = {
  high: {
    icon: <ArrowUp className="h-3 w-3" aria-hidden="true" />,
    className: 'text-red-600',
  },
  medium: {
    icon: <ArrowRight className="h-3 w-3" aria-hidden="true" />,
    className: 'text-yellow-600',
  },
  low: {
    icon: <ArrowDown className="h-3 w-3" aria-hidden="true" />,
    className: 'text-slate-400',
  },
}

interface PriorityIndicatorProps {
  priority: Priority
  showLabel?: boolean
  className?: string
}

export function PriorityIndicator({ priority, showLabel = false, className }: PriorityIndicatorProps) {
  const { icon, className: colorClass } = PRIORITY_CONFIG[priority]
  const label = PRIORITY_LABELS[priority]

  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs font-medium', colorClass, className)}
      aria-label={`Priority: ${label}`}
    >
      {icon}
      {showLabel && <span>{label}</span>}
    </span>
  )
}
