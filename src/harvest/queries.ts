import { type GetHarvestLogs, type GetHarvestSummary } from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type GetHarvestLogsArgs = {
  propertyId: string
  plantId?: string
  year?: number
}

export const getHarvestLogs: GetHarvestLogs<GetHarvestLogsArgs, any[]> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const where: any = { propertyId: args.propertyId }
  if (args.plantId) where.plantId = args.plantId
  if (args.year) {
    where.date = {
      gte: `${args.year}-01-01`,
      lte: `${args.year}-12-31`,
    }
  }

  return context.entities.HarvestLog.findMany({
    where,
    include: {
      plant: true,
      planting: { include: { plant: true } },
      user: { select: { id: true, username: true } },
    },
    orderBy: { date: "desc" },
  })
}

type HarvestSummaryArgs = {
  propertyId: string
  year?: number
}

type HarvestSummary = {
  totalLbs: number
  harvestCount: number
  byPlant: { plantName: string; totalLbs: number; count: number }[]
  byMonth: { month: string; totalLbs: number; count: number }[]
}

export const getHarvestSummary: GetHarvestSummary<HarvestSummaryArgs, HarvestSummary> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const year = args.year ?? new Date().getFullYear()
  const logs = await context.entities.HarvestLog.findMany({
    where: {
      propertyId: args.propertyId,
      date: {
        gte: `${year}-01-01`,
        lte: `${year}-12-31`,
      },
    },
    include: {
      plant: { select: { name: true, variety: true } },
      planting: { include: { plant: { select: { name: true, variety: true } } } },
    },
  })

  let totalLbs = 0
  let harvestCount = logs.length
  const plantMap = new Map<string, { totalLbs: number; count: number }>()
  const monthMap = new Map<string, { totalLbs: number; count: number }>()

  for (const log of logs) {
    const lbs = log.quantityLbs ?? 0
    totalLbs += lbs

    // Plant name from direct plant or planting.plant
    const plantName = log.plant
      ? `${log.plant.name}${log.plant.variety ? ` (${log.plant.variety})` : ""}`
      : log.planting?.plant
        ? `${log.planting.plant.name}${log.planting.plant.variety ? ` (${log.planting.plant.variety})` : ""}`
        : "Unknown"

    const pe = plantMap.get(plantName) ?? { totalLbs: 0, count: 0 }
    pe.totalLbs += lbs
    pe.count += 1
    plantMap.set(plantName, pe)

    const month = log.date.substring(0, 7) // YYYY-MM
    const me = monthMap.get(month) ?? { totalLbs: 0, count: 0 }
    me.totalLbs += lbs
    me.count += 1
    monthMap.set(month, me)
  }

  const byPlant = Array.from(plantMap.entries())
    .map(([plantName, data]) => ({ plantName, ...data }))
    .sort((a, b) => b.totalLbs - a.totalLbs)

  const byMonth = Array.from(monthMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))

  return { totalLbs: Math.round(totalLbs * 100) / 100, harvestCount, byPlant, byMonth }
}
