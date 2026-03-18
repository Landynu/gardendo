import {
  useQuery,
  getProperties,
  getTasks,
  getCalendarEvents,
  getSeedStartingSchedule,
  getHarvestSummary,
  getAnimalGroups,
} from "wasp/client/operations"
import { Link } from "react-router"
import {
  Sprout,
  Grid3X3,
  CalendarDays,
  CheckSquare,
  ArrowRight,
  Leaf,
  Clock,
  Flower2,
  Apple,
  Egg,
  Snowflake,
} from "lucide-react"
import { WeatherWidget } from "../components/WeatherWidget"
import { differenceInDays, parse } from "date-fns"

export function DashboardPage() {
  const { data: properties, isLoading: propsLoading } = useQuery(getProperties)
  const property = properties?.[0]

  const { data: tasks } = useQuery(
    getTasks,
    property ? { propertyId: property.id, status: "PENDING" } : undefined,
    { enabled: !!property }
  )

  const { data: events } = useQuery(
    getCalendarEvents,
    property ? { propertyId: property.id } : undefined,
    { enabled: !!property }
  )

  const currentYear = new Date().getFullYear()

  const { data: seedSchedule } = useQuery(
    getSeedStartingSchedule,
    property ? { propertyId: property.id, year: currentYear } : undefined,
    { enabled: !!property }
  )

  const { data: harvestSummary } = useQuery(
    getHarvestSummary,
    property ? { propertyId: property.id, year: currentYear } : undefined,
    { enabled: !!property }
  )

  const { data: animalGroups } = useQuery(
    getAnimalGroups,
    property ? { propertyId: property.id } : undefined,
    { enabled: !!property }
  )

  if (propsLoading) {
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
          <Sprout className="mb-4 h-16 w-16 text-primary-400" />
          <h2 className="page-title mb-2">Welcome to GardenDo</h2>
          <p className="mb-6 text-neutral-500">
            Get started by creating your first property in Settings.
          </p>
          <Link to="/settings" className="btn-primary">
            Go to Settings
          </Link>
        </div>
      </div>
    )
  }

  const upcomingTasks = (tasks ?? []).slice(0, 5)
  const upcomingEvents = (events ?? []).slice(0, 5)
  const zoneCount = (property as any).zones?.length ?? 0

  // Seed starting stats
  const seedsThisWeek = seedSchedule
    ? seedSchedule.thisWeekIndoor.length + seedSchedule.thisWeekDirectSow.length
    : 0
  const activeTrays = seedSchedule?.activeTrays?.length ?? 0

  // Harvest stats
  const harvestLbs = harvestSummary?.totalLbs ?? 0

  // Animal stats
  const totalEggsThisWeek = (animalGroups ?? []).reduce(
    (sum: number, g: any) => sum + (g.weeklyEggs ?? 0),
    0
  )

  // Frost countdown
  const today = new Date()
  const firstFrostDate = parse(
    `${currentYear}-${property.firstFrostDate}`,
    "yyyy-MM-dd",
    new Date()
  )
  const lastFrostDate = parse(
    `${currentYear}-${property.lastFrostDate}`,
    "yyyy-MM-dd",
    new Date()
  )
  const daysToFirstFrost = differenceInDays(firstFrostDate, today)
  const daysSinceLastFrost = differenceInDays(today, lastFrostDate)

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="page-title">Welcome back</h1>
        <p className="mt-1 text-neutral-500">{property.name}</p>
      </div>

      {/* Weather */}
      <div className="mb-8">
        <WeatherWidget propertyId={property.id} />
      </div>

      {/* Feature Widgets — only show when data exists */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {seedsThisWeek > 0 && (
          <Link to="/seeds/starting" className="card p-4 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2">
                <Flower2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Start This Week</p>
                <p className="text-lg font-semibold text-neutral-900">{seedsThisWeek}</p>
              </div>
            </div>
          </Link>
        )}

        {activeTrays > 0 && (
          <Link to="/seeds/starting" className="card p-4 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2">
                <Sprout className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Active Trays</p>
                <p className="text-lg font-semibold text-neutral-900">{activeTrays}</p>
              </div>
            </div>
          </Link>
        )}

        {harvestLbs > 0 && (
          <Link to="/harvest" className="card p-4 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-50 p-2">
                <Apple className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Harvested</p>
                <p className="text-lg font-semibold text-neutral-900">{harvestLbs} lbs</p>
              </div>
            </div>
          </Link>
        )}

        {totalEggsThisWeek > 0 && (
          <Link to="/animals" className="card p-4 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-50 p-2">
                <Egg className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Eggs/Week</p>
                <p className="text-lg font-semibold text-neutral-900">{totalEggsThisWeek}</p>
              </div>
            </div>
          </Link>
        )}

        {/* Frost countdown — always show during growing season */}
        {daysSinceLastFrost >= 0 && daysToFirstFrost > 0 && (
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Snowflake className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">To First Frost</p>
                <p className="text-lg font-semibold text-neutral-900">{daysToFirstFrost}d</p>
              </div>
            </div>
          </div>
        )}

        {daysSinceLastFrost < 0 && (
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Snowflake className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Last Frost In</p>
                <p className="text-lg font-semibold text-neutral-900">{Math.abs(daysSinceLastFrost)}d</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link to="/plants" className="card p-4 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-50 p-2">
              <Sprout className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Plants</p>
              <p className="text-lg font-semibold text-neutral-900">Browse</p>
            </div>
          </div>
        </Link>

        <Link to="/garden" className="card p-4 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent-50 p-2">
              <Grid3X3 className="h-5 w-5 text-accent-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Zones</p>
              <p className="text-lg font-semibold text-neutral-900">
                {zoneCount}
              </p>
            </div>
          </div>
        </Link>

        <Link to="/calendar" className="card p-4 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Events</p>
              <p className="text-lg font-semibold text-neutral-900">
                {(events ?? []).length}
              </p>
            </div>
          </div>
        </Link>

        <Link to="/tasks" className="card p-4 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-earth-50 p-2">
              <CheckSquare className="h-5 w-5 text-earth-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Pending</p>
              <p className="text-lg font-semibold text-neutral-900">
                {upcomingTasks.length}
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Tasks */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <h2 className="font-semibold text-neutral-900">Upcoming Tasks</h2>
            <Link
              to="/tasks"
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {upcomingTasks.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-neutral-400">
                No pending tasks
              </p>
            ) : (
              upcomingTasks.map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      task.priority === "URGENT"
                        ? "bg-red-500"
                        : task.priority === "HIGH"
                          ? "bg-orange-500"
                          : task.priority === "MEDIUM"
                            ? "bg-accent-500"
                            : "bg-neutral-300"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-800">
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <p className="text-xs text-neutral-400">
                        Due {task.dueDate}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                    {task.status.replace("_", " ").toLowerCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <h2 className="font-semibold text-neutral-900">
              Upcoming Events
            </h2>
            <Link
              to="/calendar"
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {upcomingEvents.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-neutral-400">
                No upcoming events
              </p>
            ) : (
              upcomingEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <Clock className="h-4 w-4 shrink-0 text-neutral-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-800">
                      {event.title}
                    </p>
                    <p className="text-xs text-neutral-400">{event.date}</p>
                  </div>
                  <EventTypeBadge type={event.eventType} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/plants" className="btn-secondary">
          <Sprout className="h-4 w-4" />
          Browse Plants
        </Link>
        <Link to="/garden" className="btn-secondary">
          <Grid3X3 className="h-4 w-4" />
          View Garden
        </Link>
        <Link to="/seeds/starting" className="btn-secondary">
          <Flower2 className="h-4 w-4" />
          Seed Starting
        </Link>
        <Link to="/calendar" className="btn-secondary">
          <CalendarDays className="h-4 w-4" />
          Calendar
        </Link>
      </div>
    </div>
  )
}

function EventTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    SEED_START_INDOOR: "bg-primary-100 text-primary-700",
    SEED_START_OUTDOOR: "bg-primary-50 text-primary-600",
    TRANSPLANT: "bg-blue-100 text-blue-700",
    HARVEST_START: "bg-amber-100 text-amber-700",
    HARVEST_END: "bg-amber-50 text-amber-600",
    PRUNING: "bg-purple-100 text-purple-700",
    FERTILIZE: "bg-earth-100 text-earth-700",
    MAINTENANCE: "bg-neutral-100 text-neutral-600",
    CUSTOM: "bg-neutral-100 text-neutral-600",
  }

  const label = type.replace(/_/g, " ").toLowerCase()

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[type] ?? "bg-neutral-100 text-neutral-600"}`}
    >
      {label}
    </span>
  )
}
