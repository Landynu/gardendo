import {
  type CreatePlant,
  type UpdatePlant,
  type SearchPlants,
  type ImportPlant,
  type EnrichPlants,
  type SetPlantDisplayPhoto,
  type AddCompanion,
  type RemoveCompanion,
  type UpdateCompanion,
} from "wasp/server/operations";
import { type Plant, type CompanionPlant } from "wasp/entities";
import { HttpError } from "wasp/server";

type CreatePlantArgs = {
  name: string;
  scientificName?: string;
  variety?: string;
  category: string;
  lifecycle: string;
  hardinessZoneMin?: string;
  hardinessZoneMax?: string;
  sunRequirement?: string;
  waterNeed?: string;
  seasonType?: string;
  daysToMaturity?: number;
  daysToGermination?: number;
  plantDepthInches?: number;
  spacingInches?: number;
  rowSpacingInches?: number;
  plantHeightInches?: number;
  startIndoorWeeks?: number;
  transplantWeeks?: number;
  directSowWeeks?: number;
  harvestRelativeWeeks?: number;
  plantsPerSqFt?: number;
  sqftColor?: string;
  permLayer?: string;
  isNitrogenFixer?: boolean;
  isDynamicAccumulator?: boolean;
  isEdible?: boolean;
  isMedicinal?: boolean;
  attractsPollinators?: boolean;
  deerResistant?: boolean;
  notes?: string;
  imageUrl?: string;
};

export const createPlant: CreatePlant<CreatePlantArgs, Plant> = async (
  args,
  context,
) => {
  if (!context.user) throw new HttpError(401);

  return context.entities.Plant.create({
    data: {
      name: args.name,
      scientificName: args.scientificName,
      variety: args.variety,
      category: args.category as any,
      lifecycle: args.lifecycle as any,
      hardinessZoneMin: args.hardinessZoneMin,
      hardinessZoneMax: args.hardinessZoneMax,
      sunRequirement: args.sunRequirement as any,
      waterNeed: args.waterNeed as any,
      seasonType: args.seasonType as any,
      daysToMaturity: args.daysToMaturity,
      daysToGermination: args.daysToGermination,
      plantDepthInches: args.plantDepthInches,
      spacingInches: args.spacingInches,
      rowSpacingInches: args.rowSpacingInches,
      plantHeightInches: args.plantHeightInches,
      startIndoorWeeks: args.startIndoorWeeks,
      transplantWeeks: args.transplantWeeks,
      directSowWeeks: args.directSowWeeks,
      harvestRelativeWeeks: args.harvestRelativeWeeks,
      plantsPerSqFt: args.plantsPerSqFt,
      sqftColor: args.sqftColor,
      permLayer: args.permLayer as any,
      isNitrogenFixer: args.isNitrogenFixer,
      isDynamicAccumulator: args.isDynamicAccumulator,
      isEdible: args.isEdible,
      isMedicinal: args.isMedicinal,
      attractsPollinators: args.attractsPollinators,
      deerResistant: args.deerResistant,
      notes: args.notes,
      imageUrl: args.imageUrl,
      dataSource: "USER",
    },
  });
};

type UpdatePlantArgs = {
  id: string;
  name?: string;
  scientificName?: string;
  variety?: string;
  category?: string;
  lifecycle?: string;
  hardinessZoneMin?: string;
  hardinessZoneMax?: string;
  sunRequirement?: string;
  waterNeed?: string;
  seasonType?: string;
  daysToMaturity?: number;
  daysToGermination?: number;
  plantDepthInches?: number;
  spacingInches?: number;
  rowSpacingInches?: number;
  plantHeightInches?: number;
  startIndoorWeeks?: number;
  transplantWeeks?: number;
  directSowWeeks?: number;
  harvestRelativeWeeks?: number;
  plantsPerSqFt?: number;
  sqftColor?: string;
  permLayer?: string;
  isNitrogenFixer?: boolean;
  isDynamicAccumulator?: boolean;
  isEdible?: boolean;
  isMedicinal?: boolean;
  attractsPollinators?: boolean;
  deerResistant?: boolean;
  notes?: string;
  imageUrl?: string;
};

