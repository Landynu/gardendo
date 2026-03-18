import {
  useQuery,
  getProperties,
  getAnimalGroupById,
  createAnimal,
  createHealthRecord,
  createEggLog,
} from "wasp/client/operations"
import { useParams, Link } from "react-router"
import { useState } from "react"
import {
  Bird,
  Plus,
  Egg,
  Heart,
  ArrowLeft,
  Leaf,
} from "lucide-react"
import { PageHeader } from "../components/ui/PageHeader"
import { Badge } from "../components/ui/Badge"
import { QuickLogForm } from "../components/ui/QuickLogForm"
import { FormField } from "../components/ui/FormField"
import { INPUT_CLASS } from "../lib/styles"
import { format } from "date-fns"

export function AnimalGroupDetailPage() {
  const { groupId } = useParams()
  const { data: properties } = useQuery(getProperties)
  const property = properties?.[0]

  const { data: group, isLoading } = useQuery(
    getAnimalGroupById,
    property && groupId ? { groupId, propertyId: property.id } : undefined,
    { enabled: !!property && !!groupId }
  )

  const [showAddAnimal, setShowAddAnimal] = useState(false)
  const [showEggLog, setShowEggLog] = useState(false)
  const [showHealthRecord, setShowHealthRecord] = useState(false)
  const [saving, setSaving] = useState(false)

  // Add animal form
  const [animalName, setAnimalName] = useState("")
  const [animalBreed, setAnimalBreed] = useState("")

  // Egg log form
  const [eggDate, setEggDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [eggCount, setEggCount] = useState("")

  // Health record form
  const [healthAnimalId, setHealthAnimalId] = useState("")
  const [healthDate, setHealthDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [healthDescription, setHealthDescription] = useState("")
  const [healthTreatment, setHealthTreatment] = useState("")

  if (isLoading || !property) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-20">
          <Leaf className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </div>
    )
  }

  if (!group) return <div className="page-container">Group not found.</div>

  async function handleAddAnimal() {
    if (!property || !groupId) return
    setSaving(true)
    try {
      await createAnimal({
        propertyId: property.id,
        groupId,
        name: animalName.trim() || undefined,
        breed: animalBreed.trim() || undefined,
      })
      setAnimalName("")
      setAnimalBreed("")
      setShowAddAnimal(false)
    } catch (err) {
      console.error("Failed to add animal:", err)
    } finally {
      setSaving(false)
    }
  }

  async function handleEggLog() {
    if (!property || !groupId || !eggCount) return
    setSaving(true)
    try {
      await createEggLog({
        propertyId: property.id,
        groupId,
        date: eggDate,
        count: parseInt(eggCount),
      })
      setEggCount("")
      setShowEggLog(false)
    } catch (err) {
      console.error("Failed to log eggs:", err)
    } finally {
      setSaving(false)
    }
  }

  async function handleHealthRecord() {
    if (!property || !healthAnimalId || !healthDescription.trim()) return
    setSaving(true)
    try {
      await createHealthRecord({
        propertyId: property.id,
        animalId: healthAnimalId,
        date: healthDate,
        description: healthDescription.trim(),
        treatment: healthTreatment.trim() || undefined,
      })
      setHealthDescription("")
      setHealthTreatment("")
      setShowHealthRecord(false)
    } catch (err) {
      console.error("Failed to add health record:", err)
    } finally {
      setSaving(false)
    }
  }

  const activeAnimals = group.animals.filter((a: any) => a.isActive)

  return (
    <div className="page-container">
      <PageHeader title={group.name}>
        <Link to="/animals" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </PageHeader>

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge
          label={group.animalType.charAt(0) + group.animalType.slice(1).toLowerCase()}
          color="amber"
        />
        <Badge label={`${activeAnimals.length} active`} color="green" />
        {group.notes && <span className="text-sm text-neutral-500">{group.notes}</span>}
      </div>

      {/* Action buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setShowAddAnimal(!showAddAnimal)} className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> Add Animal
        </button>
        <button onClick={() => setShowEggLog(!showEggLog)} className="btn-secondary text-sm">
          <Egg className="h-4 w-4" /> Log Eggs
        </button>
        <button onClick={() => setShowHealthRecord(!showHealthRecord)} className="btn-secondary text-sm">
          <Heart className="h-4 w-4" /> Health Record
        </button>
      </div>

      {/* Add Animal Form */}
      <QuickLogForm title="Add Animal" open={showAddAnimal} onToggle={() => setShowAddAnimal(!showAddAnimal)} onSubmit={handleAddAnimal} saving={saving}>
        <FormField label="Name">
          <input type="text" value={animalName} onChange={(e) => setAnimalName(e.target.value)} placeholder="Optional name" className={INPUT_CLASS} />
        </FormField>
        <FormField label="Breed">
          <input type="text" value={animalBreed} onChange={(e) => setAnimalBreed(e.target.value)} placeholder="e.g. Rhode Island Red" className={INPUT_CLASS} />
        </FormField>
      </QuickLogForm>

      {/* Egg Log Form */}
      <QuickLogForm title="Log Eggs" open={showEggLog} onToggle={() => setShowEggLog(!showEggLog)} onSubmit={handleEggLog} saving={saving}>
        <FormField label="Date">
          <input type="date" value={eggDate} onChange={(e) => setEggDate(e.target.value)} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Count" required>
          <input type="number" value={eggCount} onChange={(e) => setEggCount(e.target.value)} placeholder="e.g. 8" className={INPUT_CLASS} />
        </FormField>
      </QuickLogForm>

      {/* Health Record Form */}
      <QuickLogForm title="Add Health Record" open={showHealthRecord} onToggle={() => setShowHealthRecord(!showHealthRecord)} onSubmit={handleHealthRecord} saving={saving}>
        <FormField label="Animal" required>
          <select value={healthAnimalId} onChange={(e) => setHealthAnimalId(e.target.value)} className={INPUT_CLASS}>
            <option value="">Select animal...</option>
            {group.animals.map((a: any) => (
              <option key={a.id} value={a.id}>{a.name ?? `Unnamed (${a.breed ?? "unknown breed"})`}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Date">
          <input type="date" value={healthDate} onChange={(e) => setHealthDate(e.target.value)} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Description" required>
          <input type="text" value={healthDescription} onChange={(e) => setHealthDescription(e.target.value)} placeholder="e.g. Limping on right leg" className={INPUT_CLASS} />
        </FormField>
        <FormField label="Treatment">
          <input type="text" value={healthTreatment} onChange={(e) => setHealthTreatment(e.target.value)} placeholder="Optional treatment given" className={INPUT_CLASS} />
        </FormField>
      </QuickLogForm>

      {/* Animals List */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-neutral-800">
          <Bird className="mr-2 inline h-5 w-5 text-primary-600" />
          Animals ({activeAnimals.length})
        </h2>
        {activeAnimals.length === 0 ? (
          <p className="text-sm text-neutral-500">No animals in this group yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeAnimals.map((animal: any) => (
              <div key={animal.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-800">
                    {animal.name ?? "Unnamed"}
                  </span>
                  {animal.breed && <Badge label={animal.breed} color="neutral" />}
                </div>
                {animal.dateOfBirth && (
                  <p className="mt-1 text-xs text-neutral-500">Born: {animal.dateOfBirth}</p>
                )}
                {animal.healthRecords.length > 0 && (
                  <p className="mt-1 text-xs text-neutral-500">
                    Last health: {animal.healthRecords[0].date} — {animal.healthRecords[0].description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Egg Log History */}
      {group.eggLogs.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-neutral-800">
            <Egg className="mr-2 inline h-5 w-5 text-amber-500" />
            Egg Log (last 30 days)
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Count</th>
                  <th className="px-4 py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {group.eggLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-2 text-neutral-600">{log.date}</td>
                    <td className="px-4 py-2 font-medium text-neutral-900">{log.count}</td>
                    <td className="px-4 py-2 text-neutral-500">{log.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
