import { type GetJournalEntries } from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type GetJournalEntriesArgs = {
  propertyId: string
  search?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}

export const getJournalEntries: GetJournalEntries<GetJournalEntriesArgs, any[]> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const where: any = { propertyId: args.propertyId }

  if (args.search) {
    where.content = { contains: args.search, mode: "insensitive" }
  }

  if (args.dateFrom || args.dateTo) {
    where.date = {}
    if (args.dateFrom) where.date.gte = args.dateFrom
    if (args.dateTo) where.date.lte = args.dateTo
  }

  return context.entities.JournalEntry.findMany({
    where,
    orderBy: { date: "desc" },
    take: args.limit ?? 30,
    include: {
      user: { select: { id: true, username: true } },
    },
  })
}
