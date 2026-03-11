import { useQuery, getPlantById } from "wasp/client/operations"
import { Link, useParams } from "react-router"
import {
  ArrowLeft,
  Sun,
  Droplets,
  Ruler,
  Clock,
  Leaf,
  Thermometer,
  Grid3X3,
  Sprout,
  Users,
} from "lucide-react"

const categoryLabels: Record<string, string> = {
  VEGETABLE: "Vegetable",
  FRUIT: "Fruit",
  HERB: "Herb",
  FLOWER: "Flower",
  TREE: "Tree",
  SHRUB: "Shrub",
  COVER_CROP: "Cover Crop",
  GRASS: "Grass",
}

const sunLabels: Record<string, string> = {
  FULL_SUN: "Full Sun",
  PARTIAL_SUN: "Partial Sun",
  PARTIAL_SHADE: "Partial Shade",
  FULL_SHADE: "Full Shade",
}

const waterLabels: Record<string, string> = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
}

const seasonLabels: Record<string, string> = {
  COOL: "Cool Season",
  WARM: "Warm Season",
}

export function PlantDetailPage() {
  const { plantId } = useParams()
  const { data: plant, isLoading, error } = useQuery(getPlantById, {
    id: plantId!,
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

  if (error || !plant) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Sprout className="mb-4 h-12 w-12 text-neutral-300" />
          <p className="text-neutral-500">Plant not found</p>
          <Link
            to="/plants"
            className="btn-secondary mt-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Plants
          </Link>
        </div>
      </div>
    )
  }

  const companions = [
    ...(plant.companionsA ?? []).map((c: any) => ({
      plant: c.plantB,
      type: c.type,
      notes: c.notes,
    })),
    ...(plant.companionsB ?? []).map((c: any) => ({
      plant: c.plantA,
      type: c.type,
      notes: c.notes,
    })),
  ]

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/plants"
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Plants
        </Link>

        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ backgroundColor: plant.sqftColor ?? "#22c55e" }}
          >
            {plant.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="page-title">{plant.name}</h1>
            {plant.scientificName && (
              <p className="mt-0.5 text-sm italic text-neutral-500">
                {plant.scientificName}
              </p>
            )}
            {plant.variety && (
              <p className="mt-0.5 text-sm text-neutral-500">
                Variety: {plant.variety}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                {categoryLabels[plant.category] ?? plant.category}
              </span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {plant.lifecycle.toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Growing Info */}
        <div className="card p-5">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">
            Growing Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {plant.sunRequirement && (
              <InfoItem
                icon={<Sun className="h-4 w-4 text-accent-500" />}
                label="Sun"
                value={sunLabels[plant.sunRequirement] ?? plant.sunRequirement}
              />
            )}
            {plant.waterNeed && (
              <InfoItem
                icon={<Droplets className="h-4 w-4 text-blue-500" />}
                label="Water"
                value={waterLabels[plant.waterNeed] ?? plant.waterNeed}
              />
            )}
            {plant.seasonType && (
              <InfoItem
                icon={<Thermometer className="h-4 w-4 text-orange-500" />}
                label="Season"
                value={seasonLabels[plant.seasonType] ?? plant.seasonType}
              />
            )}
            {plant.daysToMaturity != null && (
              <InfoItem
                icon={<Clock className="h-4 w-4 text-primary-500" />}
                label="Days to Maturity"
                value={`${plant.daysToMaturity} days`}
              />
            )}
            {plant.daysToGermination != null && (
              <InfoItem
                icon={<Sprout className="h-4 w-4 text-primary-400" />}
                label="Days to Germinate"
                value={`${plant.daysToGermination} days`}
              />
            )}
            {plant.spacingInches != null && (
              <InfoItem
                icon={<Ruler className="h-4 w-4 text-earth-500" />}
                label="Spacing"
                value={`${plant.spacingInches}" apart`}
              />
            )}
            {plant.rowSpacingInches != null && (
              <InfoItem
                icon={<Ruler className="h-4 w-4 text-earth-400" />}
                label="Row Spacing"
                value={`${plant.rowSpacingInches}"`}
              />
            )}
            {plant.plantDepthInches != null && (
              <InfoItem
                icon={<Ruler className="h-4 w-4 text-earth-600" />}
                label="Plant Depth"
                value={`${plant.plantDepthInches}"`}
              />
            )}
            {plant.plantHeightInches != null && (
              <InfoItem
                icon={<Ruler className="h-4 w-4 text-earth-300" />}
                label="Height"
                value={`${plant.plantHeightInches}"`}
              />
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="card p-5">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">
            Schedule (relative to frost date)
          </h2>
          <div className="space-y-3">
            {plant.startIndoorWeeks != null && (
              <ScheduleRow
                label="Start Indoor"
                weeks={plant.startIndoorWeeks}
                color="bg-primary-500"
              />
            )}
            {plant.transplantWeeks != null && (
              <ScheduleRow
                label="Transplant"
                weeks={plant.transplantWeeks}
                color="bg-blue-500"
              />
            )}
            {plant.directSowWeeks != null && (
              <ScheduleRow
                label="Direct Sow"
                weeks={plant.directSowWeeks}
                color="bg-earth-500"
              />
            )}
            {plant.harvestRelativeWeeks != null && (
              <ScheduleRow
                label="Harvest"
                weeks={plant.harvestRelativeWeeks}
                color="bg-amber-500"
              />
            )}
            {plant.startIndoorWeeks == null &&
              plant.transplantWeeks == null &&
              plant.directSowWeeks == null &&
              plant.harvestRelativeWeeks == null && (
                <p className="text-sm text-neutral-400">
                  No schedule data available
                </p>
              )}
          </div>
        </div>

        {/* Square Foot Info */}
        <div className="card p-5">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">
            Square Foot Gardening
          </h2>
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-neutral-200 text-lg font-bold text-white"
              style={{ backgroundColor: plant.sqftColor ?? "#22c55e" }}
            >
              {plant.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              {plant.plantsPerSqFt != null ? (
                <div className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm text-neutral-700">
                    <strong>{plant.plantsPerSqFt}</strong> plants per square foot
                  </span>
                </div>
              ) : (
                <p className="text-sm text-neutral-400">
                  No density data available
                </p>
              )}
              {plant.sqftColor && (
                <div className="mt-1 flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded border border-neutral-200"
                    style={{ backgroundColor: plant.sqftColor }}
                  />
                  <span className="text-sm text-neutral-500">
                    {plant.sqftColor}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Companion Plants */}
        {companions.length > 0 && (
          <div className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <Users className="h-5 w-5 text-neutral-400" />
              Companion Plants
            </h2>
            <div className="space-y-2">
              {companions.map((comp: any, idx: number) => (
                <Link
                  key={idx}
                  to={`/plants/${comp.plant.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-neutral-50"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded text-xs font-bold text-white"
                    style={{
                      backgroundColor: comp.plant.sqftColor ?? "#22c55e",
                    }}
                  >
                    {comp.plant.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-800">
                      {comp.plant.name}
                    </p>
                    {comp.notes && (
                      <p className="text-xs text-neutral-400">{comp.notes}</p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      comp.type === "BENEFICIAL"
                        ? "bg-primary-100 text-primary-700"
                        : comp.type === "HARMFUL"
                          ? "bg-red-100 text-red-700"
                          : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {comp.type.toLowerCase()}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Traits */}
      <div className="mt-6">
        <div className="card p-5">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">
            Traits
          </h2>
          <div className="flex flex-wrap gap-2">
            {plant.isEdible && <TraitBadge label="Edible" active />}
            {plant.isMedicinal && <TraitBadge label="Medicinal" active />}
            {plant.isNitrogenFixer && (
              <TraitBadge label="Nitrogen Fixer" active />
            )}
            {plant.isDynamicAccumulator && (
              <TraitBadge label="Dynamic Accumulator" active />
            )}
            {plant.attractsPollinators && (
              <TraitBadge label="Attracts Pollinators" active />
            )}
            {plant.deerResistant && (
              <TraitBadge label="Deer Resistant" active />
            )}
            {plant.permLayer && (
              <span className="rounded-full bg-earth-100 px-2.5 py-0.5 text-xs font-medium text-earth-700">
                {plant.permLayer.replace("_", " ").toLowerCase()} layer
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-neutral-400">{label}</p>
        <p className="text-sm font-medium text-neutral-800">{value}</p>
      </div>
    </div>
  )
}

function ScheduleRow({
  label,
  weeks,
  color,
}: {
  label: string
  weeks: number
  color: string
}) {
  const direction = weeks < 0 ? "before" : "after"
  const absWeeks = Math.abs(weeks)

  return (
    <div className="flex items-center gap-3">
      <div className={`h-3 w-3 rounded-full ${color}`} />
      <span className="w-28 text-sm font-medium text-neutral-700">
        {label}
      </span>
      <span className="text-sm text-neutral-500">
        {absWeeks} week{absWeeks !== 1 ? "s" : ""} {direction} last frost
      </span>
    </div>
  )
}

function TraitBadge({ label, active }: { label: string; active: boolean }) {
  if (!active) return null
  return (
    <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
      {label}
    </span>
  )
}
