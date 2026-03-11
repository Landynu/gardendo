import { useQuery, getBedById } from "wasp/client/operations"
import { Link, useParams } from "react-router"
import { ArrowLeft, Leaf, Grid3X3 } from "lucide-react"
import { useState } from "react"

const SEASONS = ["SPRING", "SUMMER", "FALL"] as const

export function BedDetailPage() {
  const { bedId } = useParams()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [season, setSeason] = useState<string>("SPRING")

  const { data: bed, isLoading, error } = useQuery(getBedById, {
    id: bedId!,
  })

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

  // Build grid data from squares
  const squareMap = new Map<string, any>()
  for (const sq of bed.squares ?? []) {
    if (sq.year === year && sq.season === season) {
      squareMap.set(`${sq.row}-${sq.col}`, sq)
    }
  }

  const rows = bed.lengthFt
  const cols = bed.widthFt

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
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-neutral-700">Year</label>
          <div className="flex items-center rounded-lg border border-neutral-300 bg-white">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              &larr;
            </button>
            <span className="border-x border-neutral-300 px-4 py-1.5 text-sm font-semibold text-neutral-900">
              {year}
            </span>
            <button
              onClick={() => setYear((y) => y + 1)}
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
                onClick={() => setSeason(s)}
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
            gridTemplateColumns: `2rem repeat(${cols}, minmax(3rem, 1fr))`,
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
                gridTemplateColumns: `2rem repeat(${cols}, minmax(3rem, 1fr))`,
              }}
            >
              {/* Row label */}
              <div className="flex items-center justify-center text-xs font-medium text-neutral-400">
                {r + 1}
              </div>

              {/* Cells */}
              {Array.from({ length: cols }, (_, c) => {
                const square = squareMap.get(`${r}-${c}`)
                const planting = square?.planting
                const plant = planting?.plant

                return (
                  <div
                    key={c}
                    className={`group relative flex aspect-square items-center justify-center rounded-md border-2 text-xs font-bold transition-all ${
                      plant
                        ? "cursor-pointer border-white/40 text-white shadow-sm hover:scale-105 hover:shadow-md"
                        : "cursor-pointer border-dashed border-neutral-200 bg-neutral-50 text-neutral-300 hover:border-primary-300 hover:bg-primary-50"
                    }`}
                    style={
                      plant
                        ? { backgroundColor: plant.sqftColor ?? "#22c55e" }
                        : undefined
                    }
                    title={
                      plant
                        ? `${plant.name}${planting.notes ? ` - ${planting.notes}` : ""}`
                        : `Empty (${r + 1}, ${c + 1})`
                    }
                  >
                    {plant ? (
                      <>
                        <span className="text-xs leading-none sm:text-sm">
                          {plant.name.slice(0, 2).toUpperCase()}
                        </span>
                        {/* Tooltip on hover */}
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
      {bed.plantings && bed.plantings.length > 0 && (
        <div className="mt-4">
          <div className="card p-4">
            <h3 className="mb-3 text-sm font-semibold text-neutral-700">
              Legend
            </h3>
            <div className="flex flex-wrap gap-3">
              {getUniquePlants(bed.plantings).map((plant: any) => (
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
                  <span className="text-sm text-neutral-700">{plant.name}</span>
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
  )
}

function getUniquePlants(plantings: any[]): any[] {
  const seen = new Set<string>()
  const unique: any[] = []
  for (const p of plantings) {
    if (p.plant && !seen.has(p.plant.id)) {
      seen.add(p.plant.id)
      unique.push(p.plant)
    }
  }
  return unique
}
