import { useState } from "react"
import { createPlant } from "wasp/client/operations"
import { X } from "lucide-react"

const CATEGORIES = [
  { value: "VEGETABLE", label: "Vegetable" },
  { value: "FRUIT", label: "Fruit" },
  { value: "HERB", label: "Herb" },
  { value: "FLOWER", label: "Flower" },
  { value: "TREE", label: "Tree" },
  { value: "SHRUB", label: "Shrub" },
  { value: "COVER_CROP", label: "Cover Crop" },
  { value: "GRASS", label: "Grass" },
]

const LIFECYCLES = [
  { value: "ANNUAL", label: "Annual" },
  { value: "BIENNIAL", label: "Biennial" },
  { value: "PERENNIAL", label: "Perennial" },
]

const SUN_OPTIONS = [
  { value: "", label: "—" },
  { value: "FULL_SUN", label: "Full Sun" },
  { value: "PARTIAL_SUN", label: "Partial Sun" },
  { value: "PARTIAL_SHADE", label: "Partial Shade" },
  { value: "FULL_SHADE", label: "Full Shade" },
]

const WATER_OPTIONS = [
  { value: "", label: "—" },
  { value: "LOW", label: "Low" },
  { value: "MODERATE", label: "Moderate" },
  { value: "HIGH", label: "High" },
]

const SEASON_OPTIONS = [
  { value: "", label: "—" },
  { value: "COOL", label: "Cool Season" },
  { value: "WARM", label: "Warm Season" },
]

const PERM_LAYERS = [
  { value: "", label: "—" },
  { value: "CANOPY", label: "Canopy" },
  { value: "UNDERSTORY", label: "Understory" },
  { value: "SHRUB", label: "Shrub" },
  { value: "HERBACEOUS", label: "Herbaceous" },
  { value: "GROUND_COVER", label: "Ground Cover" },
  { value: "VINE", label: "Vine" },
  { value: "ROOT", label: "Root" },
  { value: "FUNGAL", label: "Fungal" },
]

type Props = {
  open: boolean
  onClose: () => void
}

