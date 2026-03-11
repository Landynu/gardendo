import {
  useQuery,
  getProperties,
  getZones,
  createZone,
  createBed,
} from "wasp/client/operations"
import { Link } from "react-router"
import { useState } from "react"
import {
  Plus,
  Leaf,
  Grid3X3,
  MapPin,
  Maximize2,
  TreePine,
  X,
} from "lucide-react"

const permZoneLabels: Record<string, string> = {
  ZONE_0: "Zone 0 - Home",
  ZONE_1: "Zone 1 - Kitchen Garden",
  ZONE_2: "Zone 2 - Orchard / Intensive",
  ZONE_3: "Zone 3 - Main Crops",
  ZONE_4: "Zone 4 - Semi-Wild",
  ZONE_5: "Zone 5 - Wild / Forest",
}

const permZoneColors: Record<string, string> = {
  ZONE_0: "bg-red-100 text-red-700",
  ZONE_1: "bg-primary-100 text-primary-700",
  ZONE_2: "bg-accent-100 text-accent-700",
  ZONE_3: "bg-earth-100 text-earth-700",
  ZONE_4: "bg-blue-100 text-blue-700",
  ZONE_5: "bg-emerald-100 text-emerald-700",
}

const permZoneOptions = [
  { value: "ZONE_0", label: "Zone 0 - Home" },
  { value: "ZONE_1", label: "Zone 1 - Kitchen Garden" },
  { value: "ZONE_2", label: "Zone 2 - Orchard / Intensive" },
  { value: "ZONE_3", label: "Zone 3 - Main Crops" },
  { value: "ZONE_4", label: "Zone 4 - Semi-Wild" },
  { value: "ZONE_5", label: "Zone 5 - Wild / Forest" },
]

