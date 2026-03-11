import { useQuery, getPlants } from "wasp/client/operations";
import { type Plant } from "wasp/entities";
import { Search, Eraser, Leaf, X, Heart, ShieldAlert } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

const CATEGORIES = [
  "ALL",
  "VEGETABLE",
  "FRUIT",
  "HERB",
  "FLOWER",
  "COVER_CROP",
] as const;

const categoryLabels: Record<string, string> = {
  ALL: "All",
  VEGETABLE: "Veg",
  FRUIT: "Fruit",
  HERB: "Herb",
  FLOWER: "Flower",
  COVER_CROP: "Cover",
};

type PlantPaletteProps = {
  selectedPlant: Plant | null;
  onSelectPlant: (plant: Plant | null) => void;
  eraserMode: boolean;
  onToggleEraser: () => void;
  isOpen: boolean;
  onClose: () => void;
  bedPlants?: Plant[];
  companionMap?: Map<string, string>;
};

export function PlantPalette({
  selectedPlant,
  onSelectPlant,
  eraserMode,
  onToggleEraser,
  isOpen,
  onClose,
  bedPlants = [],
  companionMap = new Map(),
}: PlantPaletteProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string>("ALL");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryArgs: { search?: string; category?: string } = {};
  if (debouncedSearch.trim()) queryArgs.search = debouncedSearch.trim();
  if (category !== "ALL") queryArgs.category = category;

  const { data: plants, isLoading } = useQuery(getPlants, queryArgs);

  const uniqueBedPlants = useMemo(() => {
    const seen = new Set<string>();
    return bedPlants.filter((plant) => {
      if (seen.has(plant.id)) return false;
      seen.add(plant.id);
      return true;
    });
  }, [bedPlants]);

  const relationshipCountsByPlantId = useMemo(() => {
    const counts = new Map<
      string,
      { beneficial: number; harmful: number; neutral: number }
    >();

    if (!plants || uniqueBedPlants.length === 0 || companionMap.size === 0) {
      return counts;
    }

    for (const plant of plants) {
      let beneficial = 0;
      let harmful = 0;
      let neutral = 0;

      for (const bedPlant of uniqueBedPlants) {
        if (bedPlant.id === plant.id) continue;

        const relationship = companionMap.get(`${plant.id}:${bedPlant.id}`);
        if (relationship === "BENEFICIAL") beneficial++;
        if (relationship === "HARMFUL") harmful++;
        if (relationship === "NEUTRAL") neutral++;
      }

      counts.set(plant.id, { beneficial, harmful, neutral });
    }

    return counts;
  }, [companionMap, plants, uniqueBedPlants]);

  const selectedPlantRelationshipCounts = selectedPlant
    ? relationshipCountsByPlantId.get(selectedPlant.id)
    : null;

  const content = (
    <div className="flex h-full flex-col">
      {/* Eraser toggle */}
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={onToggleEraser}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            eraserMode
              ? "bg-red-100 text-red-700"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          <Eraser className="h-4 w-4" />
          Eraser
        </button>
        {selectedPlant && (
          <button
            onClick={() => onSelectPlant(null)}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-200"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search plants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-neutral-300 bg-white py-2 pr-4 pl-10 text-sm text-neutral-800 placeholder-neutral-400 focus:ring-1 focus:outline-none"
        />
      </div>

      {/* Category pills */}
      <div className="mb-3 flex gap-1.5 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              category === cat
                ? "bg-primary-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {uniqueBedPlants.length > 0 && (
        <div className="mb-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
              Bed Context
            </p>
            <span className="text-xs text-neutral-400">
              {uniqueBedPlants.length} plant
              {uniqueBedPlants.length === 1 ? "" : "s"} placed
            </span>
          </div>

          {selectedPlant ? (
            <div className="mt-2">
              <p className="text-sm font-medium text-neutral-800">
                {selectedPlant.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(selectedPlantRelationshipCounts?.beneficial ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    <Heart className="h-3.5 w-3.5" />
                    {selectedPlantRelationshipCounts?.beneficial} helpful
                  </span>
                )}
                {(selectedPlantRelationshipCounts?.harmful ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {selectedPlantRelationshipCounts?.harmful} clashes
                  </span>
                )}
                {(selectedPlantRelationshipCounts?.beneficial ?? 0) === 0 &&
                  (selectedPlantRelationshipCounts?.harmful ?? 0) === 0 && (
                    <span className="text-xs text-neutral-500">
                      No companion guidance for the current bed mix
                    </span>
                  )}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-xs text-neutral-500">
              Select a plant to preview how it matches the current bed.
            </p>
          )}
        </div>
      )}

      {/* Plant list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Leaf className="text-primary-500 h-5 w-5 animate-spin" />
          </div>
        ) : !plants || plants.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-400">
            No plants found
          </p>
        ) : (
          <div className="space-y-1">
            {plants.map((plant) => {
              const counts = relationshipCountsByPlantId.get(plant.id);
              const hasBeneficial = (counts?.beneficial ?? 0) > 0;
              const hasHarmful = (counts?.harmful ?? 0) > 0;

              return (
                <button
                  key={plant.id}
                  onClick={() => {
                    onSelectPlant(
                      selectedPlant?.id === plant.id ? null : plant,
                    );
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${
                    selectedPlant?.id === plant.id
                      ? "bg-primary-50 ring-primary-500 ring-2"
                      : hasHarmful
                        ? "bg-red-50/70 hover:bg-red-100"
                        : hasBeneficial
                          ? "bg-emerald-50/70 hover:bg-emerald-100"
                          : "hover:bg-neutral-50"
                  }`}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
                    style={{
                      backgroundColor: plant.sqftColor ?? "#22c55e",
                    }}
                  >
                    {plant.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-800">
                      {plant.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {plant.variety && (
                        <p className="truncate text-xs text-neutral-400">
                          {plant.variety}
                        </p>
                      )}
                      {hasBeneficial && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                          <Heart className="h-3 w-3" />
                          {counts?.beneficial}
                        </span>
                      )}
                      {hasHarmful && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-700">
                          <ShieldAlert className="h-3 w-3" />
                          {counts?.harmful}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {plant.plantsPerSqFt && (
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500">
                        {plant.plantsPerSqFt}/ft²
                      </span>
                    )}
                    {(hasBeneficial || hasHarmful) && (
                      <span className="text-[11px] text-neutral-400">
                        In this bed
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <div className="sticky top-6 w-80">
          <div className="card max-h-[calc(100vh-6rem)] overflow-hidden p-4">
            <h3 className="mb-3 text-sm font-semibold text-neutral-700">
              Plant Palette
            </h3>
            {content}
          </div>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <div className="absolute right-0 bottom-0 left-0 flex max-h-[65vh] flex-col rounded-t-2xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-700">
                Plant Palette
              </h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
