import {
  useQuery,
  getPlantById,
  getProperties,
  getPlantPhotos,
} from "wasp/client/operations"
import { Link, useParams } from "react-router"
import { useState } from "react"
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
  Camera,
  ImageIcon,
} from "lucide-react"
import { PhotoUpload } from "../components/PhotoUpload"

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

const dataSourceLabels: Record<string, string> = {
  SEED: "Seed Data",
  OPENFARM: "OpenFarm",
  USER: "User Added",
}

export function PlantDetailPage() {
  const { plantId } = useParams()
  const { data: plant, isLoading, error } = useQuery(getPlantById, {
    id: plantId!,
  })
  const { data: properties } = useQuery(getProperties)
  const { data: photos, refetch: refetchPhotos } = useQuery(
    getPlantPhotos,
    plantId ? { plantId } : undefined
  )
  const [photoTab, setPhotoTab] = useState<"yours" | "stock">("yours")

  const property = properties?.[0]

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
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
                {dataSourceLabels[plant.dataSource] ?? plant.dataSource}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Photos Section */}
      <div className="mb-6">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-4">
            <h2 className="text-lg font-semibold text-neutral-900">Photos</h2>
            <div className="flex rounded-lg bg-neutral-100 p-0.5">
              <button
                onClick={() => setPhotoTab("yours")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  photoTab === "yours"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                Your Photos
                {photos && photos.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary-100 px-1.5 text-xs text-primary-700">
                    {photos.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setPhotoTab("stock")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  photoTab === "stock"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Stock Image
              </button>
            </div>
          </div>

          {photoTab === "yours" ? (
            <div>
              {/* Photo Gallery */}
              {photos && photos.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {photos.map((photo: any) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-square overflow-hidden rounded-lg bg-neutral-100"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || plant.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      {photo.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-xs text-white">{photo.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload */}
              {property && (
                <PhotoUpload
                  propertyId={property.id}
                  plantId={plantId}
                  onUploaded={() => refetchPhotos()}
                />
              )}

              {!property && (
                <p className="text-sm text-neutral-400">
                  Create a property in Settings to upload photos.
                </p>
              )}
            </div>
          ) : (
            <div>
              {plant.imageUrl ? (
                <div className="flex justify-center">
                  <img
                    src={plant.imageUrl}
                    alt={plant.name}
                    className="max-h-80 rounded-lg object-contain"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ImageIcon className="mb-2 h-10 w-10 text-neutral-300" />
                  <p className="text-sm text-neutral-400">
                    No stock image available
                  </p>
                  {plant.dataSource !== "OPENFARM" && (
                    <p className="mt-1 text-xs text-neutral-400">
                      Import from OpenFarm to get a reference image
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
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
            {plant.isEdible && <TraitBadge label="Edible" />}
            {plant.isMedicinal && <TraitBadge label="Medicinal" />}
            {plant.isNitrogenFixer && <TraitBadge label="Nitrogen Fixer" />}
            {plant.isDynamicAccumulator && (
              <TraitBadge label="Dynamic Accumulator" />
            )}
            {plant.attractsPollinators && (
              <TraitBadge label="Attracts Pollinators" />
            )}
            {plant.deerResistant && <TraitBadge label="Deer Resistant" />}
            {plant.permLayer && (
              <span className="rounded-full bg-earth-100 px-2.5 py-0.5 text-xs font-medium text-earth-700">
                {plant.permLayer.replace("_", " ").toLowerCase()} layer
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {plant.notes && (
        <div className="mt-6">
          <div className="card p-5">
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              Notes
            </h2>
            <p className="whitespace-pre-wrap text-sm text-neutral-600">
              {plant.notes}
            </p>
          </div>
        </div>
      )}
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

function TraitBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
      {label}
    </span>
  )
}
