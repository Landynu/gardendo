import {
  useQuery,
  getProperties,
  getSeedStartingSchedule,
  getSeedInventory,
  createSeedStartLog,
  updateSeedStartLog,
} from "wasp/client/operations"
import { Link } from "react-router"
import { useState } from "react"
import {
  Flower2,
  Leaf,
  Sprout,
  Sun,
  Thermometer,
  Calendar,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react"
import { PageHeader } from "../components/ui/PageHeader"
import { StatCard } from "../components/ui/StatCard"
import { Badge } from "../components/ui/Badge"
import { EmptyState } from "../components/ui/EmptyState"
import { QuickLogForm } from "../components/ui/QuickLogForm"
import { FormField } from "../components/ui/FormField"
import { INPUT_CLASS, SELECT_CLASS } from "../lib/styles"
import { format } from "date-fns"

export function SeedStartingPage() {
  const { data: properties, isLoading: propsLoading } = useQuery(getProperties)
  const property = properties?.[0]

  const year = new Date().getFullYear()

  const { data: schedule, isLoading: scheduleLoading } = useQuery(
    getSeedStartingSchedule,
    property ? { propertyId: property.id, year } : undefined,
    { enabled: !!property }
  )

  const { data: seedInventory } = useQuery(
    getSeedInventory,
    property ? { propertyId: property.id } : undefined,
    { enabled: !!property }
  )

  const [showLogStart, setShowLogStart] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logPlantId, setLogPlantId] = useState("")
  const [logSeedInventoryId, setLogSeedInventoryId] = useState("")
  const [logDate, setLogDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [logCells, setLogCells] = useState("")
  const [logMedium, setLogMedium] = useState("")
  const [logLocation, setLogLocation] = useState("")
  const [logHeatMat, setLogHeatMat] = useState(false)

  const isLoading = propsLoading || scheduleLoading

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
        <EmptyState
          icon={Sprout}
          message="No property set up yet"
          subtext="Create a property in Settings first."
          actionLabel="Go to Settings"
          actionTo="/settings"
        />
      </div>
    )
  }

  if (!schedule) return null

  // Filter seed inventory for the selected plant
  const availableSeeds = (seedInventory ?? []).filter(
    (s: any) => s.plantId === logPlantId
  )

  async function handleLogStart() {
    if (!property || !logPlantId || !logSeedInventoryId || !logCells) return
    setSaving(true)
    try {
      await createSeedStartLog({
        propertyId: property.id,
        plantId: logPlantId,
        seedInventoryId: logSeedInventoryId,
        date: logDate,
        cellsStarted: parseInt(logCells),
        medium: logMedium || undefined,
        location: logLocation || undefined,
        heatMat: logHeatMat,
      })
      setLogPlantId("")
      setLogSeedInventoryId("")
      setLogCells("")
      setLogMedium("")
      setLogLocation("")
      setLogHeatMat(false)
      setShowLogStart(false)
    } catch (err) {
      console.error("Failed to log seed start:", err)
    } finally {
      setSaving(false)
    }
  }

  async function handleMarkSprouted(logId: string) {
    try {
      await updateSeedStartLog({
        id: logId,
        propertyId: property!.id,
        sproutedDate: format(new Date(), "yyyy-MM-dd"),
      })
    } catch (err) {
      console.error("Failed to mark sprouted:", err)
    }
  }

  async function handleMarkTransplanted(logId: string) {
    try {
      await updateSeedStartLog({
        id: logId,
        propertyId: property!.id,
        transplantedDate: format(new Date(), "yyyy-MM-dd"),
      })
    } catch (err) {
      console.error("Failed to mark transplanted:", err)
    }
  }

  function prefillLogStart(plantId: string) {
    setLogPlantId(plantId)
    setLogSeedInventoryId("")
    setShowLogStart(true)
  }

  return (
    <div className="page-container">
      <PageHeader title="Seed Starting">
        <Link to="/seeds" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Seed Inventory
        </Link>
      </PageHeader>

      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Calendar}
          label="Start This Week"
          value={schedule.thisWeekIndoor.length + schedule.thisWeekDirectSow.length}
          color="primary"
        />
        <StatCard
          icon={Sprout}
          label="Active Trays"
          value={schedule.activeTrays.length}
          color="amber"
        />
        <StatCard
          icon={Flower2}
          label="Seeds in Stock"
          value={schedule.seedsInStock}
          color="blue"
          to="/seeds"
        />
      </div>

      {/* Log Start Form */}
      <QuickLogForm
        title="Log Seed Start"
        open={showLogStart}
        onToggle={() => setShowLogStart(!showLogStart)}
        onSubmit={handleLogStart}
        saving={saving}
      >
        <FormField label="Plant" required>
          <select
            value={logPlantId}
            onChange={(e) => {
              setLogPlantId(e.target.value)
              setLogSeedInventoryId("")
            }}
            className={SELECT_CLASS}
          >
            <option value="">Select a plant...</option>
            {(seedInventory ?? []).map((s: any) => (
              <option key={s.id} value={s.plantId}>
                {s.plant.name}{s.plant.variety ? ` (${s.plant.variety})` : ""}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Seed Packet" required>
          <select
            value={logSeedInventoryId}
            onChange={(e) => setLogSeedInventoryId(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Select seed packet...</option>
            {availableSeeds.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.supplier ?? "Unknown"} — {s.quantity ?? "?"} {s.unit ?? "seeds"}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Date" required>
          <input
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Cells Started" required>
          <input
            type="number"
            value={logCells}
            onChange={(e) => setLogCells(e.target.value)}
            placeholder="e.g. 12"
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Growing Medium">
          <input
            type="text"
            value={logMedium}
            onChange={(e) => setLogMedium(e.target.value)}
            placeholder="e.g. Seed starting mix"
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Location">
          <input
            type="text"
            value={logLocation}
            onChange={(e) => setLogLocation(e.target.value)}
            placeholder="e.g. South window shelf"
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Heat Mat">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={logHeatMat}
              onChange={(e) => setLogHeatMat(e.target.checked)}
              className="rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-600">Using heat mat</span>
          </label>
        </FormField>
      </QuickLogForm>

      {/* Start Indoors This Week */}
      {schedule.thisWeekIndoor.length > 0 && (
        <Section title="Start Indoors This Week" icon={Sun}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {schedule.thisWeekIndoor.map((item) => (
              <ScheduleCard
                key={`indoor-${item.plantId}`}
                item={item}
                onLogStart={() => prefillLogStart(item.plantId)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Direct Sow This Week */}
      {schedule.thisWeekDirectSow.length > 0 && (
        <Section title="Direct Sow This Week" icon={Sprout}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {schedule.thisWeekDirectSow.map((item) => (
              <ScheduleCard
                key={`sow-${item.plantId}`}
                item={item}
                onLogStart={() => prefillLogStart(item.plantId)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Coming Next Week */}
      {(schedule.nextWeekIndoor.length > 0 || schedule.nextWeekDirectSow.length > 0) && (
        <Section title="Coming Up Next Week" icon={Calendar}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...schedule.nextWeekIndoor, ...schedule.nextWeekDirectSow].map((item) => (
              <ScheduleCard
                key={`next-${item.type}-${item.plantId}`}
                item={item}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Active Trays */}
      {schedule.activeTrays.length > 0 && (
        <Section title="Active Trays" icon={Thermometer}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {schedule.activeTrays.map((tray: any) => (
              <div key={tray.id} className="card p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="font-medium text-neutral-900">
                    {tray.plant.name}
                    {tray.plant.variety && (
                      <span className="ml-1 text-neutral-500">({tray.plant.variety})</span>
                    )}
                  </h4>
                  <TrayStatusBadge tray={tray} />
                </div>
                <div className="mb-3 space-y-1 text-sm text-neutral-500">
                  <p>Started: {tray.date} — {tray.cellsStarted} cells</p>
                  {tray.cellsSprouted != null && <p>Sprouted: {tray.cellsSprouted} cells</p>}
                  {tray.medium && <p>Medium: {tray.medium}</p>}
                  {tray.location && <p>Location: {tray.location}</p>}
                </div>
                <div className="flex gap-2">
                  {!tray.sproutedDate && (
                    <button
                      onClick={() => handleMarkSprouted(tray.id)}
                      className="btn-secondary text-xs"
                    >
                      Mark Sprouted
                    </button>
                  )}
                  {tray.sproutedDate && !tray.transplantedDate && (
                    <button
                      onClick={() => handleMarkTransplanted(tray.id)}
                      className="btn-primary text-xs"
                    >
                      Mark Transplanted
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Full Schedule */}
      {schedule.upcoming.length > 0 && (
        <Section title="Full Schedule" icon={Calendar}>
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Plant</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Seeds</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {schedule.upcoming.slice(0, 20).map((item, i) => (
                  <tr key={i} className="hover:bg-neutral-50">
                    <td className="px-4 py-2 text-neutral-600">{item.targetDate}</td>
                    <td className="px-4 py-2 font-medium text-neutral-900">{item.plantName}</td>
                    <td className="px-4 py-2">
                      <Badge
                        label={item.type === "indoor" ? "Indoor" : "Direct Sow"}
                        color={item.type === "indoor" ? "purple" : "green"}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        label={item.seedInStock ? "In Stock" : "Need Seeds"}
                        color={item.seedInStock ? "green" : "red"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Empty state when no schedule at all */}
      {schedule.thisWeekIndoor.length === 0 &&
        schedule.thisWeekDirectSow.length === 0 &&
        schedule.nextWeekIndoor.length === 0 &&
        schedule.nextWeekDirectSow.length === 0 &&
        schedule.activeTrays.length === 0 &&
        schedule.upcoming.length === 0 && (
          <EmptyState
            icon={Flower2}
            message="No seed starting schedule yet"
            subtext="Add plants with indoor start or direct sow timing to see your schedule."
            actionLabel="Browse Plants"
            actionTo="/plants"
          />
        )}
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="mb-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-800">
        <Icon className="h-5 w-5 text-primary-600" />
        {title}
      </h2>
      {children}
    </div>
  )
}

function ScheduleCard({
  item,
  onLogStart,
}: {
  item: {
    plantName: string
    targetDate: string
    type: "indoor" | "directSow"
    daysToGermination: number | null
    seedInStock: boolean
    seedQuantity: number | null
  }
  onLogStart?: () => void
}) {
  return (
    <div className="card p-4">
      <h4 className="mb-1 font-medium text-neutral-900">{item.plantName}</h4>
      <p className="mb-2 text-sm text-neutral-500">
        Target: {item.targetDate}
        {item.daysToGermination && ` — ${item.daysToGermination}d to germination`}
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge
          label={item.type === "indoor" ? "Indoor" : "Direct Sow"}
          color={item.type === "indoor" ? "purple" : "green"}
        />
        <Badge
          label={item.seedInStock ? `In Stock (${item.seedQuantity ?? "?"})` : "Need Seeds"}
          color={item.seedInStock ? "green" : "red"}
        />
      </div>
      {onLogStart && (
        <button onClick={onLogStart} className="btn-primary text-xs">
          Log Start
        </button>
      )}
    </div>
  )
}

function TrayStatusBadge({ tray }: { tray: any }) {
  if (tray.transplantedDate) {
    return <Badge label="Transplanted" color="green" />
  }
  if (tray.sproutedDate) {
    return <Badge label="Sprouted" color="blue" />
  }
  return <Badge label="Started" color="amber" />
}
