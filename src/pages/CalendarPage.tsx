import {
  useQuery,
  getProperties,
  getCalendarEvents,
  generateCalendar,
} from "wasp/client/operations"
import { Leaf, CalendarDays, RefreshCw, Sprout } from "lucide-react"
import { useState } from "react"

const eventTypeStyles: Record<string, { bg: string; text: string; dot: string }> = {
  SEED_START_INDOOR: {
    bg: "bg-primary-50",
    text: "text-primary-700",
    dot: "bg-primary-500",
  },
  SEED_START_OUTDOOR: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  TRANSPLANT: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  HARVEST_START: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  HARVEST_END: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    dot: "bg-orange-500",
  },
  PRUNING: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  FERTILIZE: {
    bg: "bg-earth-50",
    text: "text-earth-700",
    dot: "bg-earth-500",
  },
  COMPOST: {
    bg: "bg-earth-50",
    text: "text-earth-600",
    dot: "bg-earth-400",
  },
  ANIMAL_CARE: {
    bg: "bg-pink-50",
    text: "text-pink-700",
    dot: "bg-pink-500",
  },
  WATER_SYSTEM: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    dot: "bg-sky-500",
  },
  MAINTENANCE: {
    bg: "bg-neutral-50",
    text: "text-neutral-700",
    dot: "bg-neutral-400",
  },
  CUSTOM: {
    bg: "bg-neutral-50",
    text: "text-neutral-600",
    dot: "bg-neutral-400",
  },
}

function formatEventType(type: string): string {
  return type.replace(/_/g, " ").toLowerCase()
}

function groupByMonth(
  events: any[]
): { month: string; events: any[] }[] {
  const groups: Record<string, any[]> = {}

  for (const event of events) {
    // date is stored as "YYYY-MM-DD" string
    const dateStr = event.date
    const parts = dateStr.split("-")
    const monthKey = `${parts[0]}-${parts[1]}`
    if (!groups[monthKey]) {
      groups[monthKey] = []
    }
    groups[monthKey].push(event)
  }

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, events]) => {
      const [yearStr, monthStr] = key.split("-")
      const monthDate = new Date(Number(yearStr), Number(monthStr) - 1)
      const monthLabel = monthDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
      return { month: monthLabel, events }
    })
}

export function CalendarPage() {
  const { data: properties, isLoading: propsLoading } = useQuery(getProperties)
  const property = properties?.[0]

  const { data: events, isLoading: eventsLoading } = useQuery(
    getCalendarEvents,
    property ? { propertyId: property.id } : undefined,
    { enabled: !!property }
  )

  const [generating, setGenerating] = useState(false)

  const isLoading = propsLoading || eventsLoading

  async function handleGenerate() {
    if (!property) return
    setGenerating(true)
    try {
      await generateCalendar({ propertyId: property.id, year: new Date().getFullYear() })
    } catch (err) {
      console.error("Failed to generate calendar:", err)
    } finally {
      setGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-20">
          <Leaf className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays className="mb-4 h-16 w-16 text-neutral-300" />
          <p className="text-neutral-500">
            Create a property first to use the calendar.
          </p>
        </div>
      </div>
    )
  }

  const grouped = groupByMonth(events ?? [])

  return (
    <div className="page-container">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="page-title">Calendar</h1>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary"
        >
          <RefreshCw
            className={`h-4 w-4 ${generating ? "animate-spin" : ""}`}
          />
          {generating ? "Generating..." : "Generate Calendar"}
        </button>
      </div>

      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays className="mb-4 h-12 w-12 text-neutral-300" />
          <p className="text-neutral-500">No calendar events yet</p>
          <p className="mt-1 text-sm text-neutral-400">
            Add plants and generate the calendar to see your schedule
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.month}>
              <h2 className="mb-3 text-lg font-semibold text-neutral-800">
                {group.month}
              </h2>
              <div className="space-y-2">
                {group.events.map((event: any) => {
                  const style = eventTypeStyles[event.eventType] ??
                    eventTypeStyles.CUSTOM

                  return (
                    <div
                      key={event.id}
                      className={`flex items-start gap-3 rounded-lg p-3 ${style.bg}`}
                    >
                      <div className="mt-1.5 shrink-0">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${style.dot}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-neutral-900">
                            {event.title}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${style.text} bg-white/60`}
                          >
                            {formatEventType(event.eventType)}
                          </span>
                          {event.plant && (
                            <span className="flex items-center gap-1 text-xs text-neutral-500">
                              <Sprout className="h-3 w-3" />
                              {event.plant.name}
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="mt-1 text-sm text-neutral-500">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium text-neutral-700">
                          {event.date}
                        </p>
                        {event.endDate && (
                          <p className="text-xs text-neutral-400">
                            to {event.endDate}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
