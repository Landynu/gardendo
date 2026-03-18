import {
  useQuery,
  getProperties,
  getZones,
  getSoilTests,
  getAmendmentLogs,
  createSoilTest,
  createAmendmentLog,
} from "wasp/client/operations"
import { useState } from "react"
import { Mountain, FlaskConical, Droplets, Leaf, Sprout } from "lucide-react"
import { PageHeader } from "../components/ui/PageHeader"
import { Badge } from "../components/ui/Badge"
import { EmptyState } from "../components/ui/EmptyState"
import { QuickLogForm } from "../components/ui/QuickLogForm"
import { FormField } from "../components/ui/FormField"
import { INPUT_CLASS, SELECT_CLASS } from "../lib/styles"
import { format } from "date-fns"

function phColor(ph: number): "red" | "amber" | "green" | "blue" {
  if (ph < 5.5) return "red"
  if (ph < 6.0) return "amber"
  if (ph <= 7.5) return "green"
  return "blue"
}

function levelLabel(val: number | null): string {
  if (val == null) return "—"
  if (val < 3) return "Low"
  if (val < 7) return "Medium"
  return "High"
}

function levelColor(val: number | null): "red" | "amber" | "green" | "neutral" {
  if (val == null) return "neutral"
  if (val < 3) return "red"
  if (val < 7) return "amber"
  return "green"
}

