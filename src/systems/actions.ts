import {
  type CreateWaterSystem,
  type CreateWaterLog,
  type CreateCompostBin,
  type CreateCompostLog,
} from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type CreateWaterSystemArgs = {
  propertyId: string
  name: string
  sourceType: string
  capacityGallons?: number
  notes?: string
}

export const createWaterSystem: CreateWaterSystem<CreateWaterSystemArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  return context.entities.WaterSystem.create({
    data: {
      name: args.name,
      sourceType: args.sourceType as any,
      capacityGallons: args.capacityGallons,
      notes: args.notes,
      propertyId: args.propertyId,
    },
  })
}

type CreateWaterLogArgs = {
  propertyId: string
  systemId: string
  date: string
  levelGallons?: number
  usageGallons?: number
  notes?: string
}

export const createWaterLog: CreateWaterLog<CreateWaterLogArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const system = await context.entities.WaterSystem.findUnique({
    where: { id: args.systemId },
  })
  if (!system || system.propertyId !== args.propertyId) throw new HttpError(403)

  return context.entities.WaterLog.create({
    data: {
      date: args.date,
      levelGallons: args.levelGallons,
      usageGallons: args.usageGallons,
      notes: args.notes,
      systemId: args.systemId,
    },
  })
}

type CreateCompostBinArgs = {
  propertyId: string
  name: string
  type?: string
  capacityCuFt?: number
  notes?: string
}

export const createCompostBin: CreateCompostBin<CreateCompostBinArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  return context.entities.CompostBin.create({
    data: {
      name: args.name,
      type: args.type,
      capacityCuFt: args.capacityCuFt,
      notes: args.notes,
      propertyId: args.propertyId,
    },
  })
}

type CreateCompostLogArgs = {
  propertyId: string
  binId: string
  date: string
  action: string
  tempFahrenheit?: number
  notes?: string
}

export const createCompostLog: CreateCompostLog<CreateCompostLogArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const bin = await context.entities.CompostBin.findUnique({
    where: { id: args.binId },
  })
  if (!bin || bin.propertyId !== args.propertyId) throw new HttpError(403)

  return context.entities.CompostLog.create({
    data: {
      date: args.date,
      action: args.action,
      tempFahrenheit: args.tempFahrenheit,
      notes: args.notes,
      binId: args.binId,
    },
  })
}
