import { type GetPlants, type GetPlantById } from "wasp/server/operations"
import { type Plant } from "wasp/entities"
import { HttpError } from "wasp/server"

type GetPlantsArgs = {
  category?: string
  search?: string
}

export const getPlants: GetPlants<GetPlantsArgs, Plant[]> = async (
  args,
  context
) => {
  if (!context.user) throw new HttpError(401)

  const where: any = {}

  if (args?.category) {
    where.category = args.category
  }

  if (args?.search) {
    where.OR = [
      { name: { contains: args.search, mode: "insensitive" } },
      { scientificName: { contains: args.search, mode: "insensitive" } },
      { variety: { contains: args.search, mode: "insensitive" } },
    ]
  }

  return context.entities.Plant.findMany({
    where,
    orderBy: { name: "asc" },
  })
}

type GetPlantByIdArgs = {
  id: string
}

type PlantWithCompanions = Plant & {
  companionsA: any[]
  companionsB: any[]
}

export const getPlantById: GetPlantById<
  GetPlantByIdArgs,
  PlantWithCompanions
> = async (args, context) => {
  if (!context.user) throw new HttpError(401)

  const plant = await context.entities.Plant.findUnique({
    where: { id: args.id },
    include: {
      companionsA: {
        include: {
          plantB: true,
        },
      },
      companionsB: {
        include: {
          plantA: true,
        },
      },
    },
  })

  if (!plant) throw new HttpError(404, "Plant not found")

  return plant
}
