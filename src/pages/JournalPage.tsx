import {
  useQuery,
  getProperties,
  getJournalEntries,
  createJournalEntry,
  deleteJournalEntry,
} from "wasp/client/operations"
import { useState } from "react"
import { BookOpen, Leaf, Sprout, Trash2, Search, Save } from "lucide-react"
import { PageHeader } from "../components/ui/PageHeader"
import { Badge } from "../components/ui/Badge"
import { EmptyState } from "../components/ui/EmptyState"
import { INPUT_CLASS, TEXTAREA_CLASS } from "../lib/styles"
import { format } from "date-fns"

const MOOD_OPTIONS = [
  { value: "great", label: "Great", emoji: "🌟" },
  { value: "good", label: "Good", emoji: "🌱" },
  { value: "okay", label: "Okay", emoji: "🌤" },
  { value: "tough", label: "Tough", emoji: "🌧" },
]

const MOOD_COLORS: Record<string, "green" | "blue" | "amber" | "red"> = {
  great: "green",
  good: "blue",
  okay: "amber",
  tough: "red",
}

export function JournalPage() {
  const { data: properties, isLoading: propsLoading } = useQuery(getProperties)
  const property = properties?.[0]

  const [search, setSearch] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const { data: entries, isLoading: entriesLoading } = useQuery(
    getJournalEntries,
    property
      ? {
          propertyId: property.id,
          search: searchQuery || undefined,
        }
      : undefined,
    { enabled: !!property }
  )

  // Today's entry form
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const todayEntry = (entries ?? []).find((e: any) => e.date === todayStr)

  const [content, setContent] = useState("")
  const [weatherNotes, setWeatherNotes] = useState("")
  const [mood, setMood] = useState("")
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Initialize form from existing today entry
  if (todayEntry && !initialized) {
    setContent(todayEntry.content)
    setWeatherNotes(todayEntry.weatherNotes ?? "")
    setMood(todayEntry.mood ?? "")
    setInitialized(true)
  }

  const isLoading = propsLoading || entriesLoading

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
        <EmptyState
          icon={Sprout}
          message="No property set up yet"
          subtext="Create a property in Settings first."
          actionLabel="Go to Settings"
          actionTo="/settings"
        />
      </div>
    )
  }

  async function handleSave() {
    if (!property || !content.trim()) return
    setSaving(true)
    try {
      await createJournalEntry({
        propertyId: property.id,
        date: todayStr,
        content: content.trim(),
        weatherNotes: weatherNotes.trim() || undefined,
        mood: mood || undefined,
      })
      setInitialized(true)
    } catch (err) {
      console.error("Failed to save journal entry:", err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!property) return
    try {
      await deleteJournalEntry({ id, propertyId: property.id })
    } catch (err) {
      console.error("Failed to delete entry:", err)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearchQuery(search)
  }

  const pastEntries = (entries ?? []).filter((e: any) => e.date !== todayStr)

  return (
    <div className="page-container">
      <PageHeader title="Garden Journal" />

      {/* Today's Entry */}
      <div className="card mb-8 p-5">
        <h2 className="mb-3 text-lg font-semibold text-neutral-800">
          Today — {format(new Date(), "EEEE, MMMM d")}
        </h2>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What happened in the garden today?"
          rows={4}
          className={`${TEXTAREA_CLASS} mb-3`}
        />

        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label mb-1 block">Weather Notes</label>
            <input
              type="text"
              value={weatherNotes}
              onChange={(e) => setWeatherNotes(e.target.value)}
              placeholder="e.g. Sunny, 18°C, light wind"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="label mb-1 block">Mood</label>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(mood === m.value ? "" : m.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    mood === m.value
                      ? "bg-primary-100 text-primary-700 ring-1 ring-primary-300"
                      : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="btn-primary"
          >
            <Save className="h-4 w-4" />
            {todayEntry ? "Update" : "Save"} Entry
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search past entries..."
          className={`${INPUT_CLASS} flex-1`}
        />
        <button type="submit" className="btn-secondary">
          <Search className="h-4 w-4" />
          Search
        </button>
      </form>

      {/* Past Entries */}
      {pastEntries.length === 0 && !searchQuery ? (
        <EmptyState
          icon={BookOpen}
          message="No past entries yet"
          subtext="Write today's entry above to start your garden journal."
        />
      ) : pastEntries.length === 0 && searchQuery ? (
        <EmptyState
          icon={Search}
          message="No entries found"
          subtext={`No entries matching "${searchQuery}"`}
        />
      ) : (
        <div className="space-y-4">
          {pastEntries.map((entry: any) => (
            <div key={entry.id} className="card p-4">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-800">{entry.date}</span>
                  {entry.mood && (
                    <Badge
                      label={entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                      color={MOOD_COLORS[entry.mood] ?? "neutral"}
                    />
                  )}
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-neutral-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm text-neutral-700">{entry.content}</p>
              {entry.weatherNotes && (
                <p className="mt-2 text-xs text-neutral-500">Weather: {entry.weatherNotes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
