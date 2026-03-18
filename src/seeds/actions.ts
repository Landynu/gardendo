import {
  type CreateSeedInventory,
  type UpdateSeedInventory,
  type DeleteSeedInventory,
  type CreateSeedStartLog,
  type UpdateSeedStartLog,
} from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type CreateSeedInventoryArgs = {
  propertyId: string
  plantId: string
  quantity?: number
  unit?: string
  supplier?: string
  yearPurchased?: number
  expiryYear?: number
  lotNumber?: string
  germinationRate?: number
  storageLocation?: string
  seedSource?: string
  notes?: string
}

export const createSeedInventory: CreateSeedInventory<CreateSeedInventoryArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  return context.entities.SeedInventory.create({
    data: {
      plantId: args.plantId,
      propertyId: args.propertyId,
      quantity: args.quantity,
      unit: args.unit,
      supplier: args.supplier,
      yearPurchased: args.yearPurchased,
      expiryYear: args.expiryYear,
      lotNumber: args.lotNumber,
      germinationRate: args.germinationRate,
      storageLocation: args.storageLocation,
      seedSource: args.seedSource,
      notes: args.notes,
    },
  })
}

type UpdateSeedInventoryArgs = {
  id: string
  propertyId: string
  quantity?: number
  unit?: string
  supplier?: string
  yearPurchased?: number
  expiryYear?: number
  lotNumber?: string
  germinationRate?: number
  storageLocation?: string
  seedSource?: string
  notes?: string
}

export const updateSeedInventory: UpdateSeedInventory<UpdateSeedInventoryArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const { id, propertyId, ...data } = args
  return context.entities.SeedInventory.update({
    where: { id },
    data,
  })
}

type DeleteSeedInventoryArgs = {
  id: string
  propertyId: string
}

export const deleteSeedInventory: DeleteSeedInventory<DeleteSeedInventoryArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  return context.entities.SeedInventory.delete({
    where: { id: args.id },
  })
}

type CreateSeedStartLogArgs = {
  propertyId: string
  seedInventoryId: string
  plantId: string
  date: string
  cellsStarted: number
  medium?: string
  location?: string
  heatMat?: boolean
  lightHours?: number
  notes?: string
}

export const createSeedStartLog: CreateSeedStartLog<CreateSeedStartLogArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  return context.entities.SeedStartLog.create({
    data: {
      date: args.date,
      cellsStarted: args.cellsStarted,
      medium: args.medium,
      location: args.location,
      heatMat: args.heatMat ?? false,
      lightHours: args.lightHours,
      notes: args.notes,
      seedInventoryId: args.seedInventoryId,
      plantId: args.plantId,
      propertyId: args.propertyId,
      userId: context.user.id,
    },
  })
}

type UpdateSeedStartLogArgs = {
  id: string
  propertyId: string
  cellsSprouted?: number
  sproutedDate?: string
  transplantedDate?: string
  notes?: string
}

export const updateSeedStartLog: UpdateSeedStartLog<UpdateSeedStartLogArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const { id, propertyId, ...data } = args
  return context.entities.SeedStartLog.update({
    where: { id },
    data,
  })
}
