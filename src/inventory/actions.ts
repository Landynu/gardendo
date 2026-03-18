import {
  type CreateInventoryItem,
  type UpdateInventoryItem,
  type DeleteInventoryItem,
} from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type CreateInventoryItemArgs = {
  propertyId: string
  name: string
  category: string
  quantity?: number
  unit?: string
  location?: string
  condition?: string
  notes?: string
}

export const createInventoryItem: CreateInventoryItem<CreateInventoryItemArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  return context.entities.InventoryItem.create({
    data: {
      name: args.name,
      category: args.category as any,
      quantity: args.quantity,
      unit: args.unit,
      location: args.location,
      condition: args.condition,
      notes: args.notes,
      propertyId: args.propertyId,
    },
  })
}

type UpdateInventoryItemArgs = {
  id: string
  propertyId: string
  name?: string
  quantity?: number
  unit?: string
  location?: string
  condition?: string
  notes?: string
}

export const updateInventoryItem: UpdateInventoryItem<UpdateInventoryItemArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  const { id, propertyId, ...data } = args
  return context.entities.InventoryItem.update({
    where: { id },
    data,
  })
}

type DeleteInventoryItemArgs = {
  id: string
  propertyId: string
}

export const deleteInventoryItem: DeleteInventoryItem<DeleteInventoryItemArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)
  await requirePropertyMember(context, args.propertyId)

  return context.entities.InventoryItem.delete({
    where: { id: args.id },
  })
}
