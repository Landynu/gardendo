import { type GetSoilTests, type GetAmendmentLogs } from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type GetSoilTestsArgs = {
  propertyId: string
  bedId?: string
}

export const getSoilTests: GetSoilTests<GetSoilTestsArgs, any[]> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const where: any = { propertyId: args.propertyId }
  if (args.bedId) where.bedId = args.bedId

  return context.entities.SoilTest.findMany({
    where,
    include: {
      bed: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  })
}

type GetAmendmentLogsArgs = {
  propertyId: string
  bedId?: string
}

export const getAmendmentLogs: GetAmendmentLogs<GetAmendmentLogsArgs, any[]> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const where: any = { propertyId: args.propertyId }
  if (args.bedId) where.bedId = args.bedId

  return context.entities.AmendmentLog.findMany({
    where,
    include: {
      bed: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  })
}
