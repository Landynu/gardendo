import {
  type GetPlants,
  type GetPlantById,
  type GetCompanionships,
} from "wasp/server/operations";
import { type Plant, type CompanionPlant } from "wasp/entities";
import { HttpError } from "wasp/server";

type GetPlantsArgs = {
  category?: string;
  search?: string;
};

export const getPlants: GetPlants<GetPlantsArgs, Plant[]> = async (
  args,
  context,
) => {
  if (!context.user) throw new HttpError(401);

  const where: any = {};

  if (args?.category) {
    where.category = args.category;
  }

  if (args?.search) {
    where.OR = [
      { name: { contains: args.search, mode: "insensitive" } },
      { scientificName: { contains: args.search, mode: "insensitive" } },
      { variety: { contains: args.search, mode: "insensitive" } },
    ];
  }

  return context.entities.Plant.findMany({
    where,
    orderBy: { name: "asc" },
  });
};

type GetPlantByIdArgs = {
  id: string;
};

type PlantCompanionRef = {
  id: string;
  name: string;
  variety: string | null;
  sqftColor: string | null;
};

type CompanionFromPlantA = CompanionPlant & {
  plantB: PlantCompanionRef;
};

type CompanionFromPlantB = CompanionPlant & {
  plantA: PlantCompanionRef;
};

type PlantWithCompanions = Plant & {
  companionsA: CompanionFromPlantA[];
  companionsB: CompanionFromPlantB[];
};

export const getPlantById: GetPlantById<
  GetPlantByIdArgs,
  PlantWithCompanions
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

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
  });

  if (!plant) throw new HttpError(404, "Plant not found");

  return plant;
};

// Returns all companion relationships — small table, fetch once for bed grid overlay
type CompanionshipRow = CompanionPlant & {
  plantA: {
    id: string;
    name: string;
    variety: string | null;
    sqftColor: string | null;
  };
  plantB: {
    id: string;
    name: string;
    variety: string | null;
    sqftColor: string | null;
  };
};

export const getCompanionships: GetCompanionships<
  void,
  CompanionshipRow[]
> = async (_args, context) => {
  if (!context.user) throw new HttpError(401);

  return context.entities.CompanionPlant.findMany({
    include: {
      plantA: {
        select: { id: true, name: true, variety: true, sqftColor: true },
      },
      plantB: {
        select: { id: true, name: true, variety: true, sqftColor: true },
      },
    },
    orderBy: { plantA: { name: "asc" } },
  });
};