export const updatePlant: UpdatePlant<UpdatePlantArgs, Plant> = async (
  args,
  context,
) => {
  if (!context.user) throw new HttpError(401);

  const { id, ...data } = args;

  return context.entities.Plant.update({
    where: { id },
    data: {
      ...data,
      category: data.category as any,
      lifecycle: data.lifecycle as any,
      sunRequirement: data.sunRequirement as any,
      waterNeed: data.waterNeed as any,
      seasonType: data.seasonType as any,
      permLayer: data.permLayer as any,
      isUserEdited: true,
    },
  });
};

// ─── PLANT SEARCH API (Trefle.io) ──────────

const TREFLE_API = "https://trefle.io/api/v1";
const TREFLE_TOKEN = process.env.TREFLE_TOKEN;

// Convert minimum temperature (Celsius) to USDA hardiness zone
const tempToZone = (degC?: number): string | undefined => {
  if (degC == null) return undefined;
  if (degC <= -51.1) return "1A";
  if (degC <= -48.3) return "1B";
  if (degC <= -45.6) return "2A";
  if (degC <= -42.8) return "2B";
  if (degC <= -40.0) return "3A";
  if (degC <= -37.2) return "3B";
  if (degC <= -34.4) return "4A";
  if (degC <= -31.7) return "4B";
  if (degC <= -28.9) return "5A";
  if (degC <= -26.1) return "5B";
  if (degC <= -23.3) return "6A";
  if (degC <= -20.6) return "6B";
  if (degC <= -17.8) return "7A";
  if (degC <= -15.0) return "7B";
  if (degC <= -12.2) return "8A";
  if (degC <= -9.4) return "8B";
  if (degC <= -6.7) return "9A";
  if (degC <= -3.9) return "9B";
  if (degC <= -1.1) return "10A";
  if (degC <= 1.7) return "10B";
  if (degC <= 4.4) return "11A";
  if (degC <= 7.2) return "11B";
  if (degC <= 10.0) return "12A";
  return "12B";
};

// cm to inches
const cmToIn = (cm?: number) =>
  cm ? Math.round((cm / 2.54) * 10) / 10 : undefined;

/** Upsert a PlantFamily from Trefle's family data, returns the family id or undefined */
async function upsertFamilyFromTrefle(
  data: any,
  entities: any,
): Promise<string | undefined> {
  const familyName = data.family?.name;
  if (!familyName) return undefined;

  const family = await entities.PlantFamily.upsert({
    where: { name: familyName },
    update: {},
    create: {
      name: familyName,
      commonName: data.family_common_name || data.family?.common_name || null,
    },
  });
  return family.id;
}

