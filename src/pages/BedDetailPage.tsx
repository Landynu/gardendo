import {
  useQuery,
  getBedById,
  getPlants,
  saveBedSquares,
  getCompanionships,
} from "wasp/client/operations";
import { type Plant } from "wasp/entities";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Leaf,
  Grid3X3,
  Eraser,
  Save,
  Palette,
  Sparkles,
  X,
  Heart,
  ShieldAlert,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback, type DragEvent } from "react";
import { PlantPalette } from "../components/PlantPalette";
import { AiDesigner } from "../components/AiDesigner";
import { getActiveCells, type BedShape } from "../lib/bedShapes";

const SEASONS = ["SPRING", "SUMMER", "FALL"] as const;

export function BedDetailPage() {
  const { bedId } = useParams();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [season, setSeason] = useState<string>("SPRING");

  // Editing state
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [eraserMode, setEraserMode] = useState(false);
  const [localSquares, setLocalSquares] = useState<Map<string, Plant>>(
    new Map(),
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const {
    data: bed,
    isLoading,
    error,
  } = useQuery(getBedById, {
    id: bedId!,
  });
  const { data: companionships } = useQuery(getCompanionships);
  const { data: allPlants } = useQuery(getPlants, {});

  // Build a lookup map: "plantIdA:plantIdB" -> "BENEFICIAL" | "HARMFUL"
  const companionMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!companionships) return map;
    for (const c of companionships) {
      map.set(`${c.plantAId}:${c.plantBId}`, c.type);
      map.set(`${c.plantBId}:${c.plantAId}`, c.type);
    }
    return map;
  }, [companionships]);

  // Sync server data → localSquares when bed/year/season changes
  // Skip if there are unsaved local edits (e.g. drag-and-drop placement)
  // so that background query refetches don't wipe them out.
  useEffect(() => {
    if (!bed || isDirty) return;
    const map = new Map<string, Plant>();
    for (const sq of bed.squares ?? []) {
      if (sq.year === year && sq.season === season && sq.planting?.plant) {
        map.set(`${sq.row}-${sq.col}`, sq.planting.plant as Plant);
      }
    }
    setLocalSquares(map);
  }, [bed, year, season, isDirty]);

  // Unsaved changes guard
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function handleYearChange(newYear: number) {
    if (isDirty && !window.confirm("You have unsaved changes. Discard them?"))
      return;
    setYear(newYear);
  }

  function handleSeasonChange(newSeason: string) {
    if (isDirty && !window.confirm("You have unsaved changes. Discard them?"))
      return;
    setSeason(newSeason);
  }

  function handleCellClick(row: number, col: number) {
    if (!activeCells.has(`${row}-${col}`)) return;
    const key = `${row}-${col}`;
    const current = localSquares.get(key);

    setLocalSquares((prev) => {
      const next = new Map(prev);
      if (eraserMode) {
        if (current) {
          next.delete(key);
          setIsDirty(true);
        }
      } else if (selectedPlant) {
        next.set(key, selectedPlant);
        setIsDirty(true);
      } else if (current) {
        // No tool selected + planted cell = clear it
        next.delete(key);
        setIsDirty(true);
      } else {
        // No tool, empty cell: open palette on mobile
        if (window.innerWidth < 768) setPaletteOpen(true);
        return prev;
      }
      return next;
    });
  }

  async function handleSave() {
    if (!bed || !isDirty) return;
    setIsSaving(true);
    try {
      const squares: { row: number; col: number; plantId: string | null }[] =
        [];
      for (const [key, plant] of localSquares) {
        if (!activeCells.has(key)) continue;
        const [r, c] = key.split("-").map(Number);
        squares.push({ row: r, col: c, plantId: plant.id });
      }
      await saveBedSquares({
        bedId: bed.id,
        year,
        season,
        squares,
      });
      setIsDirty(false);
    } catch (err) {
      console.error("Failed to save bed squares:", err);
    } finally {
      setIsSaving(false);
    }
  }

  function handleSelectPlant(plant: Plant | null) {
    setSelectedPlant(plant);
    setEraserMode(false);
  }

  function handleToggleEraser() {
    setEraserMode(!eraserMode);
    setSelectedPlant(null);
  }

  const rows = bed?.lengthFt ?? 0;
  const cols = bed?.widthFt ?? 0;

  // Compute active cells based on bed shape
  const activeCells = useMemo(
    () => getActiveCells(cols, rows, (bed?.shape ?? "RECTANGLE") as BedShape),
    [cols, rows, bed?.shape],
  );

  // Derive legend from localSquares
  const legendPlants = getUniquePlants(localSquares);

  // Set of plant IDs currently in this bed (for "In bed" tag in palette)
  const plantedPlantIds = useMemo(() => {
    const ids = new Set<string>();
    for (const plant of localSquares.values()) {
      ids.add(plant.id);
    }
    return ids;
  }, [localSquares]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, row: number, col: number) => {
      e.preventDefault();
      const key = `${row}-${col}`;
      if (!activeCells.has(key)) return;

      try {
        const plant = JSON.parse(
          e.dataTransfer.getData("application/json"),
        ) as Plant;
        setLocalSquares((prev) => {
          const next = new Map(prev);
          next.set(key, plant);
          return next;
        });
        setIsDirty(true);
      } catch {
        // invalid drag data — ignore
      }
    },
    [activeCells],
  );

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-20">
          <Leaf className="text-primary-500 h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !bed) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Grid3X3 className="mb-4 h-12 w-12 text-neutral-300" />
          <p className="text-neutral-500">Garden bed not found</p>
          <Link to="/garden" className="btn-secondary mt-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Garden
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/garden"
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Garden
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="page-title">{bed.name}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {bed.widthFt} x {bed.lengthFt} ft
              {bed.shape && bed.shape !== "RECTANGLE" && ` \u00B7 ${bed.shape.charAt(0) + bed.shape.slice(1).toLowerCase()}`}
              {bed.bedType === "RAISED" && bed.heightIn && ` \u00B7 ${bed.heightIn}" raised`}
              {bed.bedType === "CONTAINER" && bed.heightIn && ` \u00B7 ${bed.heightIn}" container`}
              {bed.soilType && ` \u00B7 ${bed.soilType}`}
              {bed.zone && ` \u00B7 ${bed.zone.name}`}
            </p>
          </div>
        </div>
      </div>

      {/* Year / Season Selector */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-neutral-700">Year</label>
          <div className="flex items-center rounded-lg border border-neutral-300 bg-white">
            <button
              onClick={() => handleYearChange(year - 1)}
              className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              &larr;
            </button>
            <span className="border-x border-neutral-300 px-4 py-1.5 text-sm font-semibold text-neutral-900">
              {year}
            </span>
            <button
              onClick={() => handleYearChange(year + 1)}
              className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              &rarr;
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-neutral-700">Season</label>
          <div className="flex rounded-lg border border-neutral-300 bg-white">
            {SEASONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSeasonChange(s)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  season === s
                    ? "bg-primary-600 text-white"
                    : "text-neutral-600 hover:bg-neutral-50"
                } ${s === "SPRING" ? "rounded-l-lg" : ""} ${s === "FALL" ? "rounded-r-lg" : ""}`}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content: grid + palette */}
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Left: toolbar + grid + legend + notes */}
        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {/* Selected plant indicator */}
            {selectedPlant && (
              <div className="border-primary-200 bg-primary-50 flex items-center gap-2 rounded-lg border px-3 py-1.5">
                <div
                  className="h-5 w-5 rounded"
                  style={{
                    backgroundColor: selectedPlant.sqftColor ?? "#22c55e",
                  }}
                />
                <span className="text-primary-800 text-sm font-medium">
                  {selectedPlant.name}
                </span>
                <button onClick={() => setSelectedPlant(null)}>
                  <X className="text-primary-400 hover:text-primary-600 h-4 w-4" />
                </button>
              </div>
            )}

            {/* Eraser toggle */}
            <button
              onClick={handleToggleEraser}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                eraserMode
                  ? "bg-red-100 text-red-700"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              <Eraser className="h-4 w-4" />
              Eraser
            </button>

            {/* Mobile palette trigger */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-200 md:hidden"
            >
              <Palette className="h-4 w-4" />
              Plants
            </button>

            {/* Design with AI */}
            <button
              onClick={() => setAiPanelOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-accent-100 px-3 py-1.5 text-sm font-medium text-accent-700 hover:bg-accent-200"
            >
              <Sparkles className="h-4 w-4" />
              Design with AI
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Save button */}
            {isDirty && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary"
              >
                {isSaving ? (
                  <Leaf className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save"}
              </button>
            )}
          </div>

          {/* Square Foot Grid */}
          <div className="card overflow-x-auto p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <Grid3X3 className="text-primary-600 h-5 w-5" />
              Bed Layout
            </h2>

            {/* Column labels */}
            <div
              className="mb-1 grid gap-1"
              style={{
                gridTemplateColumns: `2rem repeat(${cols}, minmax(2.75rem, 1fr))`,
              }}
            >
              <div />
              {Array.from({ length: cols }, (_, c) => (
                <div
                  key={c}
                  className="text-center text-xs font-medium text-neutral-400"
                >
                  {c + 1}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            <div className="space-y-1">
              {Array.from({ length: rows }, (_, r) => (
                <div
                  key={r}
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `2rem repeat(${cols}, minmax(2.75rem, 1fr))`,
                  }}
                >
                  {/* Row label */}
                  <div className="flex items-center justify-center text-xs font-medium text-neutral-400">
                    {r + 1}
                  </div>

                  {/* Cells */}
                  {Array.from({ length: cols }, (_, c) => {
                    const key = `${r}-${c}`;
                    const isActive = activeCells.has(key);

                    if (!isActive) {
                      return (
                        <div
                          key={c}
                          className="aspect-square rounded-md bg-neutral-100/50"
                        />
                      );
                    }

                    const plant = localSquares.get(key) ?? null;

                    // Check adjacent cells for companion relationships
                    const neighbors = [
                      [r - 1, c],
                      [r + 1, c],
                      [r, c - 1],
                      [r, c + 1],
                    ];
                    let hasBeneficial = false;
                    let hasHarmful = false;
                    const companionDetails: string[] = [];

                    if (plant && companionMap.size > 0) {
                      const seen = new Set<string>();
                      for (const [nr, nc] of neighbors) {
                        const neighbor = localSquares.get(`${nr}-${nc}`);
                        if (!neighbor || neighbor.id === plant.id) continue;
                        const rel = companionMap.get(
                          `${plant.id}:${neighbor.id}`,
                        );
                        if (!rel) continue;
                        if (rel === "BENEFICIAL") {
                          hasBeneficial = true;
                          if (!seen.has(neighbor.name)) {
                            companionDetails.push(`+ ${neighbor.name}`);
                            seen.add(neighbor.name);
                          }
                        }
                        if (rel === "HARMFUL") {
                          hasHarmful = true;
                          if (!seen.has(neighbor.name)) {
                            companionDetails.push(`! ${neighbor.name}`);
                            seen.add(neighbor.name);
                          }
                        }
                      }
                    }

                    // Preview: when a plant is selected, show what would happen
                    let previewBeneficial = false;
                    let previewHarmful = false;
                    if (!plant && selectedPlant && companionMap.size > 0) {
                      for (const [nr, nc] of neighbors) {
                        const neighbor = localSquares.get(`${nr}-${nc}`);
                        if (!neighbor) continue;
                        const rel = companionMap.get(
                          `${selectedPlant.id}:${neighbor.id}`,
                        );
                        if (rel === "BENEFICIAL") previewBeneficial = true;
                        if (rel === "HARMFUL") previewHarmful = true;
                      }
                    }

                    const tooltipLines = [
                      plant
                        ? `${plant.name}${plant.plantsPerSqFt ? ` (${plant.plantsPerSqFt}/sq ft)` : ""}`
                        : `Empty (${r + 1}, ${c + 1})`,
                      ...companionDetails,
                    ].join("\n");

                    return (
                      <div
                        key={c}
                        onClick={() => handleCellClick(r, c)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, r, c)}
                        className={`group relative flex aspect-square flex-col items-center justify-center rounded-md border-2 text-xs font-bold transition-all ${
                          plant
                            ? `cursor-pointer text-white shadow-sm hover:scale-105 hover:shadow-md ${
                                hasHarmful
                                  ? "border-red-400 ring-1 ring-red-300"
                                  : hasBeneficial
                                    ? "border-emerald-300 ring-1 ring-emerald-200"
                                    : "border-white/40"
                              } ${eraserMode ? "hover:border-red-400" : ""}`
                            : `hover:border-primary-300 hover:bg-primary-50 cursor-pointer border-dashed text-neutral-300 ${
                                previewHarmful
                                  ? "border-red-300 bg-red-50"
                                  : previewBeneficial
                                    ? "border-emerald-300 bg-emerald-50"
                                    : "border-neutral-200 bg-neutral-50"
                              }`
                        }`}
                        style={
                          plant
                            ? {
                                backgroundColor: plant.sqftColor ?? "#22c55e",
                              }
                            : selectedPlant &&
                                !previewBeneficial &&
                                !previewHarmful
                              ? {
                                  borderColor: `${selectedPlant.sqftColor ?? "#22c55e"}40`,
                                }
                              : undefined
                        }
                        title={tooltipLines}
                      >
                        {plant ? (
                          <>
                            <span className="text-xs leading-none sm:text-sm">
                              {plant.name.slice(0, 2).toUpperCase()}
                            </span>
                            {plant.plantsPerSqFt && (
                              <span className="mt-0.5 text-[10px] leading-none opacity-75">
                                {plant.plantsPerSqFt}
                              </span>
                            )}
                            {/* Companion indicator dots */}
                            {(hasBeneficial || hasHarmful) && (
                              <div className="absolute -top-1 -right-1 flex gap-0.5">
                                {hasHarmful && (
                                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] text-white shadow">
                                    !
                                  </span>
                                )}
                                {hasBeneficial && !hasHarmful && (
                                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white shadow">
                                    &#10003;
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Tooltip */}
                            <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded bg-neutral-800 px-2 py-1 text-xs font-normal whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                              {plant.name}
                              {plant.plantsPerSqFt &&
                                ` (${plant.plantsPerSqFt}/sq ft)`}
                              {companionDetails.length > 0 && (
                                <span className="ml-1 text-neutral-300">
                                  {" "}
                                  | {companionDetails.join(", ")}
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs">
                            {previewHarmful
                              ? "!"
                              : previewBeneficial
                                ? "\u2713"
                                : "+"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          {legendPlants.length > 0 && (
            <div className="mt-4">
              <div className="card p-4">
                <h3 className="mb-3 text-sm font-semibold text-neutral-700">
                  Legend
                </h3>
                <div className="flex flex-wrap gap-3">
                  {legendPlants.map((plant) => (
                    <Link
                      key={plant.id}
                      to={`/plants/${plant.id}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-neutral-50"
                    >
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white"
                        style={{
                          backgroundColor: plant.sqftColor ?? "#22c55e",
                        }}
                      >
                        {plant.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm text-neutral-700">
                        {plant.name}
                      </span>
                      {plant.plantsPerSqFt && (
                        <span className="text-xs text-neutral-400">
                          {plant.plantsPerSqFt}/ft²
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Companion indicator legend */}
          {legendPlants.length > 1 && companionMap.size > 0 && (
            <div className="mt-4">
              <div className="card p-4">
                <h3 className="mb-3 text-sm font-semibold text-neutral-700">
                  Companion Planting
                </h3>
                <div className="mb-3 flex flex-wrap gap-4 text-xs text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white">
                      &#10003;
                    </span>
                    Beneficial neighbor
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">
                      !
                    </span>
                    Harmful neighbor
                  </span>
                </div>
                <CompanionSummary
                  plants={legendPlants}
                  companionMap={companionMap}
                />
              </div>
            </div>
          )}

          {/* Bed notes */}
          {bed.notes && (
            <div className="mt-4">
              <div className="card p-4">
                <h3 className="mb-2 text-sm font-semibold text-neutral-700">
                  Notes
                </h3>
                <p className="text-sm text-neutral-500">{bed.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Desktop plant palette */}
        <PlantPalette
          selectedPlant={selectedPlant}
          onSelectPlant={handleSelectPlant}
          eraserMode={eraserMode}
          onToggleEraser={handleToggleEraser}
          isOpen={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          bedPlants={legendPlants}
          companionMap={companionMap}
          plantedPlantIds={plantedPlantIds}
        />
      </div>

      {/* AI Designer panel */}
      {aiPanelOpen && bed && allPlants && (
        <AiDesigner
          bed={{
            ...bed,
            shape: bed.shape ?? "RECTANGLE",
            zone: { propertyId: (bed as any).zone?.property?.id ?? (bed as any).zone?.propertyId },
          }}
          year={year}
          season={season}
          plants={allPlants as Plant[]}
          onAcceptLayout={(squares) => {
            setLocalSquares(squares);
            setIsDirty(true);
          }}
          onClose={() => setAiPanelOpen(false)}
        />
      )}
    </div>
  );
}

function getUniquePlants(squares: Map<string, Plant>): Plant[] {
  const seen = new Set<string>();
  const plants: Plant[] = [];
  for (const plant of squares.values()) {
    if (!seen.has(plant.id)) {
      seen.add(plant.id);
      plants.push(plant);
    }
  }
  return plants.sort((a, b) => a.name.localeCompare(b.name));
}

function CompanionSummary({
  plants,
  companionMap,
}: {
  plants: Plant[];
  companionMap: Map<string, string>;
}) {
  const summaries = plants
    .map((plant) => {
      const beneficial = plants.filter(
        (other) =>
          other.id !== plant.id &&
          companionMap.get(`${plant.id}:${other.id}`) === "BENEFICIAL",
      );
      const harmful = plants.filter(
        (other) =>
          other.id !== plant.id &&
          companionMap.get(`${plant.id}:${other.id}`) === "HARMFUL",
      );

      return {
        plant,
        beneficial,
        harmful,
      };
    })
    .filter(
      (summary) => summary.beneficial.length > 0 || summary.harmful.length > 0,
    );

  if (summaries.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No stored companion guidance connects the plants currently in this bed.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {summaries.map(({ plant, beneficial, harmful }) => (
        <div
          key={plant.id}
          className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3"
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
            style={{ backgroundColor: plant.sqftColor ?? "#22c55e" }}
          >
            {plant.name.slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-neutral-800">{plant.name}</p>
            {plant.variety && (
              <p className="text-xs text-neutral-400">{plant.variety}</p>
            )}

            <div className="mt-2 flex flex-wrap gap-1.5">
              {beneficial.map((match) => (
                <Link
                  key={`beneficial-${plant.id}-${match.id}`}
                  to={`/plants/${match.id}`}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                >
                  <Heart className="h-3 w-3" />
                  {match.name}
                </Link>
              ))}

              {harmful.map((match) => (
                <Link
                  key={`harmful-${plant.id}-${match.id}`}
                  to={`/plants/${match.id}`}
                  className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-200"
                >
                  <ShieldAlert className="h-3 w-3" />
                  {match.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
