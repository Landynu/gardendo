import { type CreateHarvestLog, type DeleteHarvestLog } from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type CreateHarvestLogArgs = {
  propertyId: string
  plantId?: string
  plantingId?: string
  date: string
  quantityLbs?: number
  notes?: string
}

export const createHarvestLog: CreateHarvestLog<CreateHarvestLogArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  return context.entities.HarvestLog.create({
    data: {
      date: args.date,
      quantityLbs: args.quantityLbs,
      notes: args.notes,
      plantId: args.plantId,
      plantingId: args.plantingId,
      propertyId: args.propertyId,
      userId: context.user.id,
    },
  })
}

type DeleteHarvestLogArgs = {
  id: string
  propertyId: string
}

export const deleteHarvestLog: DeleteHarvestLog<DeleteHarvestLogArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  return context.entities.HarvestLog.delete({
    where: { id: args.id },
  })
}