/** Build Trefle enrichment data from a detail API response */
function mapTrefleDetail(data: any) {
  const growth = data.growth ?? {};
  const specs = data.specifications ?? {};

  return {
    // Soil & environment
    phMin: growth.ph_minimum ?? undefined,
    phMax: growth.ph_maximum ?? undefined,
    soilNutriments: growth.soil_nutriments ?? undefined,
    soilHumidity: growth.soil_humidity ?? undefined,
    soilTexture: growth.soil_texture ?? undefined,
    soilSalinity: growth.soil_salinity ?? undefined,
    atmosphericHumidity: growth.atmospheric_humidity ?? undefined,
    precipitationMin: growth.minimum_precipitation?.mm ?? undefined,
    precipitationMax: growth.maximum_precipitation?.mm ?? undefined,
    minRootDepthCm: growth.minimum_root_depth?.cm ?? undefined,
    maxHeightCm: specs.maximum_height?.cm ?? undefined,
    // Growth timing
    growthMonths: growth.growth_months?.join(",") || undefined,
    bloomMonths: growth.bloom_months?.join(",") || undefined,
    fruitMonths: growth.fruit_months?.join(",") || undefined,
    // Growth characteristics
    growthRate: specs.growth_rate || undefined,
    ligneousType: specs.ligneous_type || undefined,
    growthForm: specs.growth_form || undefined,
    growthHabit: specs.growth_habit || undefined,
    shapeAndOrientation: specs.shape_and_orientation || undefined,
    toxicity: specs.toxicity || undefined,
    // Nitrogen fixation (sync to existing boolean field)
    ...(specs.nitrogen_fixation ? { isNitrogenFixer: true } : {}),
    // Appearance
    flowerColor: data.flower?.color?.join(",") || undefined,
    flowerConspicuous: data.flower?.conspicuous ?? undefined,
    foliageColor: data.foliage?.color?.join(",") || undefined,
    foliageTexture: data.foliage?.texture || undefined,
    fruitColor: data.fruit_or_seed?.color?.join(",") || undefined,
    fruitConspicuous: data.fruit_or_seed?.conspicuous ?? undefined,
    fruitShape: data.fruit_or_seed?.shape || undefined,
    seedPersistence: data.fruit_or_seed?.seed_persistence ?? undefined,
    isEvergreen: data.foliage?.leaf_retention === true,
    // Edible details
    edibleParts: data.edible_part?.join(",") || undefined,
    // Zones
    hardinessZoneMin: tempToZone(growth.minimum_temperature?.deg_c),
    hardinessZoneMax: tempToZone(growth.maximum_temperature?.deg_c),
  };
}

type PlantSearchResult = {
  slug: string;
  name: string;
  binomialName?: string;
  mainImagePath?: string;
};

type SearchPlantsArgs = {
  query: string;
};

export const searchPlants: SearchPlants<
  SearchPlantsArgs,
  PlantSearchResult[]
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  if (!args.query.trim()) return [];
  if (!TREFLE_TOKEN) throw new HttpError(500, "Trefle API token not configured");

  const res = await fetch(
    `${TREFLE_API}/species/search?q=${encodeURIComponent(args.query.trim())}&token=${TREFLE_TOKEN}`,
  );

  if (!res.ok) throw new HttpError(502, "Trefle API unavailable");

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new HttpError(502, "Trefle API returned non-JSON response");
  }

  const json = await res.json();
  const species = json.data ?? [];

  return species.slice(0, 20).map((sp: any) => ({
    slug: sp.slug ?? String(sp.id),
    name: sp.common_name ?? sp.scientific_name ?? "Unknown",
    binomialName: sp.scientific_name || undefined,
    mainImagePath: sp.image_url || undefined,
  }));
};

type ImportPlantArgs = {
  slug: string;
};

