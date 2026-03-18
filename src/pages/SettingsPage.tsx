import {
  useQuery,
  getProperties,
  createProperty,
  enrichPlants,
  getAiKeyStatus,
  saveAiApiKey,
  deleteAiApiKey,
  updateAiSystemPrompt,
} from "wasp/client/operations"
import {
  Leaf,
  Settings,
  MapPin,
  Thermometer,
  Clock,
  Users,
  Plus,
  Sparkles,
  Loader2,
  Key,
  Check,
  Trash2,
  RotateCcw,
  Bot,
} from "lucide-react"
import { useState, lazy, Suspense } from "react"
import { DEFAULT_SYSTEM_PROMPT } from "../ai/prompts"

const LocationPicker = lazy(() =>
  import("../components/LocationPicker").then((m) => ({
    default: m.LocationPicker,
  }))
)

export function SettingsPage() {
  const { data: properties, isLoading } = useQuery(getProperties)
  const [showForm, setShowForm] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [enrichResult, setEnrichResult] = useState<{ updated: number; skipped: number } | null>(null)

  async function handleEnrich() {
    setEnriching(true)
    setEnrichResult(null)
    try {
      const result = await enrichPlants()
      setEnrichResult(result)
    } catch {
      setEnrichResult({ updated: 0, skipped: -1 })
    } finally {
      setEnriching(false)
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
                {(property as any).members.map((member: any) => {
                  const email = member.user?.auth?.identities?.[0]?.providerUserId
                  const displayName = email ?? member.userId.slice(0, 8)
                  const initials = email
                    ? email.slice(0, 2).toUpperCase()
                    : member.userId.slice(0, 2).toUpperCase()
                  return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-100 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                        {initials}
                      </div>
                      <span className="text-sm text-neutral-700">
                        {displayName}
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
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-neutral-400">No members found</p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <Sparkles className="h-5 w-5 text-accent-600" />
              Plant Data Enrichment
            </h2>
            <p className="mb-4 text-sm text-neutral-500">
              Fetch images, soil data, growth timing, and appearance info from
              Trefle for all plants that have a scientific name.
            </p>
            {enrichResult && (
              <div
                className={`mb-4 rounded-lg px-3 py-2 text-sm ${
                  enrichResult.skipped === -1
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {enrichResult.skipped === -1
                  ? "Enrichment failed. Check your Trefle API token."
                  : `Enriched ${enrichResult.updated} plant${enrichResult.updated !== 1 ? "s" : ""}${enrichResult.skipped > 0 ? `, ${enrichResult.skipped} skipped` : ""}.`}
              </div>
            )}
            <button
              onClick={handleEnrich}
              disabled={enriching}
              className="btn-primary"
            >
              {enriching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enriching...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Enrich from Trefle
                </>
              )}
            </button>
          </div>

          {/* AI API Key */}
          <AiApiKeyCard />

          {/* AI System Prompt */}
          <AiSystemPromptCard propertyId={property!.id} currentPrompt={(property as any).aiSystemPrompt} />
        </div>
      )}
    </div>
  )
}

function AiApiKeyCard() {
  const { data: keyStatus } = useQuery(getAiKeyStatus)
  const [apiKey, setApiKey] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  async function handleSave() {
    if (!apiKey.trim()) return
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      await saveAiApiKey({ apiKey: apiKey.trim() })
      setApiKey("")
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to save key")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm("Remove your AI API key?")) return
    try {
      await deleteAiApiKey()
    } catch (err: any) {
      setError(err.message || "Failed to remove key")
    }
  }

  return (
    <div className="card p-5">
      <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-neutral-900">
        <Key className="h-5 w-5 text-accent-600" />
        AI API Key
      </h2>
      <p className="mb-4 text-sm text-neutral-500">
        Add your Anthropic API key to enable AI-powered garden design.
        Your key is encrypted at rest and never exposed after saving.
      </p>

      {keyStatus?.hasKey ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            <Check className="h-4 w-4" />
            API key configured
          </div>
          <div className="flex gap-2">
            <button onClick={handleDelete} className="btn-secondary text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
              Remove Key
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
          <button
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
            className="btn-primary"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Key className="h-4 w-4" />
                Save Key
              </>
            )}
          </button>
        </div>
      )}

      {saved && (
        <div className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          API key saved successfully.
        </div>
      )}
      {error && (
        <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}

function AiSystemPromptCard({
  propertyId,
  currentPrompt,
}: {
  propertyId: string
  currentPrompt: string | null
}) {
  const [prompt, setPrompt] = useState(currentPrompt ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isCustom = currentPrompt != null && currentPrompt !== ""

  async function handleSave() {
    setSaving(true)
    try {
      await updateAiSystemPrompt({
        propertyId,
        prompt: prompt.trim() || null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("Failed to save prompt:", err)
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setPrompt("")
    updateAiSystemPrompt({ propertyId, prompt: null })
  }

  return (
    <div className="card p-5 lg:col-span-2">
      <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-neutral-900">
        <Bot className="h-5 w-5 text-accent-600" />
        AI System Prompt
      </h2>
      <p className="mb-4 text-sm text-neutral-500">
        Customize the AI garden designer's personality and behavior.
        Climate data, plant database, and companion relationships are automatically included.
      </p>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={DEFAULT_SYSTEM_PROMPT}
        rows={8}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
      />

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Prompt"
          )}
        </button>
        {isCustom && (
          <button onClick={handleReset} className="btn-secondary">
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </button>
        )}
        {saved && (
          <span className="text-sm text-green-600">Saved!</span>
        )}
      </div>
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
