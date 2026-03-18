import { type GetAnimalGroups, type GetAnimalGroupById } from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"
import { subDays, format } from "date-fns"

type GetAnimalGroupsArgs = {
  propertyId: string
}

export const getAnimalGroups: GetAnimalGroups<GetAnimalGroupsArgs, any[]> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd")

  const groups = await context.entities.AnimalGroup.findMany({
    where: { propertyId: args.propertyId },
    include: {
      animals: { where: { isActive: true }, select: { id: true } },
      eggLogs: {
        where: { date: { gte: sevenDaysAgo } },
        select: { count: true },
      },
    },
    orderBy: { name: "asc" },
  })

  return groups.map((g: any) => ({
    ...g,
    activeAnimalCount: g.animals.length,
    weeklyEggs: g.eggLogs.reduce((sum: number, l: any) => sum + l.count, 0),
  }))
}

type GetAnimalGroupByIdArgs = {
  groupId: string
  propertyId: string
}

export const getAnimalGroupById: GetAnimalGroupById<GetAnimalGroupByIdArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const group = await context.entities.AnimalGroup.findUnique({
    where: { id: args.groupId },
    include: {
      animals: {
        include: {
          healthRecords: { orderBy: { date: "desc" }, take: 10 },
        },
        orderBy: { name: "asc" },
      },
      eggLogs: { orderBy: { date: "desc" }, take: 30 },
    },
  })

  if (!group) throw new HttpError(404, "Animal group not found")
  if (group.propertyId !== args.propertyId) throw new HttpError(403)

  return group
}
