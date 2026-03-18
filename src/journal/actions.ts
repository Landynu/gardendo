import { type CreateJournalEntry, type DeleteJournalEntry } from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type CreateJournalEntryArgs = {
  propertyId: string
  date: string
  content: string
  weatherNotes?: string
  mood?: string
}

export const createJournalEntry: CreateJournalEntry<CreateJournalEntryArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  // Upsert — same user, same property, same date updates the existing entry
  return context.entities.JournalEntry.upsert({
    where: {
      propertyId_date_userId: {
        propertyId: args.propertyId,
        date: args.date,
        userId: context.user.id,
      },
    },
    update: {
      content: args.content,
      weatherNotes: args.weatherNotes,
      mood: args.mood,
    },
    create: {
      date: args.date,
      content: args.content,
      weatherNotes: args.weatherNotes,
      mood: args.mood,
      propertyId: args.propertyId,
      userId: context.user.id,
    },
  })
}

type DeleteJournalEntryArgs = {
  id: string
  propertyId: string
}

export const deleteJournalEntry: DeleteJournalEntry<DeleteJournalEntryArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  return context.entities.JournalEntry.delete({
    where: { id: args.id },
  })
}
