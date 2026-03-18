import {
  useQuery,
  getProperties,
  getHarvestLogs,
  getHarvestSummary,
  getPlants,
  createHarvestLog,
  deleteHarvestLog,
} from "wasp/client/operations"
import { useState } from "react"
import { Apple, Leaf, Sprout, Trash2, TrendingUp, Hash, Award } from "lucide-react"
import { PageHeader } from "../components/ui/PageHeader"
import { StatCard } from "../components/ui/StatCard"
import { FilterTabs } from "../components/ui/FilterTabs"
import { Badge } from "../components/ui/Badge"
import { EmptyState } from "../components/ui/EmptyState"
import { QuickLogForm } from "../components/ui/QuickLogForm"
import { FormField } from "../components/ui/FormField"
import { INPUT_CLASS, SELECT_CLASS } from "../lib/styles"
import { format } from "date-fns"

const currentYear = new Date().getFullYear()

const YEAR_TABS = [
  { value: String(currentYear), label: String(currentYear) },
  { value: String(currentYear - 1), label: String(currentYear - 1) },
  { value: String(currentYear - 2), label: String(currentYear - 2) },
  { value: "ALL", label: "All Time" },
] as const

const CATEGORY_COLORS: Record<string, "green" | "blue" | "amber" | "orange" | "purple" | "earth"> = {
  VEGETABLE: "green",
  FRUIT: "orange",
  HERB: "purple",
  FLOWER: "blue",
  TREE: "earth",
  SHRUB: "earth",
}

export function HarvestPage() {
  const { data: properties, isLoading: propsLoading } = useQuery(getProperties)
  const property = properties?.[0]

  const [yearFilter, setYearFilter] = useState<string>(String(currentYear))
  const [plantFilter, setPlantFilter] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  const queryYear = yearFilter !== "ALL" ? parseInt(yearFilter) : undefined

  const { data: logs, isLoading: logsLoading } = useQuery(
    getHarvestLogs,
    property
      ? {
          propertyId: property.id,
          year: queryYear,
          plantId: plantFilter || undefined,
        }
      : undefined,
    { enabled: !!property }
  )

  const { data: summary } = useQuery(
    getHarvestSummary,
    property ? { propertyId: property.id, year: queryYear } : undefined,
    { enabled: !!property }
  )

  const { data: plants } = useQuery(getPlants)

  // Add form state
  const [newPlantId, setNewPlantId] = useState("")
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [newWeight, setNewWeight] = useState("")
  const [newNotes, setNewNotes] = useState("")

  const isLoading = propsLoading || logsLoading

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
          subtext="Create a property in Settings to start tracking harvests."
          actionLabel="Go to Settings"
          actionTo="/settings"
        />
      </div>
    )
  }

  const topPlant = summary?.byPlant?.[0]?.plantName ?? "—"

  async function handleAddHarvest() {
    if (!property || !newPlantId) return
    setSaving(true)
    try {
      await createHarvestLog({
        propertyId: property.id,
        plantId: newPlantId,
        date: newDate,
        quantityLbs: newWeight ? parseFloat(newWeight) : undefined,
        notes: newNotes || undefined,
      })
      setNewPlantId("")
      setNewWeight("")
      setNewNotes("")
      setShowAdd(false)
    } catch (err) {
      console.error("Failed to log harvest:", err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!property) return
    try {
      await deleteHarvestLog({ id, propertyId: property.id })
    } catch (err) {
      console.error("Failed to delete harvest:", err)
    }
  }

  return (
    <div className="page-container">
      <PageHeader title="Harvest Log">
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
          <Apple className="h-4 w-4" />
          Log Harvest
        </button>
      </PageHeader>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          icon={TrendingUp}
          label="Total Harvest"
          value={`${summary?.totalLbs ?? 0} lbs`}
          color="primary"
        />
        <StatCard
          icon={Hash}
          label="Harvests"
          value={summary?.harvestCount ?? 0}
          color="blue"
        />
        <StatCard
          icon={Award}
          label="Top Plant"
          value={topPlant}
          color="amber"
        />
      </div>

      {/* Quick Log Form */}
      <QuickLogForm
        title="Log a Harvest"
        open={showAdd}
        onToggle={() => setShowAdd(!showAdd)}
        onSubmit={handleAddHarvest}
        saving={saving}
      >
        <FormField label="Plant" required>
          <select
            value={newPlantId}
            onChange={(e) => setNewPlantId(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Select a plant...</option>
            {(plants ?? []).map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.variety ? ` (${p.variety})` : ""}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Date">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Weight (lbs)">
          <input
            type="number"
            step="0.1"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            placeholder="e.g. 2.5"
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Notes">
          <input
            type="text"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Optional notes..."
            className={INPUT_CLASS}
          />
        </FormField>
      </QuickLogForm>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <FilterTabs
          tabs={[...YEAR_TABS]}
          active={yearFilter}
          onChange={setYearFilter}
        />
        <select
          value={plantFilter}
          onChange={(e) => setPlantFilter(e.target.value)}
          className={`${SELECT_CLASS} sm:max-w-xs`}
        >
          <option value="">All Plants</option>
          {(plants ?? []).map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}{p.variety ? ` (${p.variety})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* By Plant Summary */}
      {summary && summary.byPlant.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            By Plant
          </h2>
          <div className="flex flex-wrap gap-2">
            {summary.byPlant.map((bp) => (
              <div key={bp.plantName} className="card px-3 py-2">
                <span className="text-sm font-medium text-neutral-800">{bp.plantName}</span>
                <span className="ml-2 text-sm text-neutral-500">
                  {Math.round(bp.totalLbs * 10) / 10} lbs ({bp.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Harvest Log List */}
      {(logs ?? []).length === 0 ? (
        <EmptyState
          icon={Apple}
          message="No harvests logged yet"
          subtext="Log your first harvest to start tracking yields."
          actionLabel="Log Harvest"
          onAction={() => setShowAdd(true)}
        />
      ) : (
        <div className="space-y-3">
          {(logs ?? []).map((log: any) => {
            const plantName = log.plant
              ? `${log.plant.name}${log.plant.variety ? ` (${log.plant.variety})` : ""}`
              : log.planting?.plant
                ? `${log.planting.plant.name}${log.planting.plant.variety ? ` (${log.planting.plant.variety})` : ""}`
                : "Unknown"
            const category = log.plant?.category ?? log.planting?.plant?.category

            return (
              <div key={log.id} className="card flex items-center gap-4 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900">{plantName}</span>
                    {category && (
                      <Badge
                        label={category.charAt(0) + category.slice(1).toLowerCase()}
                        color={CATEGORY_COLORS[category] ?? "neutral"}
                      />
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500">
                    <span>{log.date}</span>
                    {log.quantityLbs != null && <span>{log.quantityLbs} lbs</span>}
                    {log.notes && <span className="truncate">{log.notes}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="text-neutral-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
