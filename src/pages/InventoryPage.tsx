import {
  useQuery,
  getProperties,
  getInventoryItems,
  createInventoryItem,
  deleteInventoryItem,
} from "wasp/client/operations"
import { useState } from "react"
import { Package, Plus, Trash2, Leaf, Sprout, AlertTriangle } from "lucide-react"
import { PageHeader } from "../components/ui/PageHeader"
import { FilterTabs } from "../components/ui/FilterTabs"
import { Badge } from "../components/ui/Badge"
import { EmptyState } from "../components/ui/EmptyState"
import { QuickLogForm } from "../components/ui/QuickLogForm"
import { FormField } from "../components/ui/FormField"
import { INPUT_CLASS, SELECT_CLASS } from "../lib/styles"

const CATEGORY_TABS = [
  { value: "ALL", label: "All" },
  { value: "TOOL", label: "Tools" },
  { value: "AMENDMENT", label: "Amendments" },
  { value: "FEED", label: "Feed" },
  { value: "SUPPLY", label: "Supplies" },
  { value: "SEED", label: "Seeds" },
] as const

const CATEGORY_COLORS: Record<string, "green" | "blue" | "amber" | "orange" | "purple" | "earth"> = {
  TOOL: "blue",
  AMENDMENT: "earth",
  FEED: "amber",
  SUPPLY: "purple",
  SEED: "green",
}

const CONDITION_OPTIONS = ["NEW", "GOOD", "FAIR", "WORN", "NEEDS_REPAIR"]

export function InventoryPage() {
  const { data: properties, isLoading: propsLoading } = useQuery(getProperties)
  const property = properties?.[0]

  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  const { data: items, isLoading: itemsLoading } = useQuery(
    getInventoryItems,
    property
      ? {
          propertyId: property.id,
          category: categoryFilter !== "ALL" ? categoryFilter : undefined,
          search: search || undefined,
        }
      : undefined,
    { enabled: !!property }
  )

  // Add form state
  const [newName, setNewName] = useState("")
  const [newCategory, setNewCategory] = useState("TOOL")
  const [newQuantity, setNewQuantity] = useState("")
  const [newUnit, setNewUnit] = useState("")
  const [newLocation, setNewLocation] = useState("")
  const [newCondition, setNewCondition] = useState("")

  const isLoading = propsLoading || itemsLoading

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
        <EmptyState icon={Sprout} message="No property set up yet" actionLabel="Go to Settings" actionTo="/settings" />
      </div>
    )
  }

  async function handleAdd() {
    if (!property || !newName.trim()) return
    setSaving(true)
    try {
      await createInventoryItem({
        propertyId: property.id,
        name: newName.trim(),
        category: newCategory,
        quantity: newQuantity ? parseInt(newQuantity) : undefined,
        unit: newUnit.trim() || undefined,
        location: newLocation.trim() || undefined,
        condition: newCondition || undefined,
      })
      setNewName("")
      setNewQuantity("")
      setNewUnit("")
      setNewLocation("")
      setNewCondition("")
      setShowAdd(false)
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!property) return
    try {
      await deleteInventoryItem({ id, propertyId: property.id })
    } catch (err) { console.error(err) }
  }

  return (
    <div className="page-container">
      <PageHeader title="Inventory">
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </PageHeader>

      <QuickLogForm title="Add Inventory Item" open={showAdd} onToggle={() => setShowAdd(!showAdd)} onSubmit={handleAdd} saving={saving}>
        <FormField label="Name" required>
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Garden fork" className={INPUT_CLASS} />
        </FormField>
        <FormField label="Category" required>
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className={SELECT_CLASS}>
            {CATEGORY_TABS.slice(1).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </FormField>
        <FormField label="Quantity">
          <input type="number" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Unit">
          <input type="text" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="e.g. lbs, bags, each" className={INPUT_CLASS} />
        </FormField>
        <FormField label="Location">
          <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="e.g. Shed, Garage" className={INPUT_CLASS} />
        </FormField>
        <FormField label="Condition">
          <select value={newCondition} onChange={(e) => setNewCondition(e.target.value)} className={SELECT_CLASS}>
            <option value="">Select...</option>
            {CONDITION_OPTIONS.map((c) => <option key={c} value={c}>{c.replace("_", " ").charAt(0) + c.replace("_", " ").slice(1).toLowerCase()}</option>)}
          </select>
        </FormField>
      </QuickLogForm>

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <FilterTabs tabs={[...CATEGORY_TABS]} active={categoryFilter} onChange={setCategoryFilter} />
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${INPUT_CLASS} sm:max-w-xs`}
        />
      </div>

      {(items ?? []).length === 0 ? (
        <EmptyState icon={Package} message="No inventory items" subtext="Add tools, amendments, and supplies to track." actionLabel="Add Item" onAction={() => setShowAdd(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(items ?? []).map((item: any) => {
            const lowStock = item.quantity != null && item.quantity <= 1
            return (
              <div key={item.id} className={`card p-4 ${lowStock ? "ring-1 ring-amber-300" : ""}`}>
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-neutral-900">{item.name}</h3>
                    {item.location && <p className="text-xs text-neutral-500">{item.location}</p>}
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="text-neutral-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge label={item.category.charAt(0) + item.category.slice(1).toLowerCase()} color={CATEGORY_COLORS[item.category] ?? "neutral"} />
                  {item.quantity != null && (
                    <Badge label={`${item.quantity}${item.unit ? ` ${item.unit}` : ""}`} color={lowStock ? "red" : "green"} />
                  )}
                  {item.condition && (
                    <Badge label={item.condition.replace("_", " ")} color={item.condition === "NEEDS_REPAIR" ? "red" : "neutral"} />
                  )}
                </div>
                {lowStock && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                    <AlertTriangle className="h-3 w-3" /> Low stock
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
