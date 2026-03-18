import { type GetWaterSystems, type GetCompostBins } from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type GetWaterSystemsArgs = { propertyId: string }

export const getWaterSystems: GetWaterSystems<GetWaterSystemsArgs, any[]> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  return context.entities.WaterSystem.findMany({
    where: { propertyId: args.propertyId },
    include: {
      logs: { orderBy: { date: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  })
}

type GetCompostBinsArgs = { propertyId: string }

export const getCompostBins: GetCompostBins<GetCompostBinsArgs, any[]> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  return context.entities.CompostBin.findMany({
    where: { propertyId: args.propertyId },
    include: {
      logs: { orderBy: { date: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  })
}
