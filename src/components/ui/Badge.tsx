const colorMap = {
  green: "bg-primary-100 text-primary-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
  earth: "bg-earth-100 text-earth-700",
  neutral: "bg-neutral-100 text-neutral-600",
} as const

type BadgeColor = keyof typeof colorMap

type Props = {
  label: string
  color: BadgeColor
}

export function Badge({ label, color }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[color]}`}>
      {label}
    </span>
  )
}
