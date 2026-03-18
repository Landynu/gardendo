import {
  useQuery,
  getProperties,
  getSeedInventory,
  getPlants,
  createSeedInventory,
  deleteSeedInventory,
} from "wasp/client/operations"
import { Link } from "react-router"
import { useState } from "react"
import { Flower2, Plus, Trash2, Sprout, Leaf } from "lucide-react"
import { PageHeader } from "../components/ui/PageHeader"
import { FilterTabs } from "../components/ui/FilterTabs"
import { EmptyState } from "../components/ui/EmptyState"
import { Badge } from "../components/ui/Badge"
import { QuickLogForm } from "../components/ui/QuickLogForm"
import { FormField } from "../components/ui/FormField"
import { INPUT_CLASS, SELECT_CLASS } from "../lib/styles"

const CATEGORY_TABS = [
  { value: "ALL", label: "All" },
  { value: "VEGETABLE", label: "Vegetable" },
  { value: "HERB", label: "Herb" },
  { value: "FLOWER", label: "Flower" },
  { value: "FRUIT", label: "Fruit" },
] as const

const SOURCE_COLORS: Record<string, "green" | "blue" | "purple" | "amber"> = {
  PURCHASED: "blue",
  SAVED: "green",
  TRADED: "purple",
  GIFTED: "amber",
}

export function SeedInventoryPage() {
  const { data: properties, isLoading: propsLoading } = useQuery(getProperties)
  const property = properties?.[0]

  const { data: seeds, isLoading: seedsLoading } = useQuery(
    getSeedInventory,
    property ? { propertyId: property.id } : undefined,
    { enabled: !!property }
  )

  const { data: plants } = useQuery(getPlants)

  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")
  const [search, setSearch] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  // Add form state
  const [newPlantId, setNewPlantId] = useState("")
  const [newQuantity, setNewQuantity] = useState("")
  const [newUnit, setNewUnit] = useState("seeds")
  const [newSupplier, setNewSupplier] = useState("")
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString())
  const [newSource, setNewSource] = useState("")

  const isLoading = propsLoading || seedsLoading

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
          subtext="Create a property in Settings to start tracking seeds."
          actionLabel="Go to Settings"
          actionTo="/settings"
        />
      </div>
    )
  }

  const filtered = (seeds ?? []).filter((s: any) => {
    if (categoryFilter !== "ALL" && s.plant.category !== categoryFilter) return false
    if (search && !s.plant.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function handleAddSeed() {
    if (!newPlantId || !property) return
    setSaving(true)
    try {
      await createSeedInventory({
        propertyId: property.id,
        plantId: newPlantId,
        quantity: newQuantity ? parseInt(newQuantity) : undefined,
        unit: newUnit || undefined,
        supplier: newSupplier || undefined,
        yearPurchased: newYear ? parseInt(newYear) : undefined,
        seedSource: newSource || undefined,
      })
      setNewPlantId("")
      setNewQuantity("")
      setNewUnit("seeds")
      setNewSupplier("")
      setNewSource("")
      setShowAdd(false)
    } catch (err) {
      console.error("Failed to add seed:", err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!property) return
    try {
      await deleteSeedInventory({ id, propertyId: property.id })
    } catch (err) {
      console.error("Failed to delete seed:", err)
    }
  }

  return (
    <div className="page-container">
      <PageHeader title="Seed Inventory">
        <Link to="/seeds/starting" className="btn-secondary">
          <Flower2 className="h-4 w-4" />
          Seed Starting
        </Link>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Seeds
        </button>
      </PageHeader>

      <QuickLogForm
        title="Add Seed Packet"
        open={showAdd}
        onToggle={() => setShowAdd(!showAdd)}
        onSubmit={handleAddSeed}
        saving={saving}
      >
        <FormField label="Plant" required>
          <select
            value={newPlantId}
            onChange={(e) => setNewPlantId(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Select a plant...</option>
            {(plants ?? []).map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.variety ? ` (${p.variety})` : ""}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Quantity">
          <input
            type="number"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            placeholder="e.g. 50"
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Unit">
          <select value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className={SELECT_CLASS}>
            <option value="seeds">Seeds</option>
            <option value="packets">Packets</option>
            <option value="grams">Grams</option>
            <option value="oz">Ounces</option>
          </select>
        </FormField>
        <FormField label="Supplier">
          <input
            type="text"
            value={newSupplier}
            onChange={(e) => setNewSupplier(e.target.value)}
            placeholder="e.g. West Coast Seeds"
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Year Purchased">
          <input
            type="number"
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Source">
          <select value={newSource} onChange={(e) => setNewSource(e.target.value)} className={SELECT_CLASS}>
            <option value="">Select...</option>
            <option value="PURCHASED">Purchased</option>
            <option value="SAVED">Saved</option>
            <option value="TRADED">Traded</option>
            <option value="GIFTED">Gifted</option>
          </select>
        </FormField>
      </QuickLogForm>

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <FilterTabs
          tabs={[...CATEGORY_TABS]}
          active={categoryFilter}
          onChange={setCategoryFilter}
        />
        <input
          type="text"
          placeholder="Search by plant name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${INPUT_CLASS} sm:max-w-xs`}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Flower2}
          message="No seeds in inventory"
          subtext="Add your first seed packet to start tracking."
          actionLabel="Add Seeds"
          onAction={() => setShowAdd(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((seed: any) => (
            <div key={seed.id} className="card p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-neutral-900">
                    {seed.plant.name}
                    {seed.plant.variety && (
                      <span className="ml-1 text-neutral-500">({seed.plant.variety})</span>
                    )}
                  </h3>
                  {seed.supplier && (
                    <p className="text-sm text-neutral-500">{seed.supplier}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(seed.id)}
                  className="text-neutral-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {seed.quantity != null && (
                  <Badge
                    label={`${seed.quantity} ${seed.unit ?? "seeds"}`}
                    color="green"
                  />
                )}
                {seed.yearPurchased && (
                  <Badge label={`${seed.yearPurchased}`} color="neutral" />
                )}
                {seed.expiryYear && (
                  <Badge
                    label={`Exp ${seed.expiryYear}`}
                    color={seed.expiryYear <= new Date().getFullYear() ? "red" : "neutral"}
                  />
                )}
                {seed.germinationRate != null && (
                  <Badge label={`${seed.germinationRate}% germ`} color="blue" />
                )}
                {seed.seedSource && (
                  <Badge
                    label={seed.seedSource.charAt(0) + seed.seedSource.slice(1).toLowerCase()}
                    color={SOURCE_COLORS[seed.seedSource] ?? "neutral"}
                  />
                )}
              </div>

              {seed.storageLocation && (
                <p className="mt-2 text-xs text-neutral-500">
                  Stored: {seed.storageLocation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
