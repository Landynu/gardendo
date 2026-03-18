import {
  type CreateSoilTest,
  type DeleteSoilTest,
  type CreateAmendmentLog,
  type DeleteAmendmentLog,
} from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type CreateSoilTestArgs = {
  propertyId: string
  bedId?: string
  date: string
  ph?: number
  nitrogen?: number
  phosphorus?: number
  potassium?: number
  organicMatter?: number
  texture?: string
  notes?: string
}

export const createSoilTest: CreateSoilTest<CreateSoilTestArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  return context.entities.SoilTest.create({
    data: {
      date: args.date,
      ph: args.ph,
      nitrogen: args.nitrogen,
      phosphorus: args.phosphorus,
      potassium: args.potassium,
      organicMatter: args.organicMatter,
      texture: args.texture,
      notes: args.notes,
      bedId: args.bedId,
      propertyId: args.propertyId,
      userId: context.user.id,
    },
  })
}

type CreateAmendmentLogArgs = {
  propertyId: string
  bedId?: string
  date: string
  amendment: string
  quantityLbs?: number
  areaSqFt?: number
  notes?: string
}

export const createAmendmentLog: CreateAmendmentLog<CreateAmendmentLogArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  return context.entities.AmendmentLog.create({
    data: {
      date: args.date,
      amendment: args.amendment,
      quantityLbs: args.quantityLbs,
      areaSqFt: args.areaSqFt,
      notes: args.notes,
      bedId: args.bedId,
      propertyId: args.propertyId,
      userId: context.user.id,
    },
  })
}

// ─── Delete operations ──────────────────────

type DeleteSoilTestArgs = { id: string; propertyId: string }

export const deleteSoilTest: DeleteSoilTest<DeleteSoilTestArgs, any> = async (args, context) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)
  return context.entities.SoilTest.delete({ where: { id: args.id } })
}

type DeleteAmendmentLogArgs = { id: string; propertyId: string }

export const deleteAmendmentLog: DeleteAmendmentLog<DeleteAmendmentLogArgs, any> = async (args, context) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)
  return context.entities.AmendmentLog.delete({ where: { id: args.id } })
}
