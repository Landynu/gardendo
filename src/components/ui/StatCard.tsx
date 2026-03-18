import { type LucideIcon } from "lucide-react"
import { Link } from "react-router"

type Props = {
  icon: LucideIcon
  label: string
  value: string | number
  to?: string
  color?: string
}

export function StatCard({ icon: Icon, label, value, to, color = "primary" }: Props) {
  const content = (
    <div className="flex items-center gap-3">
      <div className={`rounded-lg bg-${color}-50 p-2`}>
        <Icon className={`h-5 w-5 text-${color}-600`} />
      </div>
      <div>
        <p className="text-sm text-neutral-500">{label}</p>
        <p className="text-lg font-semibold text-neutral-900">{value}</p>
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="card p-4 hover:shadow-md">
        {content}
      </Link>
    )
  }

  return <div className="card p-4">{content}</div>
}
