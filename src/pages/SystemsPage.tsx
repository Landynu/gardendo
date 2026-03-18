import {
  useQuery,
  getProperties,
  getWaterSystems,
  getCompostBins,
  createWaterSystem,
  createWaterLog,
  createCompostBin,
  createCompostLog,
} from "wasp/client/operations"
import { useState } from "react"
import { Droplets, Recycle, Plus, Leaf, Sprout, Thermometer } from "lucide-react"
import { PageHeader } from "../components/ui/PageHeader"
import { Badge } from "../components/ui/Badge"
import { EmptyState } from "../components/ui/EmptyState"
import { QuickLogForm } from "../components/ui/QuickLogForm"
import { FormField } from "../components/ui/FormField"
import { INPUT_CLASS, SELECT_CLASS } from "../lib/styles"
import { format } from "date-fns"

const WATER_SOURCES = ["RAINWATER", "RIVER_PUMP", "WELL", "MUNICIPAL"]
const COMPOST_ACTIONS = ["TURN", "ADD_GREEN", "ADD_BROWN", "WATER", "HARVEST", "CHECK_TEMP"]

const SOURCE_COLORS: Record<string, "blue" | "green" | "earth" | "neutral"> = {
  RAINWATER: "blue",
  RIVER_PUMP: "blue",
  WELL: "earth",
  MUNICIPAL: "neutral",
}

