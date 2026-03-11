import { useState } from "react"
import { searchOpenFarm, importFromOpenFarm } from "wasp/client/operations"
import { X, Search, Download, Loader2, Globe, Leaf } from "lucide-react"
import { useNavigate } from "react-router"

type Props = {
  open: boolean
  onClose: () => void
}

type CropResult = {
  slug: string
  name: string
  binomialName?: string
  description?: string
  sunRequirements?: string
  mainImagePath?: string
  tags: string[]
}

export function OpenFarmBrowser({ open, onClose }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CropResult[]>([])
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setSearching(true)
    setError("")
    setSearched(true)

    try {
      const crops = await searchOpenFarm({ query: query.trim() })
      setResults(crops)
    } catch (err: any) {
      setError(err.message || "Search failed")
    } finally {
      setSearching(false)
    }
  }

  async function handleImport(slug: string) {
    setImporting(slug)
    setError("")

    try {
      const plant = await importFromOpenFarm({ slug })
      onClose()
      navigate(`/plants/${plant.id}`)
    } catch (err: any) {
      setError(err.message || "Import failed")
    } finally {
      setImporting(null)
    }
  }

  if (!open) return null

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[5vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-neutral-900">
              Browse OpenFarm
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-neutral-500">
          Search the OpenFarm database to import plant data, growing info, and
          reference images.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search plants... (e.g. tomato, basil, lavender)"
                className="w-full rounded-lg border border-neutral-300 py-2 pr-4 pl-10 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="btn-primary"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </button>
          </div>
        </form>

        {/* Results */}
        {searching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            {results.map((crop) => (
              <div
                key={crop.slug}
                className="flex gap-3 rounded-lg border border-neutral-200 p-3 transition-colors hover:bg-neutral-50"
              >
                {crop.mainImagePath ? (
                  <img
                    src={crop.mainImagePath}
                    alt={crop.name}
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                    <Leaf className="h-6 w-6 text-neutral-300" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    {crop.name}
                  </h3>
                  {crop.binomialName && (
                    <p className="text-xs italic text-neutral-500">
                      {crop.binomialName}
                    </p>
                  )}
                  {crop.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                      {crop.description}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {crop.sunRequirements && (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
                        {crop.sunRequirements}
                      </span>
                    )}
                    {crop.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleImport(crop.slug)}
                  disabled={importing !== null}
                  className="btn-secondary h-fit shrink-0 self-center !px-3 !py-1.5 text-xs"
                >
                  {importing === crop.slug ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-3 w-3" />
                      Import
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : searched ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Leaf className="mb-3 h-10 w-10 text-neutral-300" />
            <p className="text-sm text-neutral-500">
              No results found for "{query}"
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Try a different search term
            </p>
          </div>
        ) : null}
      </div>
    </dialog>
  )
}