export function SoilPage() {
  const { data: properties, isLoading: propsLoading } = useQuery(getProperties)
  const property = properties?.[0]

  const { data: zones } = useQuery(
    getZones,
    property ? { propertyId: property.id } : undefined,
    { enabled: !!property }
  )

  const [bedFilter, setBedFilter] = useState("")

  const { data: soilTests, isLoading: testsLoading } = useQuery(
    getSoilTests,
    property
      ? { propertyId: property.id, bedId: bedFilter || undefined }
      : undefined,
    { enabled: !!property }
  )

  const { data: amendments, isLoading: amendsLoading } = useQuery(
    getAmendmentLogs,
    property
      ? { propertyId: property.id, bedId: bedFilter || undefined }
      : undefined,
    { enabled: !!property }
  )

  const [showSoilTest, setShowSoilTest] = useState(false)
  const [showAmendment, setShowAmendment] = useState(false)
  const [saving, setSaving] = useState(false)

  // Soil test form
  const [testDate, setTestDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [testBedId, setTestBedId] = useState("")
  const [testPh, setTestPh] = useState("")
  const [testN, setTestN] = useState("")
  const [testP, setTestP] = useState("")
  const [testK, setTestK] = useState("")
  const [testOM, setTestOM] = useState("")
  const [testTexture, setTestTexture] = useState("")
  const [testNotes, setTestNotes] = useState("")

  // Amendment form
  const [amendDate, setAmendDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [amendBedId, setAmendBedId] = useState("")
  const [amendName, setAmendName] = useState("")
  const [amendQty, setAmendQty] = useState("")
  const [amendArea, setAmendArea] = useState("")
  const [amendNotes, setAmendNotes] = useState("")

  // Flatten beds from zones
  const allBeds = (zones ?? []).flatMap((z: any) =>
    (z.gardenBeds ?? []).map((b: any) => ({ id: b.id, name: `${z.name} — ${b.name}` }))
  )

  const isLoading = propsLoading || testsLoading || amendsLoading

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

  async function handleSoilTest() {
    if (!property) return
    setSaving(true)
    try {
      await createSoilTest({
        propertyId: property.id,
        bedId: testBedId || undefined,
        date: testDate,
        ph: testPh ? parseFloat(testPh) : undefined,
        nitrogen: testN ? parseFloat(testN) : undefined,
        phosphorus: testP ? parseFloat(testP) : undefined,
        potassium: testK ? parseFloat(testK) : undefined,
        organicMatter: testOM ? parseFloat(testOM) : undefined,
        texture: testTexture || undefined,
        notes: testNotes || undefined,
      })
      setTestPh(""); setTestN(""); setTestP(""); setTestK(""); setTestOM("")
      setTestTexture(""); setTestNotes("")
      setShowSoilTest(false)
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  async function handleAmendment() {
    if (!property || !amendName.trim()) return
    setSaving(true)
    try {
      await createAmendmentLog({
        propertyId: property.id,
        bedId: amendBedId || undefined,
        date: amendDate,
        amendment: amendName.trim(),
        quantityLbs: amendQty ? parseFloat(amendQty) : undefined,
        areaSqFt: amendArea ? parseFloat(amendArea) : undefined,
        notes: amendNotes || undefined,
      })
      setAmendName(""); setAmendQty(""); setAmendArea(""); setAmendNotes("")
      setShowAmendment(false)
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  return (
    <div className="page-container">
      <PageHeader title="Soil Health">
        <button onClick={() => setShowAmendment(!showAmendment)} className="btn-secondary">
          <Droplets className="h-4 w-4" /> Log Amendment
        </button>
        <button onClick={() => setShowSoilTest(!showSoilTest)} className="btn-primary">
          <FlaskConical className="h-4 w-4" /> Log Soil Test
        </button>
      </PageHeader>

      {/* Bed filter */}
      <div className="mb-6">
        <select value={bedFilter} onChange={(e) => setBedFilter(e.target.value)} className={`${SELECT_CLASS} sm:max-w-xs`}>
          <option value="">All Beds</option>
          {allBeds.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* Soil Test Form */}
      <QuickLogForm title="Log Soil Test" open={showSoilTest} onToggle={() => setShowSoilTest(!showSoilTest)} onSubmit={handleSoilTest} saving={saving}>
        <FormField label="Date">
          <input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Bed">
          <select value={testBedId} onChange={(e) => setTestBedId(e.target.value)} className={SELECT_CLASS}>
            <option value="">Property-wide</option>
            {allBeds.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </FormField>
        <FormField label="pH">
          <input type="number" step="0.1" value={testPh} onChange={(e) => setTestPh(e.target.value)} placeholder="e.g. 6.5" className={INPUT_CLASS} />
        </FormField>
        <FormField label="Nitrogen (0-10)">
          <input type="number" step="0.1" value={testN} onChange={(e) => setTestN(e.target.value)} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Phosphorus (0-10)">
          <input type="number" step="0.1" value={testP} onChange={(e) => setTestP(e.target.value)} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Potassium (0-10)">
          <input type="number" step="0.1" value={testK} onChange={(e) => setTestK(e.target.value)} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Organic Matter (%)">
          <input type="number" step="0.1" value={testOM} onChange={(e) => setTestOM(e.target.value)} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Texture">
          <select value={testTexture} onChange={(e) => setTestTexture(e.target.value)} className={SELECT_CLASS}>
            <option value="">Select...</option>
            <option value="sand">Sand</option>
            <option value="loamy sand">Loamy Sand</option>
            <option value="sandy loam">Sandy Loam</option>
            <option value="loam">Loam</option>
            <option value="silt loam">Silt Loam</option>
            <option value="clay loam">Clay Loam</option>
            <option value="clay">Clay</option>
          </select>
        </FormField>
        <FormField label="Notes">
          <input type="text" value={testNotes} onChange={(e) => setTestNotes(e.target.value)} className={INPUT_CLASS} />
        </FormField>
      </QuickLogForm>

      {/* Amendment Form */}
      <QuickLogForm title="Log Amendment" open={showAmendment} onToggle={() => setShowAmendment(!showAmendment)} onSubmit={handleAmendment} saving={saving}>
        <FormField label="Date">
          <input type="date" value={amendDate} onChange={(e) => setAmendDate(e.target.value)} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Bed">
          <select value={amendBedId} onChange={(e) => setAmendBedId(e.target.value)} className={SELECT_CLASS}>
            <option value="">Property-wide</option>
            {allBeds.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </FormField>
        <FormField label="Amendment" required>
          <input type="text" value={amendName} onChange={(e) => setAmendName(e.target.value)} placeholder="e.g. Bone meal, Compost" className={INPUT_CLASS} />
        </FormField>
        <FormField label="Quantity (lbs)">
          <input type="number" step="0.1" value={amendQty} onChange={(e) => setAmendQty(e.target.value)} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Area (sq ft)">
          <input type="number" value={amendArea} onChange={(e) => setAmendArea(e.target.value)} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Notes">
          <input type="text" value={amendNotes} onChange={(e) => setAmendNotes(e.target.value)} className={INPUT_CLASS} />
        </FormField>
      </QuickLogForm>

      {/* Soil Tests */}
      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-800">
          <FlaskConical className="h-5 w-5 text-earth-500" />
          Soil Tests
        </h2>
        {(soilTests ?? []).length === 0 ? (
          <EmptyState icon={FlaskConical} message="No soil tests yet" subtext="Log a soil test to start tracking pH and nutrients." actionLabel="Log Test" onAction={() => setShowSoilTest(true)} />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Bed</th>
                  <th className="px-4 py-2">pH</th>
                  <th className="px-4 py-2">N</th>
                  <th className="px-4 py-2">P</th>
                  <th className="px-4 py-2">K</th>
                  <th className="px-4 py-2">OM%</th>
                  <th className="px-4 py-2">Texture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(soilTests ?? []).map((t: any) => (
                  <tr key={t.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-2 text-neutral-600">{t.date}</td>
                    <td className="px-4 py-2 text-neutral-600">{t.bed?.name ?? "Property"}</td>
                    <td className="px-4 py-2">
                      {t.ph != null ? <Badge label={t.ph.toFixed(1)} color={phColor(t.ph)} /> : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <Badge label={levelLabel(t.nitrogen)} color={levelColor(t.nitrogen)} />
                    </td>
                    <td className="px-4 py-2">
                      <Badge label={levelLabel(t.phosphorus)} color={levelColor(t.phosphorus)} />
                    </td>
                    <td className="px-4 py-2">
                      <Badge label={levelLabel(t.potassium)} color={levelColor(t.potassium)} />
                    </td>
                    <td className="px-4 py-2 text-neutral-600">{t.organicMatter != null ? `${t.organicMatter}%` : "—"}</td>
                    <td className="px-4 py-2 text-neutral-600">{t.texture ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Amendment Logs */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-800">
          <Droplets className="h-5 w-5 text-primary-500" />
          Amendment Log
        </h2>
        {(amendments ?? []).length === 0 ? (
          <EmptyState icon={Droplets} message="No amendments logged" subtext="Track soil amendments like compost, lime, or bone meal." actionLabel="Log Amendment" onAction={() => setShowAmendment(true)} />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Bed</th>
                  <th className="px-4 py-2">Amendment</th>
                  <th className="px-4 py-2">Qty (lbs)</th>
                  <th className="px-4 py-2">Area (sq ft)</th>
                  <th className="px-4 py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(amendments ?? []).map((a: any) => (
                  <tr key={a.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-2 text-neutral-600">{a.date}</td>
                    <td className="px-4 py-2 text-neutral-600">{a.bed?.name ?? "Property"}</td>
                    <td className="px-4 py-2 font-medium text-neutral-900">{a.amendment}</td>
                    <td className="px-4 py-2 text-neutral-600">{a.quantityLbs ?? "—"}</td>
                    <td className="px-4 py-2 text-neutral-600">{a.areaSqFt ?? "—"}</td>
                    <td className="px-4 py-2 text-neutral-500">{a.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
