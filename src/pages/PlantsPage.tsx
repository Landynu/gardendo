import { useQuery, getPlants } from "wasp/client/operations"
import { Link } from "react-router"
import { Search, Plus, Leaf, Sprout } from "lucide-react"
import { useState } from "react"

const CATEGORIES = [
  "ALL",
  "VEGETABLE",
  "FRUIT",
  "HERB",
  "FLOWER",
  "TREE",
  "SHRUB",
  "COVER_CROP",
  "GRASS",
] as const

const categoryLabels: Record<string, string> = {
  ALL: "All",
  VEGETABLE: "Vegetable",
  FRUIT: "Fruit",
  HERB: "Herb",
  FLOWER: "Flower",
  TREE: "Tree",
  SHRUB: "Shrub",
  COVER_CROP: "Cover Crop",
  GRASS: "Grass",
}

const lifecycleColors: Record<string, string> = {
  ANNUAL: "bg-primary-100 text-primary-700",
  BIENNIAL: "bg-blue-100 text-blue-700",
  PERENNIAL: "bg-purple-100 text-purple-700",
}

export function PlantsPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string>("ALL")

  const queryArgs: { search?: string; category?: string } = {}
  if (search.trim()) queryArgs.search = search.trim()
  if (category !== "ALL") queryArgs.category = category

  const { data: plants, isLoading } = useQuery(getPlants, queryArgs)

  return (
    <div className="page-container">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="page-title">Plants</h1>
        <button className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Plant
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search plants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pr-4 pl-10 text-sm text-neutral-800 placeholder-neutral-400 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              category === cat
                ? "bg-primary-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Plants Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Leaf className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : !plants || plants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Sprout className="mb-4 h-12 w-12 text-neutral-300" />
          <p className="text-neutral-500">No plants found</p>
          {search && (
            <p className="mt-1 text-sm text-neutral-400">
              Try adjusting your search or filters
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plants.map((plant) => (
            <Link
              key={plant.id}
              to={`/plants/${plant.id}`}
              className="card group p-4 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{
                    backgroundColor: plant.sqftColor ?? "#22c55e",
                  }}
                >
                  {plant.name.slice(0, 2).toUpperCase()}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${lifecycleColors[plant.lifecycle] ?? "bg-neutral-100 text-neutral-600"}`}
                >
                  {plant.lifecycle.toLowerCase()}
                </span>
              </div>

              <h3 className="font-semibold text-neutral-900 group-hover:text-primary-700">
                {plant.name}
              </h3>
              {plant.variety && (
                <p className="mt-0.5 text-sm text-neutral-500">
                  {plant.variety}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                  {categoryLabels[plant.category] ?? plant.category}
                </span>
                {plant.daysToMaturity && (
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                    {plant.daysToMaturity} days
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
