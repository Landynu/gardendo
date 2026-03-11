import { useQuery, getProperties, createProperty } from "wasp/client/operations"
import {
  Leaf,
  Settings,
  MapPin,
  Thermometer,
  Clock,
  Users,
  Plus,
} from "lucide-react"
import { useState, lazy, Suspense } from "react"

const LocationPicker = lazy(() =>
  import("../components/LocationPicker").then((m) => ({
    default: m.LocationPicker,
  }))
)

export function SettingsPage() {
  const { data: properties, isLoading } = useQuery(getProperties)
  const [showForm, setShowForm] = useState(false)

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-20">
          <Leaf className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </div>
    )
  }

  const property = properties?.[0]

  return (
    <div className="page-container">
      <h1 className="page-title mb-6">Settings</h1>

      {!property && !showForm ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Settings className="mb-4 h-16 w-16 text-neutral-300" />
          <p className="mb-1 text-neutral-500">No property configured yet</p>
          <p className="mb-6 text-sm text-neutral-400">
            Create your property to get started with GardenDo.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Create Property
          </button>
        </div>
      ) : !property && showForm ? (
        <CreatePropertyForm onCancel={() => setShowForm(false)} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <MapPin className="h-5 w-5 text-primary-600" />
              Property Details
            </h2>
            <div className="space-y-3">
              <DetailRow label="Name" value={property!.name} />
              <DetailRow
                label="Acreage"
                value={`${property!.acreage} acres`}
              />
              {property!.latitude != null && property!.longitude != null && (
                <DetailRow
                  label="Location"
                  value={`${property!.latitude!.toFixed(4)}, ${property!.longitude!.toFixed(4)}`}
                />
              )}
              {property!.notes && (
                <DetailRow label="Notes" value={property!.notes} />
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <Thermometer className="h-5 w-5 text-orange-500" />
              Climate
            </h2>
            <div className="space-y-3">
              <DetailRow
                label="Hardiness Zone"
                value={property!.hardinessZone}
              />
              <DetailRow
                label="Last Frost Date"
                value={property!.lastFrostDate}
              />
              <DetailRow
                label="First Frost Date"
                value={property!.firstFrostDate}
              />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <Clock className="h-5 w-5 text-blue-500" />
              Timezone
            </h2>
            <div className="space-y-3">
              <DetailRow label="Timezone" value={property!.timezone} />
            </div>
          </div>

          {property!.latitude != null && property!.longitude != null && (
            <div className="card p-5 lg:col-span-2">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900">
                <MapPin className="h-5 w-5 text-primary-600" />
                Location
              </h2>
              <Suspense
                fallback={
                  <div className="flex h-[300px] items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
                    <Leaf className="h-6 w-6 animate-spin text-primary-400" />
                  </div>
                }
              >
                <LocationPicker
                  latitude={property!.latitude!}
                  longitude={property!.longitude!}
                  onChange={() => {}}
                />
              </Suspense>
            </div>
          )}

          <div className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <Users className="h-5 w-5 text-accent-600" />
              Members
            </h2>
            {(property as any).members &&
            (property as any).members.length > 0 ? (
              <div className="space-y-2">
                {(property as any).members.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-100 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                        {member.userId.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm text-neutral-700">
                        {member.user?.auth?.identities?.[0]?.providerUserId ?? member.userId.slice(0, 8)}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        member.role === "OWNER"
                          ? "bg-accent-100 text-accent-700"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {member.role.toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400">No members found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CreatePropertyForm({ onCancel }: { onCancel: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    acreage: "25",
    hardinessZone: "3B",
    lastFrostDate: "05-21",
    firstFrostDate: "09-12",
    timezone: "America/Regina",
    latitude: 50.4452,
    longitude: -104.6189,
    notes: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await createProperty({
        name: form.name,
        acreage: parseFloat(form.acreage),
        hardinessZone: form.hardinessZone,
        lastFrostDate: form.lastFrostDate,
        firstFrostDate: form.firstFrostDate,
        timezone: form.timezone,
        latitude: form.latitude,
        longitude: form.longitude,
        notes: form.notes || undefined,
      })
    } catch (err) {
      console.error("Failed to create property:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg">
      <div className="card p-6">
        <h2 className="mb-6 text-lg font-semibold text-neutral-900">
          Create Your Property
        </h2>
        <div className="space-y-4">
          <Field label="Property Name" required>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Uhersky Homestead"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Acreage">
              <input
                type="number"
                step="0.1"
                value={form.acreage}
                onChange={(e) => setForm({ ...form, acreage: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              />
            </Field>
            <Field label="Hardiness Zone">
              <input
                type="text"
                value={form.hardinessZone}
                onChange={(e) =>
                  setForm({ ...form, hardinessZone: e.target.value })
                }
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Last Frost (MM-DD)">
              <input
                type="text"
                value={form.lastFrostDate}
                onChange={(e) =>
                  setForm({ ...form, lastFrostDate: e.target.value })
                }
                placeholder="05-21"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              />
            </Field>
            <Field label="First Frost (MM-DD)">
              <input
                type="text"
                value={form.firstFrostDate}
                onChange={(e) =>
                  setForm({ ...form, firstFrostDate: e.target.value })
                }
                placeholder="09-12"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
              />
            </Field>
          </div>

          <Field label="Timezone">
            <input
              type="text"
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </Field>

          <Field label="Property Location">
            <Suspense
              fallback={
                <div className="flex h-[280px] items-center justify-center rounded-lg border border-neutral-300 bg-neutral-50">
                  <Leaf className="h-6 w-6 animate-spin text-primary-400" />
                </div>
              }
            >
              <LocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={(lat, lng) =>
                  setForm({ ...form, latitude: lat, longitude: lng })
                }
              />
            </Suspense>
          </Field>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Optional notes about your property..."
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving || !form.name} className="btn-primary">
            {saving ? "Creating..." : "Create Property"}
          </button>
        </div>
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="label mb-1 block">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-right text-sm font-medium text-neutral-900">
        {value}
      </span>
    </div>
  )
}
