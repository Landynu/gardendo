import { addWeeks, format, differenceInWeeks, parse, isAfter } from "date-fns";
import { getActiveCells, type BedShape } from "../lib/bedShapes";

type PlantRow = {
  id: string;
  name: string;
  variety: string | null;
  family: { name: string; commonName: string | null } | null;
  category: string;
  plantsPerSqFt: number | null;
  spacingInches: number | null;
  sunRequirement: string | null;
  waterNeed: string | null;
  seasonType: string | null;
  daysToMaturity: number | null;
  startIndoorWeeks: number | null;
  transplantWeeks: number | null;
  directSowWeeks: number | null;
  harvestRelativeWeeks: number | null;
  permLayer: string | null;
  isNitrogenFixer: boolean;
  isDynamicAccumulator: boolean;
  attractsPollinators: boolean;
  toxicity: string | null;
  minRootDepthCm: number | null;
  growthHabit: string | null;
  deerResistant: boolean;
  plantHeightInches: number | null;
};

/**
 * Assembles all garden context into a compact system prompt section.
 * Returns the context text and a plant lookup map for the frontend.
 */
export async function buildBedDesignContext(
  entities: any,
  propertyId: string,
  bedId: string,
  year: number,
  season: string,
): Promise<{ contextText: string; plantLookup: Record<string, PlantRow> }> {
  // Fetch all data in parallel
  const [property, bed, allPlants, companions, plantedThisYear] =
    await Promise.all([
      entities.Property.findUnique({ where: { id: propertyId } }),
      entities.GardenBed.findUnique({
        where: { id: bedId },
        include: { zone: true },
      }),
      entities.Plant.findMany({
        include: { family: true },
        orderBy: { name: "asc" },
      }),
      entities.CompanionPlant.findMany({
        include: {
          plantA: { select: { id: true, name: true, variety: true } },
          plantB: { select: { id: true, name: true, variety: true } },
        },
      }),
      // What's planted in other beds this year for crop rotation
      entities.BedSquare.findMany({
        where: {
          year,
          bed: { zone: { propertyId } },
          plantingId: { not: null },
        },
        include: {
          planting: {
            include: {
              plant: { include: { family: true } },
            },
          },
          bed: { select: { id: true, name: true } },
        },
      }),
    ]);

  if (!property || !bed) {
    throw new Error("Property or bed not found");
  }

  const today = new Date();
  const currentYear = today.getFullYear();

  // Parse frost dates into concrete dates for this year
  const lastFrostDate = parse(
    `${currentYear}-${property.lastFrostDate}`,
    "yyyy-MM-dd",
    new Date(),
  );
  const firstFrostDate = parse(
    `${currentYear}-${property.firstFrostDate}`,
    "yyyy-MM-dd",
    new Date(),
  );
  const frostFreeDays = Math.round(
    (firstFrostDate.getTime() - lastFrostDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Compute active cells for the bed
  const activeCells = getActiveCells(
    bed.widthFt,
    bed.lengthFt,
    (bed.shape ?? "RECTANGLE") as BedShape,
  );

  // Build plant lookup
  const plantLookup: Record<string, PlantRow> = {};
  for (const p of allPlants) {
    plantLookup[p.id] = p;
  }

  const sections: string[] = [];

  // 1. Property climate
  sections.push(`## Property Climate
- Hardiness Zone: ${property.hardinessZone}
- Last Spring Frost: ${property.lastFrostDate} (${format(lastFrostDate, "MMMM d")})
- First Fall Frost: ${property.firstFrostDate} (${format(firstFrostDate, "MMMM d")})
- Frost-free days: ~${frostFreeDays}
- Timezone: ${property.timezone}
${property.latitude ? `- Location: ${property.latitude}°N, ${property.longitude}°W` : ""}`);

  // 2. Bed specs
  sections.push(`## Bed: ${bed.name}
- Dimensions: ${bed.widthFt} x ${bed.lengthFt} ft (${activeCells.size} plantable cells)
- Shape: ${bed.shape ?? "RECTANGLE"}
- Type: ${bed.bedType ?? "IN_GROUND"}${bed.heightIn ? ` (${bed.heightIn}" tall)` : ""}
${bed.soilType ? `- Soil: ${bed.soilType}` : ""}
${bed.notes ? `- Notes: ${bed.notes}` : ""}`);

  // 3. Current date context
  const weeksToFrost = differenceInWeeks(firstFrostDate, today);
  const weeksSinceLastFrost = differenceInWeeks(today, lastFrostDate);
  sections.push(`## Current Date
- Today: ${format(today, "yyyy-MM-dd (EEEE, MMMM d)")}
- Season being designed: ${season} ${year}
- Weeks since last frost: ${weeksSinceLastFrost}
- Weeks until first frost: ${weeksToFrost}
- Remaining frost-free days: ${Math.max(0, Math.round((firstFrostDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))}`);

  // 4. Active cells list
  const cellList = Array.from(activeCells).sort();
  sections.push(
    `## Active Cells (${cellList.length} total)\nValid (row-col): ${cellList.join(", ")}`,
  );

  // 5. Available plants with planting calendar
  const plantLines: string[] = [
    "id | name | variety | family | category | perSqFt | spacingIn | sun | water | season | daysToMaturity | heightIn | permLayer | N-fixer | dynAccum | pollinators | toxicity | rootDepthCm | deer | indoorStart | transplant | directSow | estHarvest | tooLate",
  ];

  for (const p of allPlants) {
    // Calculate concrete dates
    let indoorStart = "";
    let transplant = "";
    let directSow = "";
    let estHarvest = "";
    let tooLate = false;

    if (p.startIndoorWeeks != null) {
      const d = addWeeks(lastFrostDate, p.startIndoorWeeks);
      indoorStart = format(d, "MMM d");
      if (isAfter(today, addWeeks(d, 2))) tooLate = true;
    }
    if (p.transplantWeeks != null) {
      const d = addWeeks(lastFrostDate, p.transplantWeeks);
      transplant = format(d, "MMM d");
    }
    if (p.directSowWeeks != null) {
      const d = addWeeks(lastFrostDate, p.directSowWeeks);
      directSow = format(d, "MMM d");
      if (isAfter(today, addWeeks(d, 2)) && !indoorStart) tooLate = true;
    }
    if (p.daysToMaturity) {
      // Estimate from transplant or direct sow date
      const plantDate = p.transplantWeeks != null
        ? addWeeks(lastFrostDate, p.transplantWeeks)
        : p.directSowWeeks != null
          ? addWeeks(lastFrostDate, p.directSowWeeks)
          : null;
      if (plantDate) {
        const harvestDate = new Date(
          plantDate.getTime() + p.daysToMaturity * 24 * 60 * 60 * 1000,
        );
        estHarvest = format(harvestDate, "MMM d");
        // Check if harvest would be after first frost
        if (isAfter(harvestDate, firstFrostDate) && p.seasonType === "WARM") {
          tooLate = true;
        }
      }
    }

    plantLines.push(
      [
        p.id,
        p.name,
        p.variety ?? "",
        p.family?.name ?? "",
        p.category,
        p.plantsPerSqFt ?? "",
        p.spacingInches ?? "",
        p.sunRequirement ?? "",
        p.waterNeed ?? "",
        p.seasonType ?? "",
        p.daysToMaturity ?? "",
        p.plantHeightInches ?? "",
        p.permLayer ?? "",
        p.isNitrogenFixer ? "Y" : "",
        p.isDynamicAccumulator ? "Y" : "",
        p.attractsPollinators ? "Y" : "",
        p.toxicity ?? "",
        p.minRootDepthCm ?? "",
        p.deerResistant ? "Y" : "",
        indoorStart,
        transplant,
        directSow,
        estHarvest,
        tooLate ? "YES" : "",
      ].join(" | "),
    );
  }

  sections.push(`## Available Plants\n${plantLines.join("\n")}`);

  // 6. Companion relationships
  const companionLines: string[] = [];
  for (const c of companions) {
    const nameA = c.plantA.variety
      ? `${c.plantA.name} (${c.plantA.variety})`
      : c.plantA.name;
    const nameB = c.plantB.variety
      ? `${c.plantB.name} (${c.plantB.variety})`
      : c.plantB.name;
    companionLines.push(`${nameA} + ${nameB} = ${c.type}`);
  }
  if (companionLines.length > 0) {
    sections.push(
      `## Companion Relationships (${companionLines.length})\n${companionLines.join("\n")}`,
    );
  }

  // 7. What's already planted this year (for crop rotation)
  const rotationMap = new Map<
    string,
    { bedName: string; plants: Set<string>; families: Set<string> }
  >();
  for (const sq of plantedThisYear) {
    if (!sq.planting?.plant) continue;
    const key = sq.bed.id;
    if (!rotationMap.has(key)) {
      rotationMap.set(key, {
        bedName: sq.bed.name,
        plants: new Set(),
        families: new Set(),
      });
    }
    const entry = rotationMap.get(key)!;
    entry.plants.add(sq.planting.plant.name);
    if (sq.planting.plant.family) {
      entry.families.add(sq.planting.plant.family.name);
    }
  }

  if (rotationMap.size > 0) {
    const rotationLines: string[] = [];
    for (const [id, { bedName, plants, families }] of rotationMap) {
      if (id === bedId) continue; // Skip the current bed
      rotationLines.push(
        `- ${bedName}: ${Array.from(plants).join(", ")}${families.size > 0 ? ` [families: ${Array.from(families).join(", ")}]` : ""}`,
      );
    }
    if (rotationLines.length > 0) {
      sections.push(
        `## Already Planted This Year (${year}) — Other Beds\n${rotationLines.join("\n")}`,
      );
    }
  }

  // 8. Succession planting windows
  const successionPlants = allPlants.filter(
    (p: any) =>
      p.daysToMaturity &&
      p.daysToMaturity <= frostFreeDays / 2 &&
      (p.seasonType === "COOL" || p.daysToMaturity <= 60),
  );
  if (successionPlants.length > 0) {
    const succLines = successionPlants.map((p: any) => {
      const sowings = Math.floor(frostFreeDays / (p.daysToMaturity + 14)); // +14 for prep
      return `- ${p.name}${p.variety ? ` (${p.variety})` : ""}: ${p.daysToMaturity}d maturity, ~${sowings} successive sowings possible`;
    });
    sections.push(
      `## Succession Planting Candidates\n${succLines.join("\n")}`,
    );
  }

  return {
    contextText: sections.join("\n\n"),
    plantLookup,
  };
}
