import {
  type CreatePlant,
  type UpdatePlant,
  type SearchOpenFarm,
  type ImportFromOpenFarm,
} from "wasp/server/operations"
import { type Plant } from "wasp/entities"
import { HttpError } from "wasp/server"

type CreatePlantArgs = {
  name: string
  scientificName?: string
  variety?: string
  category: string
  lifecycle: string
  hardinessZoneMin?: string
  hardinessZoneMax?: string
  sunRequirement?: string
  waterNeed?: string
  seasonType?: string
  daysToMaturity?: number
  daysToGermination?: number
  plantDepthInches?: number
  spacingInches?: number
  rowSpacingInches?: number
  plantHeightInches?: number
  startIndoorWeeks?: number
  transplantWeeks?: number
  directSowWeeks?: number
  harvestRelativeWeeks?: number
  plantsPerSqFt?: number
  sqftColor?: string
  permLayer?: string
  isNitrogenFixer?: boolean
  isDynamicAccumulator?: boolean
  isEdible?: boolean
  isMedicinal?: boolean
  attractsPollinators?: boolean
  deerResistant?: boolean
  notes?: string
  imageUrl?: string
}

export const createPlant: CreatePlant<CreatePlantArgs, Plant> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)

  return context.entities.Plant.create({
    data: {
      name: args.name,
      scientificName: args.scientificName,
      variety: args.variety,
      category: args.category as any,
      lifecycle: args.lifecycle as any,
      hardinessZoneMin: args.hardinessZoneMin,
      hardinessZoneMax: args.hardinessZoneMax,
      sunRequirement: args.sunRequirement as any,
      waterNeed: args.waterNeed as any,
      seasonType: args.seasonType as any,
      daysToMaturity: args.daysToMaturity,
      daysToGermination: args.daysToGermination,
      plantDepthInches: args.plantDepthInches,
      spacingInches: args.spacingInches,
      rowSpacingInches: args.rowSpacingInches,
      plantHeightInches: args.plantHeightInches,
      startIndoorWeeks: args.startIndoorWeeks,
      transplantWeeks: args.transplantWeeks,
      directSowWeeks: args.directSowWeeks,
      harvestRelativeWeeks: args.harvestRelativeWeeks,
      plantsPerSqFt: args.plantsPerSqFt,
      sqftColor: args.sqftColor,
      permLayer: args.permLayer as any,
      isNitrogenFixer: args.isNitrogenFixer,
      isDynamicAccumulator: args.isDynamicAccumulator,
      isEdible: args.isEdible,
      isMedicinal: args.isMedicinal,
      attractsPollinators: args.attractsPollinators,
      deerResistant: args.deerResistant,
      notes: args.notes,
      imageUrl: args.imageUrl,
      dataSource: "USER",
    },
  })
}

type UpdatePlantArgs = {
  id: string
  name?: string
  scientificName?: string
  variety?: string
  category?: string
  lifecycle?: string
  hardinessZoneMin?: string
  hardinessZoneMax?: string
  sunRequirement?: string
  waterNeed?: string
  seasonType?: string
  daysToMaturity?: number
  daysToGermination?: number
  plantDepthInches?: number
  spacingInches?: number
  rowSpacingInches?: number
  plantHeightInches?: number
  startIndoorWeeks?: number
  transplantWeeks?: number
  directSowWeeks?: number
  harvestRelativeWeeks?: number
  plantsPerSqFt?: number
  sqftColor?: string
  permLayer?: string
  isNitrogenFixer?: boolean
  isDynamicAccumulator?: boolean
  isEdible?: boolean
  isMedicinal?: boolean
  attractsPollinators?: boolean
  deerResistant?: boolean
  notes?: string
  imageUrl?: string
}

export const updatePlant: UpdatePlant<UpdatePlantArgs, Plant> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)

  const { id, ...data } = args

  return context.entities.Plant.update({
    where: { id },
    data: {
      ...data,
      category: data.category as any,
      lifecycle: data.lifecycle as any,
      sunRequirement: data.sunRequirement as any,
      waterNeed: data.waterNeed as any,
      seasonType: data.seasonType as any,
      permLayer: data.permLayer as any,
      isUserEdited: true,
    },
  })
}

// ─── OPENFARM API ──────────────────────────

const OPENFARM_API = "https://openfarm.cc/api/v1"

