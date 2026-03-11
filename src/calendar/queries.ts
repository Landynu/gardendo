import { type GetCalendarEvents } from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type GetCalendarEventsArgs = {
  propertyId: string
  startDate?: string
  endDate?: string
}

export const getCalendarEvents: GetCalendarEvents<
  GetCalendarEventsArgs,
  any[]
> = async (args, context) => {
  if (!context.user) throw new HttpError(401)

  await requirePropertyMember(context, args.propertyId)

  const where: any = { propertyId: args.propertyId }

  if (args.startDate || args.endDate) {
    where.date = {}
    if (args.startDate) {
      where.date.gte = args.startDate
    }
    if (args.endDate) {
      where.date.lte = args.endDate
    }
  }

  return context.entities.CalendarEvent.findMany({
    where,
    include: {
      plant: true,
      tasks: true,
    },
    orderBy: { date: "asc" },
  })
}