export function GardenPage() {
  const { data: properties, isLoading: propsLoading } =
    useQuery(getProperties)
  const property = properties?.[0]

  const { data: zones, isLoading: zonesLoading } = useQuery(
    getZones,
    property ? { propertyId: property.id } : undefined,
    { enabled: !!property }
  )

  const [showZoneForm, setShowZoneForm] = useState(false)
  const [showBedForm, setShowBedForm] = useState(false)
  const [bedZoneId, setBedZoneId] = useState<string | null>(null)

  const isLoading = propsLoading || zonesLoading

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
          <TreePine className="mb-4 h-16 w-16 text-neutral-300" />
          <p className="text-neutral-500">
            Create a property first to manage your garden.
          </p>
          <Link to="/settings" className="btn-primary mt-4">
            Go to Settings
          </Link>
        </div>
      </div>
    )
  }

  function openBedForm(zoneId: string) {
    setBedZoneId(zoneId)
    setShowBedForm(true)
  }

  return (
    <div className="page-container">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Garden</h1>
          <p className="mt-1 text-sm text-neutral-500">{property.name}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowZoneForm(true)}
            className="btn-secondary"
          >
            <Plus className="h-4 w-4" />
            Add Zone
          </button>
        </div>
      </div>

      {showZoneForm && (
        <CreateZoneForm
          propertyId={property.id}
          onClose={() => setShowZoneForm(false)}
        />
      )}

      {showBedForm && bedZoneId && (
        <CreateBedForm
          zoneId={bedZoneId}
          onClose={() => {
            setShowBedForm(false)
            setBedZoneId(null)
          }}
        />
      )}

      {!zones || zones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MapPin className="mb-4 h-12 w-12 text-neutral-300" />
          <p className="text-neutral-500">No zones created yet</p>
          <p className="mt-1 text-sm text-neutral-400">
            Create a zone to start organizing your garden beds
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {zones.map((zone: any) => (
            <div key={zone.id} className="card overflow-hidden">
              <div className="border-b border-neutral-100 px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-neutral-900">
                        {zone.name}
                      </h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${permZoneColors[zone.permZone] ?? "bg-neutral-100 text-neutral-600"}`}
                      >
                        {permZoneLabels[zone.permZone] ?? zone.permZone}
                      </span>
                    </div>
                    {zone.description && (
                      <p className="mt-1 text-sm text-neutral-500">
                        {zone.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {zone.areaSqFt != null && (
                      <span className="flex items-center gap-1 text-sm text-neutral-400">
                        <Maximize2 className="h-4 w-4" />
                        {zone.areaSqFt} sq ft
                      </span>
                    )}
                    <button
                      onClick={() => openBedForm(zone.id)}
                      className="btn-secondary !py-1 !px-2 !text-xs"
                    >
                      <Plus className="h-3 w-3" />
                      Add Bed
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {zone.gardenBeds.length === 0 ? (
                  <p className="text-center text-sm text-neutral-400">
                    No garden beds in this zone yet
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {zone.gardenBeds.map((bed: any) => (
                      <Link
                        key={bed.id}
                        to={`/garden/bed/${bed.id}`}
                        className="group flex items-center gap-3 rounded-lg border border-neutral-200 p-3 transition-all hover:border-primary-300 hover:shadow-sm"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                          <Grid3X3 className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-neutral-800 group-hover:text-primary-700">
                            {bed.name}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {bed.widthFt} x {bed.lengthFt} ft
                            {bed.shape !== "RECTANGLE" && ` \u00B7 ${bed.shape.charAt(0) + bed.shape.slice(1).toLowerCase()}`}
                            {bed.bedType === "RAISED" && " \u00B7 Raised"}
                            {bed.bedType === "CONTAINER" && " \u00B7 Container"}
                            {bed.soilType && ` \u00B7 ${bed.soilType}`}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateZoneForm({
  propertyId,
  onClose,
}: {
  propertyId: string
  onClose: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    permZone: "ZONE_1",
    description: "",
    areaSqFt: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await createZone({
        propertyId,
        name: form.name,
        permZone: form.permZone,
        description: form.description || undefined,
        areaSqFt: form.areaSqFt ? parseFloat(form.areaSqFt) : undefined,
      })
      onClose()
    } catch (err) {
      console.error("Failed to create zone:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card mb-6 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">
          Create Zone
        </h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1 block">
              Zone Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Kitchen Garden"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1 block">Permaculture Zone</label>
            <select
              value={form.permZone}
              onChange={(e) => setForm({ ...form, permZone: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              {permZoneOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label mb-1 block">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Optional description"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1 block">Area (sq ft)</label>
            <input
              type="number"
              value={form.areaSqFt}
              onChange={(e) => setForm({ ...form, areaSqFt: e.target.value })}
              placeholder="Optional"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.name}
            className="btn-primary"
          >
            {saving ? "Creating..." : "Create Zone"}
          </button>
        </div>
      </form>
    </div>
  )
}

function CreateBedForm({
  zoneId,
  onClose,
}: {
  zoneId: string
  onClose: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    widthFt: "4",
    lengthFt: "8",
    shape: "RECTANGLE",
    bedType: "IN_GROUND",
    heightIn: "",
    soilType: "",
    notes: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await createBed({
        zoneId,
        name: form.name,
        widthFt: parseInt(form.widthFt),
        lengthFt: parseInt(form.lengthFt),
        shape: form.shape,
        bedType: form.bedType,
        heightIn: form.heightIn ? parseInt(form.heightIn) : undefined,
        soilType: form.soilType || undefined,
        notes: form.notes || undefined,
      })
      onClose()
    } catch (err) {
      console.error("Failed to create bed:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card mb-6 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">
          Create Garden Bed
        </h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label mb-1 block">
            Bed Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Raised Bed #1"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="label mb-1 block">Width (ft)</label>
            <input
              type="number"
              min="1"
              max="50"
              value={form.widthFt}
              onChange={(e) => setForm({ ...form, widthFt: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1 block">Length (ft)</label>
            <input
              type="number"
              min="1"
              max="50"
              value={form.lengthFt}
              onChange={(e) => setForm({ ...form, lengthFt: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="label mb-1 block">Shape</label>
            <select
              value={form.shape}
              onChange={(e) => setForm({ ...form, shape: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              <option value="RECTANGLE">Rectangle</option>
              <option value="OVAL">Oval</option>
            </select>
          </div>
          <div>
            <label className="label mb-1 block">Bed Type</label>
            <select
              value={form.bedType}
              onChange={(e) => setForm({ ...form, bedType: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              <option value="IN_GROUND">In-Ground</option>
              <option value="RAISED">Raised</option>
              <option value="CONTAINER">Container</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(form.bedType === "RAISED" || form.bedType === "CONTAINER") && (
            <div>
              <label className="label mb-1 block">Height (inches)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={form.heightIn}
                onChange={(e) => setForm({ ...form, heightIn: e.target.value })}
                placeholder="e.g. 17"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          )}
          <div className={form.bedType === "RAISED" || form.bedType === "CONTAINER" ? "col-span-1 sm:col-span-3" : "col-span-2 sm:col-span-4"}>
            <label className="label mb-1 block">Soil Type</label>
            <input
              type="text"
              value={form.soilType}
              onChange={(e) => setForm({ ...form, soilType: e.target.value })}
              placeholder="e.g. Raised bed mix"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.name}
            className="btn-primary"
          >
            {saving ? "Creating..." : "Create Bed"}
          </button>
        </div>
      </form>
    </div>
  )
}
