import { type GetInventoryItems } from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type GetInventoryItemsArgs = {
  propertyId: string
  category?: string
  search?: string
}

export const getInventoryItems: GetInventoryItems<GetInventoryItemsArgs, any[]> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const where: any = { propertyId: args.propertyId }
  if (args.category) where.category = args.category
  if (args.search) {
    where.name = { contains: args.search, mode: "insensitive" }
  }

  return context.entities.InventoryItem.findMany({
    where,
    orderBy: { name: "asc" },
  })
}