export function PlantFormModal({ open, onClose }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Basic info
  const [name, setName] = useState("")
  const [scientificName, setScientificName] = useState("")
  const [variety, setVariety] = useState("")
  const [category, setCategory] = useState("VEGETABLE")
  const [lifecycle, setLifecycle] = useState("ANNUAL")

  // Growing conditions
  const [sunRequirement, setSunRequirement] = useState("")
  const [waterNeed, setWaterNeed] = useState("")
  const [seasonType, setSeasonType] = useState("")
  const [daysToMaturity, setDaysToMaturity] = useState("")
  const [daysToGermination, setDaysToGermination] = useState("")

  // Spacing
  const [spacingInches, setSpacingInches] = useState("")
  const [rowSpacingInches, setRowSpacingInches] = useState("")
  const [plantDepthInches, setPlantDepthInches] = useState("")
  const [plantHeightInches, setPlantHeightInches] = useState("")
  const [plantsPerSqFt, setPlantsPerSqFt] = useState("")
  const [sqftColor, setSqftColor] = useState("#22c55e")

  // Schedule (weeks relative to frost)
  const [startIndoorWeeks, setStartIndoorWeeks] = useState("")
  const [transplantWeeks, setTransplantWeeks] = useState("")
  const [directSowWeeks, setDirectSowWeeks] = useState("")
  // harvestRelativeWeeks is auto-computed server-side from daysToMaturity + planting method

  // Permaculture
  const [permLayer, setPermLayer] = useState("")
  const [isNitrogenFixer, setIsNitrogenFixer] = useState(false)
  const [isDynamicAccumulator, setIsDynamicAccumulator] = useState(false)
  const [attractsPollinators, setAttractsPollinators] = useState(false)
  const [deerResistant, setDeerResistant] = useState(false)

  const [notes, setNotes] = useState("")

  function resetForm() {
    setName("")
    setScientificName("")
    setVariety("")
    setCategory("VEGETABLE")
    setLifecycle("ANNUAL")
    setSunRequirement("")
    setWaterNeed("")
    setSeasonType("")
    setDaysToMaturity("")
    setDaysToGermination("")
    setSpacingInches("")
    setRowSpacingInches("")
    setPlantDepthInches("")
    setPlantHeightInches("")
    setPlantsPerSqFt("")
    setSqftColor("#22c55e")
    setStartIndoorWeeks("")
    setTransplantWeeks("")
    setDirectSowWeeks("")
    setPermLayer("")
    setIsNitrogenFixer(false)
    setIsDynamicAccumulator(false)
    setAttractsPollinators(false)
    setDeerResistant(false)
    setNotes("")
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError("Plant name is required")
      return
    }

    setSaving(true)
    setError("")

    try {
      const intOrUndef = (v: string) => (v ? parseInt(v, 10) : undefined)
      const floatOrUndef = (v: string) => (v ? parseFloat(v) : undefined)
      const strOrUndef = (v: string) => (v || undefined)

      await createPlant({
        name: name.trim(),
        scientificName: strOrUndef(scientificName),
        variety: strOrUndef(variety),
        category,
        lifecycle,
        sunRequirement: strOrUndef(sunRequirement),
        waterNeed: strOrUndef(waterNeed),
        seasonType: strOrUndef(seasonType),
        daysToMaturity: intOrUndef(daysToMaturity),
        daysToGermination: intOrUndef(daysToGermination),
        spacingInches: floatOrUndef(spacingInches),
        rowSpacingInches: floatOrUndef(rowSpacingInches),
        plantDepthInches: floatOrUndef(plantDepthInches),
        plantHeightInches: floatOrUndef(plantHeightInches),
        plantsPerSqFt: intOrUndef(plantsPerSqFt),
        sqftColor: sqftColor || undefined,
        startIndoorWeeks: intOrUndef(startIndoorWeeks),
        transplantWeeks: intOrUndef(transplantWeeks),
        directSowWeeks: intOrUndef(directSowWeeks),
        // harvestRelativeWeeks auto-computed server-side
        permLayer: strOrUndef(permLayer),
        isNitrogenFixer,
        isDynamicAccumulator,
        attractsPollinators,
        deerResistant,
        notes: strOrUndef(notes),
      })

      resetForm()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to create plant")
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    if (!saving) {
      resetForm()
      onClose()
    }
  }

  if (!open) return null

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[5vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Add Plant</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-neutral-500 uppercase tracking-wide">
              Basic Info
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tomato"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Scientific Name</label>
                <input
                  type="text"
                  value={scientificName}
                  onChange={(e) => setScientificName(e.target.value)}
                  placeholder="e.g. Solanum lycopersicum"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="label">Variety</label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="e.g. Roma"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Lifecycle</label>
                <select
                  value={lifecycle}
                  onChange={(e) => setLifecycle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                >
                  {LIFECYCLES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Growing Conditions */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-neutral-500 uppercase tracking-wide">
              Growing Conditions
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Sun</label>
                <select
                  value={sunRequirement}
                  onChange={(e) => setSunRequirement(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                >
                  {SUN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Water</label>
                <select
                  value={waterNeed}
                  onChange={(e) => setWaterNeed(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                >
                  {WATER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Season</label>
                <select
                  value={seasonType}
                  onChange={(e) => setSeasonType(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                >
                  {SEASON_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Days to Maturity</label>
                <input
                  type="number"
                  value={daysToMaturity}
                  onChange={(e) => setDaysToMaturity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="label">Days to Germination</label>
                <input
                  type="number"
                  value={daysToGermination}
                  onChange={(e) => setDaysToGermination(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Spacing & Size */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-neutral-500 uppercase tracking-wide">
              Spacing & Size
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="label">Spacing (in)</label>
                <input
                  type="number"
                  step="0.5"
                  value={spacingInches}
                  onChange={(e) => setSpacingInches(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="label">Row Spacing (in)</label>
                <input
                  type="number"
                  step="0.5"
                  value={rowSpacingInches}
                  onChange={(e) => setRowSpacingInches(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="label">Depth (in)</label>
                <input
                  type="number"
                  step="0.25"
                  value={plantDepthInches}
                  onChange={(e) => setPlantDepthInches(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="label">Height (in)</label>
                <input
                  type="number"
                  step="1"
                  value={plantHeightInches}
                  onChange={(e) => setPlantHeightInches(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="label">Plants/sq ft</label>
                <input
                  type="number"
                  value={plantsPerSqFt}
                  onChange={(e) => setPlantsPerSqFt(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="label">Grid Color</label>
                <input
                  type="color"
                  value={sqftColor}
                  onChange={(e) => setSqftColor(e.target.value)}
                  className="mt-1 h-[38px] w-full cursor-pointer rounded-lg border border-neutral-300"
                />
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-neutral-500 uppercase tracking-wide">
              Schedule (weeks relative to last frost)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start Indoor</label>
                <input
                  type="number"
                  value={startIndoorWeeks}
                  onChange={(e) => setStartIndoorWeeks(e.target.value)}
                  placeholder="e.g. -8"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="label">Transplant</label>
                <input
                  type="number"
                  value={transplantWeeks}
                  onChange={(e) => setTransplantWeeks(e.target.value)}
                  placeholder="e.g. 0"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="label">Direct Sow</label>
                <input
                  type="number"
                  value={directSowWeeks}
                  onChange={(e) => setDirectSowWeeks(e.target.value)}
                  placeholder="e.g. -4"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="label">Harvest</label>
                <p className="mt-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500">
                  {(() => {
                    const dtm = parseInt(daysToMaturity);
                    const tw = parseInt(transplantWeeks);
                    const dsw = parseInt(directSowWeeks);
                    const siw = parseInt(startIndoorWeeks);
                    if (!isNaN(dtm)) {
                      const mw = Math.ceil(dtm / 7);
                      const base = !isNaN(tw) ? tw : !isNaN(dsw) ? dsw : !isNaN(siw) ? siw : null;
                      if (base !== null) {
                        const w = base + mw;
                        return `${Math.abs(w)} week${Math.abs(w) !== 1 ? "s" : ""} ${w < 0 ? "before" : "after"} last frost (auto)`;
                      }
                    }
                    return "Set days to maturity + planting method";
                  })()}
                </p>
              </div>
            </div>
          </section>

          {/* Permaculture */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-neutral-500 uppercase tracking-wide">
              Permaculture
            </h3>
            <div className="mb-3">
              <label className="label">Layer</label>
              <select
                value={permLayer}
                onChange={(e) => setPermLayer(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
              >
                {PERM_LAYERS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {[
                { label: "Nitrogen Fixer", value: isNitrogenFixer, set: setIsNitrogenFixer },
                { label: "Dynamic Accumulator", value: isDynamicAccumulator, set: setIsDynamicAccumulator },
                { label: "Attracts Pollinators", value: attractsPollinators, set: setAttractsPollinators },
                { label: "Deer Resistant", value: deerResistant, set: setDeerResistant },
              ].map((cb) => (
                <label key={cb.label} className="flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={cb.value}
                    onChange={(e) => cb.set(e.target.checked)}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  {cb.label}
                </label>
              ))}
            </div>
          </section>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Add Plant"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}
