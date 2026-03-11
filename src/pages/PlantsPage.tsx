import { useQuery, getPlants, enrichPlants } from "wasp/client/operations";
import { Link } from "react-router";
import { Search, Plus, Leaf, Sprout, Globe, Grid3X3, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { PlantFormModal } from "../components/PlantFormModal";
import { PlantBrowser } from "../components/PlantBrowser";

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
] as const;

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
};

const LIFECYCLES = ["ALL", "ANNUAL", "BIENNIAL", "PERENNIAL"] as const;

const lifecycleLabels: Record<string, string> = {
  ALL: "All",
  ANNUAL: "Annual",
  BIENNIAL: "Biennial",
  PERENNIAL: "Perennial",
};

const lifecycleColors: Record<string, string> = {
  ANNUAL: "bg-primary-100 text-primary-700",
  BIENNIAL: "bg-blue-100 text-blue-700",
  PERENNIAL: "bg-purple-100 text-purple-700",
};

export function PlantsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [lifecycle, setLifecycle] = useState<string>("ALL");
  const [showForm, setShowForm] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState<{ updated: number; skipped: number } | null>(null);

  async function handleEnrich() {
    setEnriching(true);
    setEnrichResult(null);
    try {
      const result = await enrichPlants();
      setEnrichResult(result);
    } catch {
      setEnrichResult({ updated: 0, skipped: -1 });
    } finally {
      setEnriching(false);
    }
  }

  const queryArgs: { search?: string; category?: string; lifecycle?: string } = {};
  if (search.trim()) queryArgs.search = search.trim();
  if (category !== "ALL") queryArgs.category = category;
  if (lifecycle !== "ALL") queryArgs.lifecycle = lifecycle;

  const { data: plants, isLoading } = useQuery(getPlants, queryArgs);

  return (
    <div className="page-container">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="page-title">Plants</h1>
        <div className="flex gap-2">
          <Link to="/plants/companions" className="btn-secondary">
            <Grid3X3 className="h-4 w-4" />
            Companion Chart
          </Link>
          <button
            className="btn-secondary"
            onClick={handleEnrich}
            disabled={enriching}
          >
            {enriching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {enriching ? "Enriching..." : "Enrich Data"}
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowBrowser(true)}
          >
            <Globe className="h-4 w-4" />
            Search Plants
          </button>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add Plant
          </button>
        </div>
      </div>

      {enrichResult && (
        <div
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            enrichResult.skipped === -1
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {enrichResult.skipped === -1
            ? "Enrichment failed. Check your Trefle API token."
            : `Enriched ${enrichResult.updated} plant${enrichResult.updated !== 1 ? "s" : ""} from Trefle${enrichResult.skipped > 0 ? `, ${enrichResult.skipped} skipped` : ""}.`}
          <button
            onClick={() => setEnrichResult(null)}
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search plants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus:border-primary-500 focus:ring-primary-200 w-full rounded-lg border border-neutral-300 bg-white py-2 pr-4 pl-10 text-sm text-neutral-800 placeholder-neutral-400 transition-colors focus:ring-2 focus:outline-none"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="mb-2 flex flex-wrap gap-2">
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

      {/* Lifecycle Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {LIFECYCLES.map((lc) => (
          <button
            key={lc}
            onClick={() => setLifecycle(lc)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              lifecycle === lc
                ? lc === "ALL"
                  ? "bg-primary-600 text-white"
                  : lifecycleColors[lc]
                    ? lifecycleColors[lc] + " ring-2 ring-current"
                    : "bg-primary-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {lifecycleLabels[lc]}
          </button>
        ))}
      </div>

      {/* Plants Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Leaf className="text-primary-500 h-8 w-8 animate-spin" />
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
              className="card group overflow-hidden hover:shadow-md"
            >
              {(plant as any).displayImageUrl ? (
                <div className="relative h-32 w-full overflow-hidden bg-neutral-100">
                  <img
                    src={(plant as any).displayImageUrl}
                    alt={plant.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <span
                    className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium ${lifecycleColors[plant.lifecycle] ?? "bg-neutral-100 text-neutral-600"}`}
                  >
                    {plant.lifecycle.charAt(0) + plant.lifecycle.slice(1).toLowerCase()}
                  </span>
                </div>
              ) : (
                <div
                  className="relative flex h-32 w-full items-center justify-center"
                  style={{ backgroundColor: plant.sqftColor ?? "#22c55e" }}
                >
                  <span className="text-3xl font-bold text-white/80">
                    {plant.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span
                    className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium ${lifecycleColors[plant.lifecycle] ?? "bg-neutral-100 text-neutral-600"}`}
                  >
                    {plant.lifecycle.charAt(0) + plant.lifecycle.slice(1).toLowerCase()}
                  </span>
                </div>
              )}

              <div className="p-4">
                <h3 className="group-hover:text-primary-700 font-semibold text-neutral-900">
                  {plant.name}
                </h3>
                {plant.variety && (
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {plant.variety}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs capitalize text-neutral-600">
                    {categoryLabels[plant.category] ?? plant.category}
                  </span>
                  {plant.daysToMaturity && (
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                      {plant.daysToMaturity} days
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <PlantFormModal open={showForm} onClose={() => setShowForm(false)} />
      <PlantBrowser
        open={showBrowser}
        onClose={() => setShowBrowser(false)}
      />
    </div>
  );
}
