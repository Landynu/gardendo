import { type GetZones, type GetBedById } from "wasp/server/operations"
import { HttpError } from "wasp/server"
import { requirePropertyMember } from "../lib/auth"

type GetZonesArgs = {
  propertyId: string
}

export const getZones: GetZones<GetZonesArgs, any[]> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)

  await requirePropertyMember(context, args.propertyId)

  return context.entities.PropertyZone.findMany({
    where: { propertyId: args.propertyId },
    include: {
      gardenBeds: {
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  })
}

type GetBedByIdArgs = {
  id: string
}

export const getBedById: GetBedById<GetBedByIdArgs, any> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)

  const bed = await context.entities.GardenBed.findUnique({
    where: { id: args.id },
    include: {
      zone: {
        include: {
          property: true,
        },
      },
      squares: {
        include: {
          planting: {
            include: {
              plant: true,
            },
          },
        },
        orderBy: [{ row: "asc" }, { col: "asc" }],
      },
      plantings: {
        include: {
          plant: true,
        },
      },
    },
  })

  if (!bed) throw new HttpError(404, "Garden bed not found")

  // Verify membership via the bed's zone's property
  await requirePropertyMember(context, bed.zone.propertyId)

  return bed
}
