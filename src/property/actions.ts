import {
  type CreateProperty,
  type UpdateProperty,
} from "wasp/server/operations"
import { type Property } from "wasp/entities"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type CreatePropertyArgs = {
  name: string
  acreage: number
  hardinessZone?: string
  lastFrostDate?: string
  firstFrostDate?: string
  timezone?: string
  latitude?: number
  longitude?: number
  notes?: string
}

export const createProperty: CreateProperty<CreatePropertyArgs, Property> =
  async (args, context) => {
    if (!context.user) throw new HttpError(401)

    const property = await context.entities.Property.create({
      data: {
        name: args.name,
        acreage: args.acreage,
        hardinessZone: args.hardinessZone ?? "3B",
        lastFrostDate: args.lastFrostDate ?? "05-21",
        firstFrostDate: args.firstFrostDate ?? "09-12",
        timezone: args.timezone ?? "America/Regina",
        latitude: args.latitude,
        longitude: args.longitude,
        notes: args.notes,
      },
    })

    await context.entities.PropertyMember.create({
      data: {
        role: "OWNER",
        userId: context.user.id,
        propertyId: property.id,
      },
    })

    return property
  }

type UpdatePropertyArgs = {
  id: string
  name?: string
  acreage?: number
  hardinessZone?: string
  lastFrostDate?: string
  firstFrostDate?: string
  timezone?: string
  latitude?: number
  longitude?: number
  notes?: string
}

export const updateProperty: UpdateProperty<UpdatePropertyArgs, Property> =
  async (args, context) => {
    await requirePropertyMember(context, args.id)

    const { id, ...data } = args

    return context.entities.Property.update({
      where: { id },
      data,
    })
  }
