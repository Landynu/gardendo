import { type LucideIcon } from "lucide-react"
import { Link } from "react-router"

type Props = {
  icon: LucideIcon
  message: string
  subtext?: string
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, message, subtext, actionLabel, actionTo, onAction }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="mb-4 h-12 w-12 text-neutral-300" />
      <h3 className="text-lg font-medium text-neutral-700">{message}</h3>
      {subtext && <p className="mt-1 text-sm text-neutral-500">{subtext}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary mt-4">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button onClick={onAction} className="btn-primary mt-4">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
