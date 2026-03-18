import {
  useQuery,
  getProperties,
  getAnimalGroups,
  createAnimalGroup,
  createEggLog,
} from "wasp/client/operations"
import { Link } from "react-router"
import { useState } from "react"
import { Bird, Plus, Egg, Leaf, Sprout, ArrowRight } from "lucide-react"
import { PageHeader } from "../components/ui/PageHeader"
import { StatCard } from "../components/ui/StatCard"
import { Badge } from "../components/ui/Badge"
import { EmptyState } from "../components/ui/EmptyState"
import { QuickLogForm } from "../components/ui/QuickLogForm"
import { FormField } from "../components/ui/FormField"
import { INPUT_CLASS, SELECT_CLASS } from "../lib/styles"
import { format } from "date-fns"

const ANIMAL_TYPES = [
  "CHICKEN", "DUCK", "GOOSE", "TURKEY", "GOAT", "SHEEP",
  "PIG", "COW", "RABBIT", "BEE", "OTHER",
]

const TYPE_COLORS: Record<string, "green" | "blue" | "amber" | "orange" | "purple" | "earth"> = {
  CHICKEN: "amber",
  DUCK: "blue",
  GOOSE: "blue",
  TURKEY: "earth",
  GOAT: "earth",
  SHEEP: "neutral" as any,
  PIG: "orange",
  COW: "earth",
  RABBIT: "purple",
  BEE: "amber",
  OTHER: "neutral" as any,
}

export function AnimalsPage() {
  const { data: properties, isLoading: propsLoading } = useQuery(getProperties)
  const property = properties?.[0]

  const { data: groups, isLoading: groupsLoading } = useQuery(
    getAnimalGroups,
    property ? { propertyId: property.id } : undefined,
    { enabled: !!property }
  )

  const [showAddGroup, setShowAddGroup] = useState(false)
  const [showEggLog, setShowEggLog] = useState(false)
  const [saving, setSaving] = useState(false)

  // Add group form
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState("CHICKEN")
  const [newNotes, setNewNotes] = useState("")

  // Egg log form
  const [eggGroupId, setEggGroupId] = useState("")
  const [eggDate, setEggDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [eggCount, setEggCount] = useState("")
  const [eggNotes, setEggNotes] = useState("")

  const isLoading = propsLoading || groupsLoading

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

  const totalAnimals = (groups ?? []).reduce((sum: number, g: any) => sum + g.activeAnimalCount, 0)
  const totalEggsThisWeek = (groups ?? []).reduce((sum: number, g: any) => sum + g.weeklyEggs, 0)

  async function handleAddGroup() {
    if (!property || !newName.trim()) return
    setSaving(true)
    try {
      await createAnimalGroup({
        propertyId: property.id,
        name: newName.trim(),
        animalType: newType,
        notes: newNotes.trim() || undefined,
      })
      setNewName("")
      setNewNotes("")
      setShowAddGroup(false)
    } catch (err) {
      console.error("Failed to create group:", err)
    } finally {
      setSaving(false)
    }
  }

  async function handleEggLog() {
    if (!property || !eggGroupId || !eggCount) return
    setSaving(true)
    try {
      await createEggLog({
        propertyId: property.id,
        groupId: eggGroupId,
        date: eggDate,
        count: parseInt(eggCount),
        notes: eggNotes.trim() || undefined,
      })
      setEggCount("")
      setEggNotes("")
      setShowEggLog(false)
    } catch (err) {
      console.error("Failed to log eggs:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container">
      <PageHeader title="Animals">
        <button onClick={() => setShowEggLog(!showEggLog)} className="btn-secondary">
          <Egg className="h-4 w-4" />
          Log Eggs
        </button>
        <button onClick={() => setShowAddGroup(!showAddGroup)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Group
        </button>
      </PageHeader>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon={Bird} label="Total Animals" value={totalAnimals} color="primary" />
        <StatCard icon={Egg} label="Eggs This Week" value={totalEggsThisWeek} color="amber" />
        <StatCard icon={Bird} label="Groups" value={(groups ?? []).length} color="blue" />
      </div>

      {/* Egg Log Form */}
      <QuickLogForm
        title="Log Eggs"
        open={showEggLog}
        onToggle={() => setShowEggLog(!showEggLog)}
        onSubmit={handleEggLog}
        saving={saving}
      >
        <FormField label="Group" required>
          <select value={eggGroupId} onChange={(e) => setEggGroupId(e.target.value)} className={SELECT_CLASS}>
            <option value="">Select group...</option>
            {(groups ?? []).map((g: any) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Date">
          <input type="date" value={eggDate} onChange={(e) => setEggDate(e.target.value)} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Count" required>
          <input type="number" value={eggCount} onChange={(e) => setEggCount(e.target.value)} placeholder="e.g. 8" className={INPUT_CLASS} />
        </FormField>
        <FormField label="Notes">
          <input type="text" value={eggNotes} onChange={(e) => setEggNotes(e.target.value)} placeholder="Optional..." className={INPUT_CLASS} />
        </FormField>
      </QuickLogForm>

      {/* Add Group Form */}
      <QuickLogForm
        title="Add Animal Group"
        open={showAddGroup}
        onToggle={() => setShowAddGroup(!showAddGroup)}
        onSubmit={handleAddGroup}
        saving={saving}
      >
        <FormField label="Name" required>
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Main Flock" className={INPUT_CLASS} />
        </FormField>
        <FormField label="Type" required>
          <select value={newType} onChange={(e) => setNewType(e.target.value)} className={SELECT_CLASS}>
            {ANIMAL_TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Notes">
          <input type="text" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Optional..." className={INPUT_CLASS} />
        </FormField>
      </QuickLogForm>

      {/* Groups */}
      {(groups ?? []).length === 0 ? (
        <EmptyState
          icon={Bird}
          message="No animal groups yet"
          subtext="Add your first animal group to start tracking livestock."
          actionLabel="Add Group"
          onAction={() => setShowAddGroup(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(groups ?? []).map((group: any) => (
            <Link key={group.id} to={`/animals/${group.id}`} className="card p-4 hover:shadow-md">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-medium text-neutral-900">{group.name}</h3>
                <Badge
                  label={group.animalType.charAt(0) + group.animalType.slice(1).toLowerCase()}
                  color={TYPE_COLORS[group.animalType] ?? "neutral"}
                />
              </div>
              <div className="flex items-center gap-4 text-sm text-neutral-500">
                <span>{group.activeAnimalCount} animals</span>
                {group.weeklyEggs > 0 && (
                  <span className="flex items-center gap-1">
                    <Egg className="h-3.5 w-3.5" />
                    {group.weeklyEggs} this week
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center text-xs text-primary-600">
                View details <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