export const importPlant: ImportPlant<
  ImportPlantArgs,
  Plant
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  if (!TREFLE_TOKEN) throw new HttpError(500, "Trefle API token not configured");

  // Check if already imported
  const existing = await context.entities.Plant.findFirst({
    where: { externalSlug: args.slug },
  });
  if (existing) return existing;

  // Fetch full species details
  const res = await fetch(
    `${TREFLE_API}/species/${encodeURIComponent(args.slug)}?token=${TREFLE_TOKEN}`,
  );
  if (!res.ok) throw new HttpError(502, "Trefle API unavailable");

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new HttpError(502, "Trefle API returned non-JSON response");
  }

  const json = await res.json();
  const data = json.data ?? {};
  const growth = data.growth ?? {};
  const specs = data.specifications ?? {};

  // Map Trefle light scale (0-10) to our enum
  const mapLight = (light?: number): string | undefined => {
    if (light == null) return undefined;
    if (light <= 3) return "FULL_SHADE";
    if (light <= 5) return "PARTIAL_SHADE";
    if (light <= 7) return "PARTIAL_SUN";
    return "FULL_SUN";
  };

  // Infer lifecycle from duration array
  const duration: string[] = data.duration ?? [];
  let lifecycle = "ANNUAL";
  if (duration.some((d: string) => d.toLowerCase() === "perennial")) lifecycle = "PERENNIAL";
  else if (duration.some((d: string) => d.toLowerCase() === "biennial")) lifecycle = "BIENNIAL";

  // Infer category
  let category = "VEGETABLE";
  if (data.vegetable) {
    category = "VEGETABLE";
  } else if (specs.growth_habit === "tree" || specs.growth_form === "tree") {
    category = "TREE";
  } else if (specs.growth_habit === "shrub" || specs.growth_form === "shrub") {
    category = "SHRUB";
  } else if (data.flower?.conspicuous && !data.edible) {
    category = "FLOWER";
  } else if (data.edible) {
    category = "VEGETABLE";
  }

  const enrichment = mapTrefleDetail(data);
  const familyId = await upsertFamilyFromTrefle(data, context.entities);

  return context.entities.Plant.create({
    data: {
      name: data.common_name ?? data.scientific_name ?? "Unknown",
      scientificName: data.scientific_name || undefined,
      category: category as any,
      lifecycle: lifecycle as any,
      sunRequirement: (mapLight(growth.light) as any) || undefined,
      spacingInches: cmToIn(growth.spread?.cm),
      rowSpacingInches: cmToIn(growth.row_spacing?.cm),
      plantHeightInches: cmToIn(specs.average_height?.cm),
      daysToMaturity: growth.days_to_harvest || undefined,
      isEdible: data.edible === true,
      imageUrl: data.image_url || undefined,
      notes: growth.sowing ? growth.sowing.slice(0, 500) : undefined,
      externalSlug: args.slug,
      dataSource: "TREFLE" as any,
      lastSyncedAt: new Date(),
      ...(familyId ? { familyId } : {}),
      ...enrichment,
    },
  });
};

// ─── ENRICH EXISTING PLANTS ─────────────────

type EnrichResult = { updated: number; skipped: number };

export const enrichPlants: EnrichPlants<void, EnrichResult> = async (
  _args,
  context,
) => {
  if (!context.user) throw new HttpError(401);
  if (!TREFLE_TOKEN) throw new HttpError(500, "Trefle API token not configured");

  // Find plants that could benefit from enrichment:
  // no image OR no enrichment data yet, must have a scientificName, not user-edited
  const plants = await context.entities.Plant.findMany({
    where: {
      scientificName: { not: null },
      isUserEdited: false,
      OR: [{ imageUrl: null }, { phMin: null }],
    },
  });

  let updated = 0;
  let skipped = 0;

  // Group by scientificName to avoid redundant API calls
  // (e.g. "Tomato Early Girl" and "Tomato Roma" share "Solanum lycopersicum")
  const byScientific = new Map<string, typeof plants>();
  for (const plant of plants) {
    const key = plant.scientificName!;
    if (!byScientific.has(key)) byScientific.set(key, []);
    byScientific.get(key)!.push(plant);
  }

  for (const [scientificName, group] of byScientific) {
    try {
      // Search Trefle by scientific name
      const searchRes = await fetch(
        `${TREFLE_API}/species/search?q=${encodeURIComponent(scientificName)}&token=${TREFLE_TOKEN}`,
      );
      if (!searchRes.ok) { skipped += group.length; continue; }

      const contentType = searchRes.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) { skipped += group.length; continue; }

      const searchJson = await searchRes.json();
      const match = searchJson.data?.[0];
      if (!match?.slug) { skipped += group.length; continue; }

      // Fetch full detail
      const detailRes = await fetch(
        `${TREFLE_API}/species/${match.slug}?token=${TREFLE_TOKEN}`,
      );
      if (!detailRes.ok) { skipped += group.length; continue; }

      const detailContentType = detailRes.headers.get("content-type") ?? "";
      if (!detailContentType.includes("application/json")) { skipped += group.length; continue; }

      const detailJson = await detailRes.json();
      const data = detailJson.data ?? {};
      const enrichment = mapTrefleDetail(data);
      const familyId = await upsertFamilyFromTrefle(data, context.entities);

      // Build update — only set fields that have data and aren't already set
      const updateData: any = {
        ...enrichment,
        externalSlug: match.slug,
        lastSyncedAt: new Date(),
      };
      if (data.image_url) updateData.imageUrl = data.image_url;
      if (data.edible === true) updateData.isEdible = true;
      if (familyId) updateData.familyId = familyId;

      for (const plant of group) {
        await context.entities.Plant.update({
          where: { id: plant.id },
          data: updateData,
        });
        updated++;
      }
    } catch {
      skipped += group.length;
    }

    // Rate limit: 60 req/min, we make 2 calls per species → wait 2s
    await new Promise((r) => setTimeout(r, 2000));
  }

  return { updated, skipped };
};

