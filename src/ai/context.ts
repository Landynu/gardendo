import { addWeeks, format, differenceInWeeks, parse, isAfter } from "date-fns";
import { getActiveCells, type BedShape } from "../lib/bedShapes";
import { decrypt } from "./crypto";

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
  const [property, bed, allPlants, companions, plantedThisYear, currentBedSquares, seedInventory, harvestLogs, journalEntries] =
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
      // What's already placed in THIS bed
      entities.BedSquare.findMany({
        where: {
          bedId,
          year,
          season: season as any,
        },
        include: {
          planting: {
            include: {
              plant: { select: { id: true, name: true, variety: true } },
            },
          },
        },
      }),
      // Seed inventory for this property
      (entities.SeedInventory
        ? entities.SeedInventory.findMany({
            where: { propertyId },
            include: { plant: { select: { id: true, name: true, variety: true } } },
          }).catch(() => [])
        : Promise.resolve([])),
      // Journal entries for this property (recent)
      (entities.JournalEntry
        ? entities.JournalEntry.findMany({
            where: { propertyId },
            orderBy: { date: "desc" },
            take: 5,
          }).catch(() => [])
        : Promise.resolve([])),
      // Harvest logs for this property (last 2 years)
      (entities.HarvestLog
        ? entities.HarvestLog.findMany({
            where: {
              propertyId,
              date: { gte: `${year - 1}-01-01` },
            },
            include: {
              plant: { select: { name: true, variety: true } },
              planting: { include: { plant: { select: { name: true, variety: true } }, bed: { select: { id: true, name: true } } } },
            },
            orderBy: { date: "desc" },
            take: 50,
          }).catch(() => [])
        : Promise.resolve([])),
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

  // 2b. Current bed state (what user has already placed)
  const placedSquares = currentBedSquares.filter((sq: any) => sq.planting?.plant);
  if (placedSquares.length > 0) {
    const placedLines = placedSquares.map((sq: any) => {
      const p = sq.planting.plant;
      const name = p.variety ? `${p.name} (${p.variety})` : p.name;
      return `- Row ${sq.row}, Col ${sq.col}: ${name} [${p.id}]`;
    });
    sections.push(`## Current Bed State (already placed by user)
The user has already placed these plants in this bed. Treat these as fixed unless the user asks to change them. Build your design around them.
${placedLines.join("\n")}`);
  }

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

  // 9. Seed inventory
  if (seedInventory && seedInventory.length > 0) {
    const seedLines = seedInventory.map((si: any) => {
      const name = si.plant.variety
        ? `${si.plant.name} (${si.plant.variety})`
        : si.plant.name;
      const parts = [name];
      if (si.quantity != null) parts.push(`${si.quantity} ${si.unit ?? "seeds"}`);
      if (si.expiryYear) parts.push(`expires ${si.expiryYear}`);
      if (si.germinationRate != null) parts.push(`${si.germinationRate}% germination`);
      return `- ${parts.join(", ")}`;
    });

    const plantIdsInStock = new Set(seedInventory.map((si: any) => si.plantId));
    const plantsWithoutSeeds = allPlants
      .filter((p: any) => !plantIdsInStock.has(p.id))
      .map((p: any) => p.name);

    sections.push(`## Seed Inventory
Seeds in stock for this property:
${seedLines.join("\n")}
${plantsWithoutSeeds.length > 0 ? `\nPlants with NO seeds in stock: ${plantsWithoutSeeds.slice(0, 20).join(", ")}${plantsWithoutSeeds.length > 20 ? ` (+${plantsWithoutSeeds.length - 20} more)` : ""}` : ""}`);
  }

  // 10. Harvest history
  if (harvestLogs && harvestLogs.length > 0) {
    // Filter to harvests relevant to this bed
    const bedHarvests = harvestLogs.filter(
      (h: any) => h.planting?.bed?.id === bedId
    );
    const otherHarvests = harvestLogs.filter(
      (h: any) => !h.planting?.bed || h.planting.bed.id !== bedId
    );

    const harvestLines: string[] = [];

    if (bedHarvests.length > 0) {
      harvestLines.push("### This Bed");
      for (const h of bedHarvests.slice(0, 15)) {
        const name = h.plant
          ? `${h.plant.name}${h.plant.variety ? ` (${h.plant.variety})` : ""}`
          : h.planting?.plant
            ? `${h.planting.plant.name}${h.planting.plant.variety ? ` (${h.planting.plant.variety})` : ""}`
            : "Unknown";
        harvestLines.push(`- ${h.date}: ${name}${h.quantityLbs ? ` — ${h.quantityLbs} lbs` : ""}`);
      }
    }

    if (otherHarvests.length > 0) {
      // Summarize other harvests by plant
      const otherByPlant = new Map<string, number>();
      for (const h of otherHarvests) {
        const name = h.plant?.name ?? h.planting?.plant?.name ?? "Unknown";
        otherByPlant.set(name, (otherByPlant.get(name) ?? 0) + (h.quantityLbs ?? 0));
      }
      harvestLines.push("### Property Totals (past 2 years)");
      for (const [name, lbs] of Array.from(otherByPlant.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
        harvestLines.push(`- ${name}: ${Math.round(lbs * 10) / 10} lbs`);
      }
    }

    if (harvestLines.length > 0) {
      sections.push(`## Harvest History\n${harvestLines.join("\n")}`);
    }
  }

  // 11. Livestock
  if (entities.AnimalGroup) {
    try {
      const animalGroups = await entities.AnimalGroup.findMany({
        where: { propertyId },
        include: {
          animals: { where: { isActive: true }, select: { id: true } },
          eggLogs: { orderBy: { date: "desc" }, take: 7 },
        },
      });

      if (animalGroups.length > 0) {
        const livestockLines = animalGroups.map((g: any) => {
          const count = g.animals.length;
          const weeklyEggs = g.eggLogs.reduce((sum: number, l: any) => sum + l.count, 0);
          let line = `- ${g.name} (${g.animalType.toLowerCase()}): ${count} animals`;
          if (weeklyEggs > 0) line += `, ~${weeklyEggs} eggs/week`;
          return line;
        });
        sections.push(`## Livestock\n${livestockLines.join("\n")}`);
      }
    } catch (e) {
      console.error("AI context: failed to load livestock:", e);
    }
  }

  // 12. Water & Compost
  {
    const resourceLines: string[] = [];

    if (entities.WaterSystem) {
      try {
        const waterSystems = await entities.WaterSystem.findMany({
          where: { propertyId },
          include: { logs: { orderBy: { date: "desc" }, take: 1 } },
        });
        if (waterSystems.length > 0) {
          resourceLines.push("### Water Systems");
          for (const ws of waterSystems) {
            const lastLog = (ws as any).logs?.[0];
            let line = `- ${ws.name}: ${ws.sourceType.toLowerCase()}`;
            if (ws.capacityGallons) line += `, ${ws.capacityGallons} gal capacity`;
            if (lastLog?.levelGallons != null) line += `, currently at ${lastLog.levelGallons} gal`;
            resourceLines.push(line);
          }
        }
      } catch (e) {
        console.error("AI context: failed to load water systems:", e);
      }
    }

    if (entities.CompostBin) {
      try {
        const compostBins = await entities.CompostBin.findMany({
          where: { propertyId },
          include: { logs: { orderBy: { date: "desc" }, take: 1 } },
        });
        if (compostBins.length > 0) {
          resourceLines.push("### Compost");
          for (const cb of compostBins) {
            const lastLog = (cb as any).logs?.[0];
            let line = `- ${cb.name}`;
            if ((cb as any).type) line += ` (${(cb as any).type})`;
            if (lastLog) {
              line += `, last ${lastLog.action.toLowerCase().replace(/_/g, " ")} on ${lastLog.date}`;
              if (lastLog.tempFahrenheit != null) line += ` (${lastLog.tempFahrenheit}°F)`;
            }
            resourceLines.push(line);
          }
        }
      } catch (e) {
        console.error("AI context: failed to load compost bins:", e);
      }
    }

    if (resourceLines.length > 0) {
      sections.push(`## Water & Compost Resources\n${resourceLines.join("\n")}`);
    }
  }

  // 13. Inventory (amendments & supplies)
  if (entities.InventoryItem) {
    try {
      const inventoryItems = await entities.InventoryItem.findMany({
        where: { propertyId, category: { in: ["AMENDMENT", "SUPPLY"] as any } },
      });
      if (inventoryItems.length > 0) {
        const invLines = inventoryItems.map((item: any) => {
          let line = `- ${item.name}`;
          if (item.quantity != null) line += `: ${item.quantity}${item.unit ? ` ${item.unit}` : ""}`;
          return line;
        });
        sections.push(`## Available Amendments & Supplies\n${invLines.join("\n")}`);
      }
    } catch (e) {
      console.error("AI context: failed to load inventory:", e);
    }
  }

  // 14. Recent journal notes
  if (journalEntries && journalEntries.length > 0) {
    const journalLines = journalEntries.map((je: any) => {
      const preview = je.content.length > 120 ? je.content.substring(0, 120) + "..." : je.content;
      return `- ${je.date}: "${preview}"`;
    });
    sections.push(`## Recent Garden Notes\n${journalLines.join("\n")}`);
  }

  // 15. Soil health for this bed
  try {
    const soilLines: string[] = [];

    if (entities.SoilTest) {
      try {
        const soilTests = await entities.SoilTest.findMany({
          where: { propertyId, bedId },
          orderBy: { date: "desc" },
          take: 3,
        });
        if (soilTests.length > 0) {
          const latest = soilTests[0];
          const parts: string[] = [];
          if (latest.ph != null) parts.push(`pH ${latest.ph}`);
          if (latest.nitrogen != null) parts.push(`N: ${latest.nitrogen < 3 ? "low" : latest.nitrogen < 7 ? "moderate" : "high"}`);
          if (latest.phosphorus != null) parts.push(`P: ${latest.phosphorus < 3 ? "low" : latest.phosphorus < 7 ? "moderate" : "high"}`);
          if (latest.potassium != null) parts.push(`K: ${latest.potassium < 3 ? "low" : latest.potassium < 7 ? "moderate" : "high"}`);
          if (latest.organicMatter != null) parts.push(`OM: ${latest.organicMatter}%`);
          if (latest.texture) parts.push(`Texture: ${latest.texture}`);
          soilLines.push(`Latest test (${latest.date}): ${parts.join(", ")}`);

          const needs: string[] = [];
          if (latest.phosphorus != null && latest.phosphorus < 3) needs.push("phosphorus is low");
          if (latest.nitrogen != null && latest.nitrogen < 3) needs.push("nitrogen is low");
          if (latest.potassium != null && latest.potassium < 3) needs.push("potassium is low");
          if (latest.ph != null && latest.ph < 5.5) needs.push("pH is very acidic — consider lime");
          if (latest.ph != null && latest.ph > 7.5) needs.push("pH is alkaline — consider sulfur");
          if (needs.length > 0) soilLines.push(`Soil needs: ${needs.join("; ")}`);
        }
      } catch (e) {
        console.error("AI context: failed to load soil tests:", e);
      }
    }

    if (entities.AmendmentLog) {
      try {
        const amendmentLogs = await entities.AmendmentLog.findMany({
          where: { propertyId, bedId },
          orderBy: { date: "desc" },
          take: 5,
        });
        if (amendmentLogs.length > 0) {
          soilLines.push("Recent amendments:");
          for (const a of amendmentLogs.slice(0, 3)) {
            soilLines.push(`- ${a.date}: ${a.amendment}${a.quantityLbs ? `, ${a.quantityLbs} lbs` : ""}`);
          }
        }
      } catch (e) {
        console.error("AI context: failed to load amendment logs:", e);
      }
    }

    if (soilLines.length > 0) {
      sections.push(`## Soil Health (This Bed)\n${soilLines.join("\n")}`);
    }
  } catch {
    // entities not available — skip
  }

  // 16. Current weather (Tempest if configured, Open-Meteo as fallback/comparison)
  if (property.latitude && property.longitude) {
    try {
      // Always fetch Open-Meteo for regional baseline
      const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${property.latitude}&longitude=${property.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=celsius&timezone=${encodeURIComponent(property.timezone)}&forecast_days=3`;
      const omRes = await fetch(omUrl);
      const omData = omRes.ok ? await omRes.json() : null;

      let tempestData: any = null;
      if (property.weatherApiToken && property.weatherStationId) {
        try {
          const token = decrypt(property.weatherApiToken);
          const tUrl = `https://swd.weatherflow.com/swd/rest/better_forecast?station_id=${property.weatherStationId}&token=${token}&units_temp=c&units_wind=kph&units_pressure=mb&units_precip=mm`;
          const tRes = await fetch(tUrl);
          if (tRes.ok) tempestData = await tRes.json();
        } catch {
          // Tempest fetch failed — use Open-Meteo only
        }
      }

      const weatherLines: string[] = [];

      if (tempestData?.current_conditions) {
        const cc = tempestData.current_conditions;
        weatherLines.push(`Source: Tempest weather station (hyperlocal)`);
        weatherLines.push(`- Temperature: ${Math.round(cc.air_temperature)}°C${cc.feels_like != null ? ` (feels like ${Math.round(cc.feels_like)}°C)` : ""}`);
        if (omData) {
          const diff = Math.round(cc.air_temperature) - Math.round(omData.current.temperature_2m);
          if (Math.abs(diff) >= 2) {
            const dir = diff > 0 ? "warmer" : "colder";
            weatherLines.push(`- Regional forecast: ${Math.round(omData.current.temperature_2m)}°C — your property is ${Math.abs(diff)}°C ${dir}`);
          }
        }
        if (cc.relative_humidity != null) weatherLines.push(`- Humidity: ${Math.round(cc.relative_humidity)}%${cc.dew_point != null ? `, Dew point: ${Math.round(cc.dew_point)}°C` : ""}`);
        if (cc.wind_avg != null) weatherLines.push(`- Wind: ${Math.round(cc.wind_avg)} km/h${cc.wind_gust != null ? `, gusts ${Math.round(cc.wind_gust)} km/h` : ""}`);
        if (cc.uv != null) weatherLines.push(`- UV: ${cc.uv}${cc.solar_radiation != null ? `, Solar: ${Math.round(cc.solar_radiation)} W/m²` : ""}`);
        if (cc.precip_accum_local_day != null && cc.precip_accum_local_day > 0) weatherLines.push(`- Precipitation today: ${cc.precip_accum_local_day}mm`);

        const daily = tempestData.forecast?.daily ?? [];
        const tempestFrost = daily.some((d: any) => d.air_temp_low <= 0);
        const omFrost = omData?.daily?.temperature_2m_min?.some((t: number) => t <= 0) ?? false;

        if (tempestFrost || omFrost) {
          const note = tempestFrost && !omFrost
            ? " (station detects frost risk, regional does not — trust your station)"
            : !tempestFrost && omFrost
              ? " (regional predicts frost, station does not — be cautious)"
              : "";
          weatherLines.push(`- Frost risk: YES${note}`);
        } else {
          weatherLines.push(`- Frost risk: No`);
        }

        if (daily.length > 0) {
          weatherLines.push(`- 3-day highs: ${daily.slice(0, 3).map((d: any) => Math.round(d.air_temp_high) + "°C").join(", ")}`);
          weatherLines.push(`- 3-day lows: ${daily.slice(0, 3).map((d: any) => Math.round(d.air_temp_low) + "°C").join(", ")}`);
        }
      } else if (omData) {
        weatherLines.push(`Source: Open-Meteo (regional)`);
        weatherLines.push(`- Today: ${Math.round(omData.current.temperature_2m)}°C`);
        weatherLines.push(`- 3-day highs: ${omData.daily.temperature_2m_max.map((t: number) => Math.round(t) + "°C").join(", ")}`);
        weatherLines.push(`- 3-day lows: ${omData.daily.temperature_2m_min.map((t: number) => Math.round(t) + "°C").join(", ")}`);
        const frostRisk = omData.daily.temperature_2m_min.some((t: number) => t <= 0);
        weatherLines.push(`- Frost risk: ${frostRisk ? "YES — overnight low at or below 0°C" : "No"}`);
      }

      if (weatherLines.length > 0) {
        sections.push(`## Current Weather\n${weatherLines.join("\n")}`);
      }
    } catch {
      // Weather fetch failed — skip section
    }
  }

  return {
    contextText: sections.join("\n\n"),
    plantLookup,
  };
}
