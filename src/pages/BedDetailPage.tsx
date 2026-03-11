import {
  useQuery,
  getBedById,
  saveBedSquares,
} from "wasp/client/operations"
import { type Plant } from "wasp/entities"
import { Link, useParams } from "react-router"
import {
  ArrowLeft,
  Leaf,
  Grid3X3,
  Eraser,
  Save,
  Palette,
  X,
} from "lucide-react"
import { useState, useEffect } from "react"
import { PlantPalette } from "../components/PlantPalette"

const SEASONS = ["SPRING", "SUMMER", "FALL"] as const

export function BedDetailPage() {
  const { bedId } = useParams()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [season, setSeason] = useState<string>("SPRING")

  // Editing state
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)
  const [eraserMode, setEraserMode] = useState(false)
  const [localSquares, setLocalSquares] = useState<Map<string, Plant>>(
    new Map()
  )
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  const { data: bed, isLoading, error } = useQuery(getBedById, {
    id: bedId!,
  })

  // Sync server data → localSquares when bed/year/season changes
  useEffect(() => {
    if (!bed) return
    const map = new Map<string, Plant>()
    for (const sq of bed.squares ?? []) {
      if (sq.year === year && sq.season === season && sq.planting?.plant) {
        map.set(`${sq.row}-${sq.col}`, sq.planting.plant as Plant)
      }
    }
    setLocalSquares(map)
    setIsDirty(false)
  }, [bed, year, season])

  // Unsaved changes guard
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  function handleYearChange(newYear: number) {
    if (isDirty && !window.confirm("You have unsaved changes. Discard them?"))
      return
    setYear(newYear)
  }

  function handleSeasonChange(newSeason: string) {
    if (isDirty && !window.confirm("You have unsaved changes. Discard them?"))
      return
    setSeason(newSeason)
  }

  function handleCellClick(row: number, col: number) {
    const key = `${row}-${col}`
    const current = localSquares.get(key)

    setLocalSquares((prev) => {
      const next = new Map(prev)
      if (eraserMode) {
        if (current) {
          next.delete(key)
          setIsDirty(true)
        }
      } else if (selectedPlant) {
        next.set(key, selectedPlant)
        setIsDirty(true)
      } else if (current) {
        // No tool selected + planted cell = clear it
        next.delete(key)
        setIsDirty(true)
      } else {
        // No tool, empty cell: open palette on mobile
        if (window.innerWidth < 768) setPaletteOpen(true)
        return prev
      }
      return next
    })
  }

  async function handleSave() {
    if (!bed || !isDirty) return
    setIsSaving(true)
    try {
      const squares: { row: number; col: number; plantId: string | null }[] =
        []
      for (const [key, plant] of localSquares) {
        const [r, c] = key.split("-").map(Number)
        squares.push({ row: r, col: c, plantId: plant.id })
      }
      await saveBedSquares({
        bedId: bed.id,
        year,
        season,
        squares,
      })
      setIsDirty(false)
    } catch (err) {
      console.error("Failed to save bed squares:", err)
    } finally {
      setIsSaving(false)
    }
  }

  function handleSelectPlant(plant: Plant | null) {
    setSelectedPlant(plant)
    setEraserMode(false)
  }

  function handleToggleEraser() {
    setEraserMode(!eraserMode)
    setSelectedPlant(null)
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

  if (error || !bed) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Grid3X3 className="mb-4 h-12 w-12 text-neutral-300" />
          <p className="text-neutral-500">Garden bed not found</p>
          <Link to="/garden" className="btn-secondary mt-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Garden
          </Link>
        </div>
      </div>
    )
  }

  const rows = bed.lengthFt
  const cols = bed.widthFt

  // Derive legend from localSquares
  const legendPlants = getUniquePlants(localSquares)

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/garden"
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Garden
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="page-title">{bed.name}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {bed.widthFt} x {bed.lengthFt} ft
              {bed.soilType && ` \u00B7 ${bed.soilType}`}
              {bed.zone && ` \u00B7 ${bed.zone.name}`}
            </p>
          </div>
        </div>
      </div>

      {/* Year / Season Selector */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-neutral-700">Year</label>
          <div className="flex items-center rounded-lg border border-neutral-300 bg-white">
            <button
              onClick={() => handleYearChange(year - 1)}
              className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              &larr;
            </button>
            <span className="border-x border-neutral-300 px-4 py-1.5 text-sm font-semibold text-neutral-900">
              {year}
            </span>
            <button
              onClick={() => handleYearChange(year + 1)}
              className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              &rarr;
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-neutral-700">
            Season
          </label>
          <div className="flex rounded-lg border border-neutral-300 bg-white">
            {SEASONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSeasonChange(s)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  season === s
                    ? "bg-primary-600 text-white"
                    : "text-neutral-600 hover:bg-neutral-50"
                } ${s === "SPRING" ? "rounded-l-lg" : ""} ${s === "FALL" ? "rounded-r-lg" : ""}`}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content: grid + palette */}
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Left: toolbar + grid + legend + notes */}
        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {/* Selected plant indicator */}
            {selectedPlant && (
              <div className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5">
                <div
                  className="h-5 w-5 rounded"
                  style={{
                    backgroundColor: selectedPlant.sqftColor ?? "#22c55e",
                  }}
                />
                <span className="text-sm font-medium text-primary-800">
                  {selectedPlant.name}
                </span>
                <button onClick={() => setSelectedPlant(null)}>
                  <X className="h-4 w-4 text-primary-400 hover:text-primary-600" />
                </button>
              </div>
            )}

            {/* Eraser toggle */}
            <button
              onClick={handleToggleEraser}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                eraserMode
                  ? "bg-red-100 text-red-700"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              <Eraser className="h-4 w-4" />
              Eraser
            </button>

            {/* Mobile palette trigger */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-200 md:hidden"
            >
              <Palette className="h-4 w-4" />
              Plants
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Save button */}
            {isDirty && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary"
              >
                {isSaving ? (
                  <Leaf className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save"}
              </button>
            )}
          </div>

          {/* Square Foot Grid */}
          <div className="card overflow-x-auto p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <Grid3X3 className="h-5 w-5 text-primary-600" />
              Bed Layout
            </h2>

            {/* Column labels */}
            <div
              className="mb-1 grid gap-1"
              style={{
                gridTemplateColumns: `2rem repeat(${cols}, minmax(2.75rem, 1fr))`,
              }}
            >
              <div />
              {Array.from({ length: cols }, (_, c) => (
                <div
                  key={c}
                  className="text-center text-xs font-medium text-neutral-400"
                >
                  {c + 1}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            <div className="space-y-1">
              {Array.from({ length: rows }, (_, r) => (
                <div
                  key={r}
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `2rem repeat(${cols}, minmax(2.75rem, 1fr))`,
                  }}
                >
                  {/* Row label */}
                  <div className="flex items-center justify-center text-xs font-medium text-neutral-400">
                    {r + 1}
                  </div>

                  {/* Cells */}
                  {Array.from({ length: cols }, (_, c) => {
                    const key = `${r}-${c}`
                    const plant = localSquares.get(key) ?? null

                    return (
                      <div
                        key={c}
                        onClick={() => handleCellClick(r, c)}
                        className={`group relative flex aspect-square flex-col items-center justify-center rounded-md border-2 text-xs font-bold transition-all ${
                          plant
                            ? `cursor-pointer border-white/40 text-white shadow-sm hover:scale-105 hover:shadow-md ${eraserMode ? "hover:border-red-400" : ""}`
                            : "cursor-pointer border-dashed border-neutral-200 bg-neutral-50 text-neutral-300 hover:border-primary-300 hover:bg-primary-50"
                        }`}
                        style={
                          plant
                            ? {
                                backgroundColor:
                                  plant.sqftColor ?? "#22c55e",
                              }
                            : selectedPlant
                              ? {
                                  borderColor: `${selectedPlant.sqftColor ?? "#22c55e"}40`,
                                }
                              : undefined
                        }
                        title={
                          plant
                            ? `${plant.name}${plant.plantsPerSqFt ? ` (${plant.plantsPerSqFt}/sq ft)` : ""}`
                            : `Empty (${r + 1}, ${c + 1})`
                        }
                      >
                        {plant ? (
                          <>
                            <span className="text-xs leading-none sm:text-sm">
                              {plant.name.slice(0, 2).toUpperCase()}
                            </span>
                            {plant.plantsPerSqFt && (
                              <span className="mt-0.5 text-[10px] leading-none opacity-75">
                                {plant.plantsPerSqFt}
                              </span>
                            )}
                            {/* Tooltip */}
                            <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded bg-neutral-800 px-2 py-1 text-xs font-normal whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                              {plant.name}
                              {plant.plantsPerSqFt &&
                                ` (${plant.plantsPerSqFt}/sq ft)`}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs">+</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          {legendPlants.length > 0 && (
            <div className="mt-4">
              <div className="card p-4">
                <h3 className="mb-3 text-sm font-semibold text-neutral-700">
                  Legend
                </h3>
                <div className="flex flex-wrap gap-3">
                  {legendPlants.map((plant) => (
                    <Link
                      key={plant.id}
                      to={`/plants/${plant.id}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-neutral-50"
                    >
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white"
                        style={{
                          backgroundColor: plant.sqftColor ?? "#22c55e",
                        }}
                      >
                        {plant.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm text-neutral-700">
                        {plant.name}
                      </span>
                      {plant.plantsPerSqFt && (
                        <span className="text-xs text-neutral-400">
                          {plant.plantsPerSqFt}/ft²
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bed notes */}
          {bed.notes && (
            <div className="mt-4">
              <div className="card p-4">
                <h3 className="mb-2 text-sm font-semibold text-neutral-700">
                  Notes
                </h3>
                <p className="text-sm text-neutral-500">{bed.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Desktop plant palette */}
        <PlantPalette
          selectedPlant={selectedPlant}
          onSelectPlant={handleSelectPlant}
          eraserMode={eraserMode}
          onToggleEraser={handleToggleEraser}
          isOpen={paletteOpen}
          onClose={() => setPaletteOpen(false)}
        />
      </div>
    </div>
  )
}

function getUniquePlants(squares: Map<string, Plant>): Plant[] {
  const seen = new Set<string>()
  const plants: Plant[] = []
  for (const plant of squares.values()) {
    if (!seen.has(plant.id)) {
      seen.add(plant.id)
      plants.push(plant)
    }
  }
  return plants.sort((a, b) => a.name.localeCompare(b.name))
}