export function SystemsPage() {
  const { data: properties, isLoading: propsLoading } = useQuery(getProperties)
  const property = properties?.[0]

  const { data: waterSystems, isLoading: waterLoading } = useQuery(
    getWaterSystems,
    property ? { propertyId: property.id } : undefined,
    { enabled: !!property }
  )

  const { data: compostBins, isLoading: compostLoading } = useQuery(
    getCompostBins,
    property ? { propertyId: property.id } : undefined,
    { enabled: !!property }
  )

  const [showAddWater, setShowAddWater] = useState(false)
  const [showWaterLog, setShowWaterLog] = useState(false)
  const [showAddCompost, setShowAddCompost] = useState(false)
  const [showCompostLog, setShowCompostLog] = useState(false)
  const [saving, setSaving] = useState(false)

  // Water system form
  const [waterName, setWaterName] = useState("")
  const [waterSource, setWaterSource] = useState("RAINWATER")
  const [waterCapacity, setWaterCapacity] = useState("")

  // Water log form
  const [waterLogSystemId, setWaterLogSystemId] = useState("")
  const [waterLogDate, setWaterLogDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [waterLogLevel, setWaterLogLevel] = useState("")
  const [waterLogUsage, setWaterLogUsage] = useState("")

  // Compost bin form
  const [compostName, setCompostName] = useState("")
  const [compostType, setCompostType] = useState("")
  const [compostCapacity, setCompostCapacity] = useState("")

  // Compost log form
  const [compostLogBinId, setCompostLogBinId] = useState("")
  const [compostLogDate, setCompostLogDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [compostLogAction, setCompostLogAction] = useState("TURN")
  const [compostLogTemp, setCompostLogTemp] = useState("")
  const [compostLogNotes, setCompostLogNotes] = useState("")

  const isLoading = propsLoading || waterLoading || compostLoading

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
        <EmptyState icon={Sprout} message="No property set up yet" actionLabel="Go to Settings" actionTo="/settings" />
      </div>
    )
  }

  async function handleAddWaterSystem() {
    if (!property || !waterName.trim()) return
    setSaving(true)
    try {
      await createWaterSystem({
        propertyId: property.id,
        name: waterName.trim(),
        sourceType: waterSource,
        capacityGallons: waterCapacity ? parseFloat(waterCapacity) : undefined,
      })
      setWaterName("")
      setWaterCapacity("")
      setShowAddWater(false)
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  async function handleWaterLog() {
    if (!property || !waterLogSystemId) return
    setSaving(true)
    try {
      await createWaterLog({
        propertyId: property.id,
        systemId: waterLogSystemId,
        date: waterLogDate,
        levelGallons: waterLogLevel ? parseFloat(waterLogLevel) : undefined,
        usageGallons: waterLogUsage ? parseFloat(waterLogUsage) : undefined,
      })
      setWaterLogLevel("")
      setWaterLogUsage("")
      setShowWaterLog(false)
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  async function handleAddCompostBin() {
    if (!property || !compostName.trim()) return
    setSaving(true)
    try {
      await createCompostBin({
        propertyId: property.id,
        name: compostName.trim(),
        type: compostType || undefined,
        capacityCuFt: compostCapacity ? parseFloat(compostCapacity) : undefined,
      })
      setCompostName("")
      setCompostType("")
      setCompostCapacity("")
      setShowAddCompost(false)
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  async function handleCompostLog() {
    if (!property || !compostLogBinId) return
    setSaving(true)
    try {
      await createCompostLog({
        propertyId: property.id,
        binId: compostLogBinId,
        date: compostLogDate,
        action: compostLogAction,
        tempFahrenheit: compostLogTemp ? parseFloat(compostLogTemp) : undefined,
        notes: compostLogNotes.trim() || undefined,
      })
      setCompostLogTemp("")
      setCompostLogNotes("")
      setShowCompostLog(false)
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  return (
    <div className="page-container">
      <PageHeader title="Systems" />

      {/* Water Systems */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-800">
            <Droplets className="h-5 w-5 text-blue-500" />
            Water Systems
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setShowWaterLog(!showWaterLog)} className="btn-secondary text-sm">Log Reading</button>
            <button onClick={() => setShowAddWater(!showAddWater)} className="btn-primary text-sm">
              <Plus className="h-4 w-4" /> Add System
            </button>
          </div>
        </div>

        <QuickLogForm title="Add Water System" open={showAddWater} onToggle={() => setShowAddWater(!showAddWater)} onSubmit={handleAddWaterSystem} saving={saving}>
          <FormField label="Name" required>
            <input type="text" value={waterName} onChange={(e) => setWaterName(e.target.value)} placeholder="e.g. Rainwater Tank" className={INPUT_CLASS} />
          </FormField>
          <FormField label="Source Type" required>
            <select value={waterSource} onChange={(e) => setWaterSource(e.target.value)} className={SELECT_CLASS}>
              {WATER_SOURCES.map((s) => <option key={s} value={s}>{s.replace("_", " ").charAt(0) + s.replace("_", " ").slice(1).toLowerCase()}</option>)}
            </select>
          </FormField>
          <FormField label="Capacity (gallons)">
            <input type="number" value={waterCapacity} onChange={(e) => setWaterCapacity(e.target.value)} placeholder="e.g. 500" className={INPUT_CLASS} />
          </FormField>
        </QuickLogForm>

        <QuickLogForm title="Log Water Reading" open={showWaterLog} onToggle={() => setShowWaterLog(!showWaterLog)} onSubmit={handleWaterLog} saving={saving}>
          <FormField label="System" required>
            <select value={waterLogSystemId} onChange={(e) => setWaterLogSystemId(e.target.value)} className={SELECT_CLASS}>
              <option value="">Select...</option>
              {(waterSystems ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Date">
            <input type="date" value={waterLogDate} onChange={(e) => setWaterLogDate(e.target.value)} className={INPUT_CLASS} />
          </FormField>
          <FormField label="Level (gallons)">
            <input type="number" value={waterLogLevel} onChange={(e) => setWaterLogLevel(e.target.value)} placeholder="Current level" className={INPUT_CLASS} />
          </FormField>
          <FormField label="Usage (gallons)">
            <input type="number" value={waterLogUsage} onChange={(e) => setWaterLogUsage(e.target.value)} placeholder="Used since last" className={INPUT_CLASS} />
          </FormField>
        </QuickLogForm>

        {(waterSystems ?? []).length === 0 ? (
          <EmptyState icon={Droplets} message="No water systems" subtext="Add a water system to track levels and usage." actionLabel="Add System" onAction={() => setShowAddWater(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(waterSystems ?? []).map((system: any) => {
              const lastLog = system.logs?.[0]
              return (
                <div key={system.id} className="card p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-medium text-neutral-900">{system.name}</h3>
                    <Badge label={system.sourceType.replace("_", " ")} color={SOURCE_COLORS[system.sourceType] ?? "neutral"} />
                  </div>
                  {system.capacityGallons && (
                    <p className="text-sm text-neutral-500">Capacity: {system.capacityGallons} gal</p>
                  )}
                  {lastLog && (
                    <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                      Last reading ({lastLog.date}): {lastLog.levelGallons != null ? `${lastLog.levelGallons} gal` : "—"}
                      {lastLog.usageGallons != null && ` | Used: ${lastLog.usageGallons} gal`}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Compost Bins */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-800">
            <Recycle className="h-5 w-5 text-earth-500" />
            Compost Bins
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setShowCompostLog(!showCompostLog)} className="btn-secondary text-sm">Log Action</button>
            <button onClick={() => setShowAddCompost(!showAddCompost)} className="btn-primary text-sm">
              <Plus className="h-4 w-4" /> Add Bin
            </button>
          </div>
        </div>

        <QuickLogForm title="Add Compost Bin" open={showAddCompost} onToggle={() => setShowAddCompost(!showAddCompost)} onSubmit={handleAddCompostBin} saving={saving}>
          <FormField label="Name" required>
            <input type="text" value={compostName} onChange={(e) => setCompostName(e.target.value)} placeholder="e.g. Bin A" className={INPUT_CLASS} />
          </FormField>
          <FormField label="Type">
            <input type="text" value={compostType} onChange={(e) => setCompostType(e.target.value)} placeholder="e.g. Hot compost, Worm bin" className={INPUT_CLASS} />
          </FormField>
          <FormField label="Capacity (cu ft)">
            <input type="number" value={compostCapacity} onChange={(e) => setCompostCapacity(e.target.value)} className={INPUT_CLASS} />
          </FormField>
        </QuickLogForm>

        <QuickLogForm title="Log Compost Action" open={showCompostLog} onToggle={() => setShowCompostLog(!showCompostLog)} onSubmit={handleCompostLog} saving={saving}>
          <FormField label="Bin" required>
            <select value={compostLogBinId} onChange={(e) => setCompostLogBinId(e.target.value)} className={SELECT_CLASS}>
              <option value="">Select...</option>
              {(compostBins ?? []).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </FormField>
          <FormField label="Date">
            <input type="date" value={compostLogDate} onChange={(e) => setCompostLogDate(e.target.value)} className={INPUT_CLASS} />
          </FormField>
          <FormField label="Action" required>
            <select value={compostLogAction} onChange={(e) => setCompostLogAction(e.target.value)} className={SELECT_CLASS}>
              {COMPOST_ACTIONS.map((a) => <option key={a} value={a}>{a.replace(/_/g, " ").charAt(0) + a.replace(/_/g, " ").slice(1).toLowerCase()}</option>)}
            </select>
          </FormField>
          <FormField label="Temperature (°F)">
            <input type="number" value={compostLogTemp} onChange={(e) => setCompostLogTemp(e.target.value)} placeholder="e.g. 140" className={INPUT_CLASS} />
          </FormField>
          <FormField label="Notes">
            <input type="text" value={compostLogNotes} onChange={(e) => setCompostLogNotes(e.target.value)} className={INPUT_CLASS} />
          </FormField>
        </QuickLogForm>

        {(compostBins ?? []).length === 0 ? (
          <EmptyState icon={Recycle} message="No compost bins" subtext="Add a compost bin to track turning, temps, and harvests." actionLabel="Add Bin" onAction={() => setShowAddCompost(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(compostBins ?? []).map((bin: any) => {
              const lastLog = bin.logs?.[0]
              return (
                <div key={bin.id} className="card p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-medium text-neutral-900">{bin.name}</h3>
                    {bin.type && <Badge label={bin.type} color="earth" />}
                  </div>
                  {bin.capacityCuFt && (
                    <p className="text-sm text-neutral-500">Capacity: {bin.capacityCuFt} cu ft</p>
                  )}
                  {lastLog && (
                    <div className="mt-2 rounded-lg bg-earth-50 px-3 py-2 text-sm text-earth-700">
                      Last: {lastLog.action.replace(/_/g, " ").toLowerCase()} ({lastLog.date})
                      {lastLog.tempFahrenheit != null && (
                        <span className="ml-1 inline-flex items-center gap-1">
                          <Thermometer className="inline h-3 w-3" /> {lastLog.tempFahrenheit}°F
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
