import {
  type GetProperties,
  type GetPropertyById,
} from "wasp/server/operations"
import { type Property } from "wasp/entities"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

export const getProperties: GetProperties<void, Property[]> = async (
  _args,
  context
) => {
  if (!context.user) throw new HttpError(401)

  return context.entities.Property.findMany({
    where: {
      members: {
        some: { userId: context.user.id },
      },
    },
    include: {
      members: {
        include: {
          user: {
            include: {
              auth: {
                include: {
                  identities: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })
}

type GetPropertyByIdArgs = {
  id: string
}

export const getPropertyById: GetPropertyById<
  GetPropertyByIdArgs,
  any
> = async (args, context) => {
  if (!context.user) throw new HttpError(401)

  await requirePropertyMember(context, args.id)

  const property = await context.entities.Property.findUnique({
    where: { id: args.id },
    include: {
      members: true,
      zones: {
        orderBy: { name: "asc" },
      },
    },
  })

  if (!property) throw new HttpError(404, "Property not found")

  return property
}