type OpenFarmCropResult = {
  slug: string
  name: string
  binomialName?: string
  description?: string
  sunRequirements?: string
  sowingMethod?: string
  spread?: number
  rowSpacing?: number
  height?: number
  growingDegreeDays?: number
  mainImagePath?: string
  tags: string[]
}

type SearchOpenFarmArgs = {
  query: string
}

export const searchOpenFarm: SearchOpenFarm<
  SearchOpenFarmArgs,
  OpenFarmCropResult[]
> = async (args, context) => {
  if (!context.user) throw new HttpError(401)
  if (!args.query.trim()) return []

  const res = await fetch(
    `${OPENFARM_API}/crops?filter=${encodeURIComponent(args.query.trim())}`
  )

  if (!res.ok) throw new HttpError(502, "OpenFarm API unavailable")

  const json = await res.json()
  const crops = json.data ?? []

  return crops.slice(0, 20).map((crop: any) => {
    const attrs = crop.attributes ?? {}
    return {
      slug: attrs.slug ?? crop.id,
      name: attrs.name ?? "Unknown",
      binomialName: attrs.binomial_name || undefined,
      description: attrs.description || undefined,
      sunRequirements: attrs.sun_requirements || undefined,
      sowingMethod: attrs.sowing_method || undefined,
      spread: attrs.spread ? Math.round(attrs.spread) : undefined,
      rowSpacing: attrs.row_spacing ? Math.round(attrs.row_spacing) : undefined,
      height: attrs.height ? Math.round(attrs.height) : undefined,
      growingDegreeDays: attrs.growing_degree_days || undefined,
      mainImagePath: attrs.main_image_path || undefined,
      tags: attrs.tags_array ?? [],
    }
  })
}

type ImportFromOpenFarmArgs = {
  slug: string
}

export const importFromOpenFarm: ImportFromOpenFarm<
  ImportFromOpenFarmArgs,
  Plant
> = async (args, context) => {
  if (!context.user) throw new HttpError(401)

  // Check if already imported
  const existing = await context.entities.Plant.findFirst({
    where: { openFarmSlug: args.slug },
  })
  if (existing) return existing

  // Fetch full crop details
  const res = await fetch(`${OPENFARM_API}/crops/${encodeURIComponent(args.slug)}`)
  if (!res.ok) throw new HttpError(502, "OpenFarm API unavailable")

  const json = await res.json()
  const attrs = json.data?.attributes ?? {}

  // Map OpenFarm sun_requirements to our enum
  const sunMap: Record<string, string> = {
    "Full Sun": "FULL_SUN",
    "Partial Sun": "PARTIAL_SUN",
    "Partial Shade": "PARTIAL_SHADE",
    "Full Shade": "FULL_SHADE",
  }

  // Guess category from tags
  const tags: string[] = (attrs.tags_array ?? []).map((t: string) =>
    t.toLowerCase()
  )
  let category = "VEGETABLE"
  if (tags.includes("fruit") || tags.includes("fruits")) category = "FRUIT"
  else if (tags.includes("herb") || tags.includes("herbs")) category = "HERB"
  else if (tags.includes("flower") || tags.includes("flowers"))
    category = "FLOWER"
  else if (tags.includes("tree") || tags.includes("trees")) category = "TREE"
  else if (tags.includes("shrub") || tags.includes("shrubs")) category = "SHRUB"

  // cm to inches
  const cmToIn = (cm?: number) => (cm ? Math.round(cm / 2.54 * 10) / 10 : undefined)

  return context.entities.Plant.create({
    data: {
      name: attrs.name ?? "Unknown",
      scientificName: attrs.binomial_name || undefined,
      category: category as any,
      lifecycle: "ANNUAL" as any, // OpenFarm doesn't reliably provide this
      sunRequirement: (sunMap[attrs.sun_requirements] as any) || undefined,
      spacingInches: cmToIn(attrs.spread),
      rowSpacingInches: cmToIn(attrs.row_spacing),
      plantHeightInches: cmToIn(attrs.height),
      imageUrl: attrs.main_image_path || undefined,
      notes: attrs.description
        ? attrs.description.slice(0, 500)
        : undefined,
      openFarmSlug: args.slug,
      dataSource: "OPENFARM" as any,
      lastSyncedAt: new Date(),
    },
  })
}
