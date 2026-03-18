import { type GetSeedInventory, type GetSeedStartLogs, type GetSeedStartingSchedule } from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"
import { parseFrostDate } from "../lib/frostDates"
import { addWeeks, format, startOfWeek, endOfWeek, addDays } from "date-fns"

type GetSeedInventoryArgs = {
  propertyId: string
  plantId?: string
  year?: number
}

export const getSeedInventory: GetSeedInventory<GetSeedInventoryArgs, any[]> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const where: any = { propertyId: args.propertyId }
  if (args.plantId) where.plantId = args.plantId
  if (args.year) where.yearPurchased = args.year

  return context.entities.SeedInventory.findMany({
    where,
    include: {
      plant: true,
      startLogs: {
        orderBy: { date: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

type GetSeedStartLogsArgs = {
  propertyId: string
  activeOnly?: boolean
}

export const getSeedStartLogs: GetSeedStartLogs<GetSeedStartLogsArgs, any[]> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const where: any = { propertyId: args.propertyId }
  if (args.activeOnly) {
    where.transplantedDate = null
  }

  return context.entities.SeedStartLog.findMany({
    where,
    include: {
      plant: true,
      seedInventory: { include: { plant: true } },
    },
    orderBy: { date: "desc" },
  })
}

type GetSeedStartingScheduleArgs = {
  propertyId: string
  year: number
}

type ScheduleItem = {
  plantId: string
  plantName: string
  type: "indoor" | "directSow"
  targetDate: string
  weeksFromFrost: number
  daysToGermination: number | null
  seedInStock: boolean
  seedQuantity: number | null
}

type ScheduleResult = {
  thisWeekIndoor: ScheduleItem[]
  thisWeekDirectSow: ScheduleItem[]
  nextWeekIndoor: ScheduleItem[]
  nextWeekDirectSow: ScheduleItem[]
  upcoming: ScheduleItem[]
  activeTrays: any[]
  seedsInStock: number
}

export const getSeedStartingSchedule: GetSeedStartingSchedule<
  GetSeedStartingScheduleArgs,
  ScheduleResult
> = async (args, context) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const property = await context.entities.Property.findUnique({
    where: { id: args.propertyId },
  })
  if (!property) throw new HttpError(404, "Property not found")

  const lastFrost = parseFrostDate(args.year, property.lastFrostDate)

  const plants = await context.entities.Plant.findMany()

  const seedInventory = await context.entities.SeedInventory.findMany({
    where: { propertyId: args.propertyId },
  })

  const seedMap = new Map<string, { quantity: number | null }>()
  for (const si of seedInventory) {
    const existing = seedMap.get(si.plantId)
    const qty = si.quantity ?? 0
    if (existing) {
      existing.quantity = (existing.quantity ?? 0) + qty
    } else {
      seedMap.set(si.plantId, { quantity: qty })
    }
  }

  const today = new Date()
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 })
  const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 })
  const nextWeekStart = addDays(thisWeekEnd, 1)
  const nextWeekEnd = addDays(nextWeekStart, 6)

  const items: ScheduleItem[] = []

  for (const plant of plants) {
    if (plant.startIndoorWeeks != null) {
      const targetDate = addWeeks(lastFrost, -plant.startIndoorWeeks)
      const seed = seedMap.get(plant.id)
      items.push({
        plantId: plant.id,
        plantName: `${plant.name}${plant.variety ? ` (${plant.variety})` : ""}`,
        type: "indoor",
        targetDate: format(targetDate, "yyyy-MM-dd"),
        weeksFromFrost: -plant.startIndoorWeeks,
        daysToGermination: plant.daysToGermination,
        seedInStock: !!seed && (seed.quantity ?? 0) > 0,
        seedQuantity: seed?.quantity ?? null,
      })
    }

    if (plant.directSowWeeks != null) {
      const targetDate = addWeeks(lastFrost, plant.directSowWeeks)
      const seed = seedMap.get(plant.id)
      items.push({
        plantId: plant.id,
        plantName: `${plant.name}${plant.variety ? ` (${plant.variety})` : ""}`,
        type: "directSow",
        targetDate: format(targetDate, "yyyy-MM-dd"),
        weeksFromFrost: plant.directSowWeeks,
        daysToGermination: plant.daysToGermination,
        seedInStock: !!seed && (seed.quantity ?? 0) > 0,
        seedQuantity: seed?.quantity ?? null,
      })
    }
  }

  const inRange = (dateStr: string, start: Date, end: Date) => {
    const d = new Date(dateStr)
    return d >= start && d <= end
  }

  const thisWeekIndoor = items.filter(i => i.type === "indoor" && inRange(i.targetDate, thisWeekStart, thisWeekEnd))
  const thisWeekDirectSow = items.filter(i => i.type === "directSow" && inRange(i.targetDate, thisWeekStart, thisWeekEnd))
  const nextWeekIndoor = items.filter(i => i.type === "indoor" && inRange(i.targetDate, nextWeekStart, nextWeekEnd))
  const nextWeekDirectSow = items.filter(i => i.type === "directSow" && inRange(i.targetDate, nextWeekStart, nextWeekEnd))
  const upcoming = items.filter(i => {
    const d = new Date(i.targetDate)
    return d > nextWeekEnd
  }).sort((a, b) => a.targetDate.localeCompare(b.targetDate))

  const activeTrays = await context.entities.SeedStartLog.findMany({
    where: {
      propertyId: args.propertyId,
      transplantedDate: null,
    },
    include: {
      plant: true,
      seedInventory: { include: { plant: true } },
    },
    orderBy: { date: "desc" },
  })

  return {
    thisWeekIndoor,
    thisWeekDirectSow,
    nextWeekIndoor,
    nextWeekDirectSow,
    upcoming,
    activeTrays,
    seedsInStock: seedInventory.length,
  }
}