// ─── SET DISPLAY PHOTO ─────────────────────

type SetPlantDisplayPhotoArgs = {
  plantId: string;
  photoId: string | null; // null to clear
};

export const setPlantDisplayPhoto: SetPlantDisplayPhoto<
  SetPlantDisplayPhotoArgs,
  Plant
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  if (args.photoId) {
    // Verify photo exists and belongs to this plant
    const photo = await context.entities.Photo.findFirst({
      where: { id: args.photoId, plantId: args.plantId },
    });
    if (!photo) throw new HttpError(404, "Photo not found for this plant");
  }

  return context.entities.Plant.update({
    where: { id: args.plantId },
    data: { displayPhotoId: args.photoId },
  });
};

// ─── COMPANION PLANT CRUD ──────────────────

type AddCompanionArgs = {
  plantAId: string;
  plantBId: string;
  type: "BENEFICIAL" | "HARMFUL" | "NEUTRAL";
  notes?: string;
};

export const addCompanion: AddCompanion<
  AddCompanionArgs,
  CompanionPlant
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  if (args.plantAId === args.plantBId)
    throw new HttpError(400, "A plant cannot be its own companion");

  // Normalize order so the unique constraint works consistently
  const [firstId, secondId] = [args.plantAId, args.plantBId].sort();

  // Check both plants exist
  const [plantA, plantB] = await Promise.all([
    context.entities.Plant.findUnique({ where: { id: firstId } }),
    context.entities.Plant.findUnique({ where: { id: secondId } }),
  ]);
  if (!plantA || !plantB) throw new HttpError(404, "Plant not found");

  // Check if relationship already exists
  const existing = await context.entities.CompanionPlant.findUnique({
    where: { plantAId_plantBId: { plantAId: firstId, plantBId: secondId } },
  });
  if (existing)
    throw new HttpError(409, "Companion relationship already exists");

  return context.entities.CompanionPlant.create({
    data: {
      plantAId: firstId,
      plantBId: secondId,
      type: args.type,
      notes: args.notes?.trim() || null,
    },
  });
};

type UpdateCompanionArgs = {
  id: string;
  type?: "BENEFICIAL" | "HARMFUL" | "NEUTRAL";
  notes?: string;
};

export const updateCompanion: UpdateCompanion<
  UpdateCompanionArgs,
  CompanionPlant
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  return context.entities.CompanionPlant.update({
    where: { id: args.id },
    data: {
      ...(args.type !== undefined ? { type: args.type } : {}),
      ...(args.notes !== undefined ? { notes: args.notes.trim() || null } : {}),
    },
  });
};

type RemoveCompanionArgs = {
  id: string;
};

export const removeCompanion: RemoveCompanion<
  RemoveCompanionArgs,
  CompanionPlant
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  return context.entities.CompanionPlant.delete({
    where: { id: args.id },
  });
};
