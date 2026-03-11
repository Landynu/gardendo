import { type CreatePlant, type UpdatePlant } from "wasp/server/operations"
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
