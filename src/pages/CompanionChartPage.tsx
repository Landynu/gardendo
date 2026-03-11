import { useQuery, getPlants, getCompanionships } from "wasp/client/operations";
import { type Plant } from "wasp/entities";
import { Link, useSearchParams } from "react-router";
import {
  ArrowLeft,
  Grid3X3,
  Leaf,
  Search,
  Heart,
  ShieldAlert,
  Minus,
  Layers3,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";

const CATEGORIES = [
  "ALL",
  "VEGETABLE",
  "FRUIT",
  "HERB",
  "FLOWER",
  "TREE",
  "SHRUB",
  "COVER_CROP",
  "GRASS",
] as const;

const categoryLabels: Record<string, string> = {
  ALL: "All",
  VEGETABLE: "Vegetable",
  FRUIT: "Fruit",
  HERB: "Herb",
  FLOWER: "Flower",
  TREE: "Tree",
  SHRUB: "Shrub",
  COVER_CROP: "Cover Crop",
  GRASS: "Grass",
};

type RelationshipType = "BENEFICIAL" | "HARMFUL" | "NEUTRAL" | "MIXED";

type CompanionQueryRow = {
  plantAId: string;
  plantBId: string;
  type: "BENEFICIAL" | "HARMFUL" | "NEUTRAL";
  notes: string | null;
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

type PlantGroup = {
  name: string;
  category: Plant["category"];
  representative: Plant;
  members: Plant[];
};

type FocusedRelationshipItem = {
  group: PlantGroup;
  pair: RelationshipSummary;
};

type RelationshipSummary = {
  key: string;
  plantAName: string;
  plantBName: string;
  type: RelationshipType;
  notes: string[];
  entries: number;
};

const relationshipStyles: Record<
  RelationshipType,
  {
    cell: string;
    badge: string;
    icon: ReactNode;
    label: string;
    mark: string;
  }
> = {
  BENEFICIAL: {
    cell: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    icon: <Heart className="h-3.5 w-3.5" />,
    label: "Beneficial",
    mark: "+",
  },
  HARMFUL: {
    cell: "bg-red-100 text-red-700 hover:bg-red-200",
    badge: "bg-red-100 text-red-700",
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
    label: "Harmful",
    mark: "!",
  },
  NEUTRAL: {
    cell: "bg-neutral-200 text-neutral-600 hover:bg-neutral-300",
    badge: "bg-neutral-200 text-neutral-700",
    icon: <Minus className="h-3.5 w-3.5" />,
    label: "Neutral",
    mark: "~",
  },
  MIXED: {
    cell: "bg-amber-100 text-amber-800 hover:bg-amber-200",
    badge: "bg-amber-100 text-amber-800",
    icon: <Layers3 className="h-3.5 w-3.5" />,
    label: "Mixed",
    mark: "±",
  },
};

export function CompanionChartPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [selectedPairKey, setSelectedPairKey] = useState<string | null>(null);
  const requestedPlantName = searchParams.get("plant")?.trim() ?? "";

  const { data: plants, isLoading: plantsLoading } = useQuery(getPlants, {});
  const { data: companionships, isLoading: companionsLoading } =
    useQuery(getCompanionships);

  const groupedPlants = useMemo(() => {
    const byName = new Map<string, Plant[]>();

    for (const plant of plants ?? []) {
      const existing = byName.get(plant.name) ?? [];
      existing.push(plant);
      byName.set(plant.name, existing);
    }

    return Array.from(byName.entries())
      .map(([name, members]) => {
        const sortedMembers = [...members].sort((a, b) => {
          if (!a.variety && b.variety) return -1;
          if (a.variety && !b.variety) return 1;
          return (a.variety ?? "").localeCompare(b.variety ?? "");
        });

        const representative = sortedMembers[0];
        if (!representative) return null;

        return {
          name,
          category: representative.category,
          representative,
          members: sortedMembers,
        } satisfies PlantGroup;
      })
      .filter(isNotNull)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [plants]);

  const groupByName = useMemo(
    () => new Map(groupedPlants.map((group) => [group.name, group])),
    [groupedPlants],
  );

  const relationshipMap = useMemo(() => {
    const aggregated = new Map<
      string,
      {
        plantAName: string;
        plantBName: string;
        types: Set<"BENEFICIAL" | "HARMFUL" | "NEUTRAL">;
        notes: Set<string>;
        entries: number;
      }
    >();

    for (const row of (companionships ?? []) as CompanionQueryRow[]) {
      const nameA = row.plantA.name;
      const nameB = row.plantB.name;

      if (nameA === nameB) continue;

      const [firstName, secondName] = [nameA, nameB].sort((a, b) =>
        a.localeCompare(b),
      );
      const key = makePairKey(firstName, secondName);

      const current = aggregated.get(key) ?? {
        plantAName: firstName,
        plantBName: secondName,
        types: new Set<"BENEFICIAL" | "HARMFUL" | "NEUTRAL">(),
        notes: new Set<string>(),
        entries: 0,
      };

      current.types.add(row.type);
      if (row.notes?.trim()) current.notes.add(row.notes.trim());
      current.entries += 1;
      aggregated.set(key, current);
    }

    return new Map<string, RelationshipSummary>(
      Array.from(aggregated.entries()).map(([key, value]) => [
        key,
        {
          key,
          plantAName: value.plantAName,
          plantBName: value.plantBName,
          type: resolveRelationshipType(value.types),
          notes: Array.from(value.notes),
          entries: value.entries,
        },
      ]),
    );
  }, [companionships]);

  const visibleGroups = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return groupedPlants.filter((group) => {
      const matchesCategory = category === "ALL" || group.category === category;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        group.name.toLowerCase().includes(normalizedSearch) ||
        group.members.some((member) =>
          (member.variety ?? "").toLowerCase().includes(normalizedSearch),
        );

      return matchesCategory && matchesSearch;
    });
  }, [category, groupedPlants, search]);

  const focusedPlantName = useMemo(() => {
    if (requestedPlantName && groupByName.has(requestedPlantName)) {
      return requestedPlantName;
    }

    if (visibleGroups.length > 0) {
      return visibleGroups[0].name;
    }

    return groupedPlants[0]?.name ?? "";
  }, [groupByName, groupedPlants, requestedPlantName, visibleGroups]);

  const focusedGroup = focusedPlantName
    ? (groupByName.get(focusedPlantName) ?? null)
    : null;

  const focusedRelationships = useMemo(() => {
    if (!focusedGroup) return [];

    return groupedPlants
      .filter((group) => group.name !== focusedGroup.name)
      .map((group) => {
        const pair = relationshipMap.get(
          makePairKey(focusedGroup.name, group.name),
        );
        if (!pair) return null;

        return {
          group,
          pair,
        };
      })
      .filter(isNotNull)
      .sort((a, b) => {
        const typeDiff =
          relationshipSortOrder(a.pair.type) -
          relationshipSortOrder(b.pair.type);
        if (typeDiff !== 0) return typeDiff;
        return a.group.name.localeCompare(b.group.name);
      });
  }, [focusedGroup, groupedPlants, relationshipMap]);

  const selectedPair = selectedPairKey
    ? (relationshipMap.get(selectedPairKey) ?? null)
    : null;

  useEffect(() => {
    if (!requestedPlantName && visibleGroups.length > 0) {
      setSearchParams((current) => {
        current.set("plant", visibleGroups[0].name);
        return current;
      });
    }
  }, [requestedPlantName, setSearchParams, visibleGroups]);

  function handleFocusPlant(name: string) {
    setSearchParams((current) => {
      current.set("plant", name);
      return current;
    });
  }

  if (plantsLoading || companionsLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-20">
          <Leaf className="text-primary-500 h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-6">
        <Link
          to="/plants"
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Plants
        </Link>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="page-title">Companion Chart</h1>
            <p className="mt-1 max-w-3xl text-sm text-neutral-500">
              A grouped matrix of beneficial, harmful, neutral, and mixed
              relationships across the plant catalog. Click a cell to inspect
              the pairing, or use the focused plant summary to jump directly
              into one crop.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
            {(
              [
                "BENEFICIAL",
                "HARMFUL",
                "NEUTRAL",
                "MIXED",
              ] as RelationshipType[]
            ).map((type) => (
              <span
                key={type}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${relationshipStyles[type].badge}`}
              >
                {relationshipStyles[type].icon}
                {relationshipStyles[type].label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="card p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem]">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Filter the matrix by plant or variety..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="focus:border-primary-500 focus:ring-primary-200 w-full rounded-lg border border-neutral-300 bg-white py-2 pr-4 pl-10 text-sm text-neutral-800 placeholder-neutral-400 focus:ring-2 focus:outline-none"
              />
            </div>

            <select
              value={focusedPlantName}
              onChange={(e) => handleFocusPlant(e.target.value)}
              className="focus:border-primary-500 focus:ring-primary-200 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:ring-2 focus:outline-none"
            >
              {groupedPlants.map((group) => (
                <option key={group.name} value={group.name}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  category === cat
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Matrix Scope
          </p>
          <div className="mt-2 space-y-2 text-sm text-neutral-600">
            <p>
              Showing <strong>{visibleGroups.length}</strong> grouped plants
            </p>
            <p>
              Across <strong>{relationshipMap.size}</strong> stored
              relationships
            </p>
            <p className="text-xs text-neutral-400">
              Varieties are grouped under a shared plant name to keep the matrix
              readable.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <div className="card overflow-hidden">
            <div className="border-b border-neutral-200 px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                <Grid3X3 className="text-primary-600 h-5 w-5" />
                Matrix
              </h2>
            </div>

            {visibleGroups.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-neutral-500">
                  No plants match the current filters.
                </p>
              </div>
            ) : (
              <div className="overflow-auto">
                <div
                  className="grid min-w-max"
                  style={{
                    gridTemplateColumns: `14rem repeat(${visibleGroups.length}, 2.75rem)`,
                  }}
                >
                  <div className="sticky top-0 left-0 z-30 border-r border-b border-neutral-200 bg-white px-4 py-3 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                    Plants
                  </div>

                  {visibleGroups.map((group) => (
                    <button
                      key={`column-${group.name}`}
                      type="button"
                      onClick={() => handleFocusPlant(group.name)}
                      title={group.name}
                      className={`sticky top-0 z-20 flex h-16 items-end justify-center border-b border-neutral-200 bg-white px-1 pb-2 text-[11px] font-semibold ${
                        group.name === focusedPlantName
                          ? "text-primary-700"
                          : "text-neutral-500"
                      }`}
                    >
                      <span>{abbreviatePlantName(group.name)}</span>
                    </button>
                  ))}

                  {visibleGroups.map((rowGroup) => (
                    <MatrixRow
                      key={rowGroup.name}
                      rowGroup={rowGroup}
                      columnGroups={visibleGroups}
                      focusedPlantName={focusedPlantName}
                      selectedPairKey={selectedPairKey}
                      relationshipMap={relationshipMap}
                      onSelectPair={setSelectedPairKey}
                      onFocusPlant={handleFocusPlant}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedPair && (
            <div className="card mt-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {selectedPair.plantAName} and {selectedPair.plantBName}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Aggregated from {selectedPair.entries} stored relationship
                    {selectedPair.entries === 1 ? "" : "s"}.
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${relationshipStyles[selectedPair.type].badge}`}
                >
                  {relationshipStyles[selectedPair.type].icon}
                  {relationshipStyles[selectedPair.type].label}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {renderPlantLinks(selectedPair, groupByName)}
              </div>

              {selectedPair.notes.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {selectedPair.notes.map((note) => (
                    <p
                      key={note}
                      className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600"
                    >
                      {note}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-neutral-400">
                  No notes have been stored for this pairing.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  Focused Plant
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Use the dropdown above or click matrix headers to move this
                  summary.
                </p>
              </div>
              {focusedGroup && (
                <Link
                  to={`/plants/${focusedGroup.representative.id}`}
                  className="btn-secondary"
                >
                  Open Plant
                </Link>
              )}
            </div>

            {focusedGroup ? (
              <div className="mt-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-sm font-bold text-white"
                    style={{
                      backgroundColor:
                        focusedGroup.representative.sqftColor ?? "#22c55e",
                    }}
                  >
                    {focusedGroup.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {focusedGroup.name}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {categoryLabels[focusedGroup.category] ??
                        focusedGroup.category}
                      {" · "}
                      {focusedGroup.members.length} variet
                      {focusedGroup.members.length === 1 ? "y" : "ies"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <RelationshipBucket
                    label="Beneficial"
                    type="BENEFICIAL"
                    relationships={focusedRelationships}
                    groupByName={groupByName}
                    onSelectPair={setSelectedPairKey}
                  />
                  <RelationshipBucket
                    label="Harmful"
                    type="HARMFUL"
                    relationships={focusedRelationships}
                    groupByName={groupByName}
                    onSelectPair={setSelectedPairKey}
                  />
                  <RelationshipBucket
                    label="Neutral"
                    type="NEUTRAL"
                    relationships={focusedRelationships}
                    groupByName={groupByName}
                    onSelectPair={setSelectedPairKey}
                  />
                  <RelationshipBucket
                    label="Mixed"
                    type="MIXED"
                    relationships={focusedRelationships}
                    groupByName={groupByName}
                    onSelectPair={setSelectedPairKey}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-neutral-400">
                No focused plant is available.
              </p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-semibold text-neutral-900">
              How To Read It
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600">
              <li>Click a row or column name to focus that plant.</li>
              <li>
                Click any colored cell to inspect the pairing and its notes.
              </li>
              <li>
                Grouped cells combine all stored variety-to-variety
                relationships.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatrixRow({
  rowGroup,
  columnGroups,
  focusedPlantName,
  selectedPairKey,
  relationshipMap,
  onSelectPair,
  onFocusPlant,
}: {
  rowGroup: PlantGroup;
  columnGroups: PlantGroup[];
  focusedPlantName: string;
  selectedPairKey: string | null;
  relationshipMap: Map<string, RelationshipSummary>;
  onSelectPair: (pairKey: string | null) => void;
  onFocusPlant: (plantName: string) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onFocusPlant(rowGroup.name)}
        className={`sticky left-0 z-10 flex items-center justify-between border-r border-b border-neutral-200 px-4 py-2 text-left ${
          rowGroup.name === focusedPlantName
            ? "bg-primary-50 text-primary-700"
            : "bg-white text-neutral-700 hover:bg-neutral-50"
        }`}
      >
        <span className="truncate text-sm font-medium">{rowGroup.name}</span>
        <span className="ml-2 text-xs text-neutral-400">
          {abbreviatePlantName(rowGroup.name)}
        </span>
      </button>

      {columnGroups.map((columnGroup) => {
        if (rowGroup.name === columnGroup.name) {
          return (
            <div
              key={`${rowGroup.name}:${columnGroup.name}`}
              className="flex h-11 items-center justify-center border-b border-neutral-200 bg-neutral-50 text-[10px] text-neutral-300"
            >
              —
            </div>
          );
        }

        const pairKey = makePairKey(rowGroup.name, columnGroup.name);
        const summary = relationshipMap.get(pairKey);

        if (!summary) {
          return (
            <button
              key={pairKey}
              type="button"
              onClick={() => onSelectPair(pairKey)}
              className={`flex h-11 items-center justify-center border-b border-neutral-200 text-[11px] font-semibold text-neutral-300 hover:bg-neutral-50 ${
                selectedPairKey === pairKey ? "ring-2 ring-neutral-300" : ""
              }`}
              title={`${rowGroup.name} and ${columnGroup.name}: no stored relationship`}
            >
              ·
            </button>
          );
        }

        const style = relationshipStyles[summary.type];

        return (
          <button
            key={pairKey}
            type="button"
            onClick={() => onSelectPair(pairKey)}
            className={`flex h-11 items-center justify-center border-b border-neutral-200 text-[11px] font-semibold transition-colors ${style.cell} ${
              selectedPairKey === pairKey
                ? "ring-2 ring-neutral-900/20 ring-inset"
                : ""
            }`}
            title={buildRelationshipTitle(summary)}
          >
            {style.mark}
          </button>
        );
      })}
    </>
  );
}

function RelationshipBucket({
  label,
  type,
  relationships,
  groupByName,
  onSelectPair,
}: {
  label: string;
  type: RelationshipType;
  relationships: FocusedRelationshipItem[];
  groupByName: Map<string, PlantGroup>;
  onSelectPair: (pairKey: string) => void;
}) {
  const items = relationships.filter((item) => item.pair.type === type);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
          {label}
        </p>
        <span className="text-xs text-neutral-400">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-neutral-400">None</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map(({ group, pair }) => (
            <button
              key={pair.key}
              type="button"
              onClick={() => onSelectPair(pair.key)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${relationshipStyles[type].badge}`}
              title={buildRelationshipTitle(pair)}
            >
              {relationshipStyles[type].icon}
              {group.name}
            </button>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-2 space-y-1">
          {items.slice(0, 2).map(({ group }) => {
            const representative = groupByName.get(group.name)?.representative;
            if (!representative) return null;

            return (
              <Link
                key={`${label}-${group.name}`}
                to={`/plants/${representative.id}`}
                className="block text-xs text-neutral-400 hover:text-neutral-600"
              >
                View {group.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function resolveRelationshipType(
  types: Set<"BENEFICIAL" | "HARMFUL" | "NEUTRAL">,
): RelationshipType {
  if (types.size === 0) return "NEUTRAL";
  if (types.size > 1) return "MIXED";
  return Array.from(types)[0];
}

function relationshipSortOrder(type: RelationshipType) {
  switch (type) {
    case "BENEFICIAL":
      return 0;
    case "HARMFUL":
      return 1;
    case "NEUTRAL":
      return 2;
    case "MIXED":
      return 3;
  }
}

function abbreviatePlantName(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part.slice(0, 1))
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function makePairKey(nameA: string, nameB: string) {
  return [nameA, nameB].sort((a, b) => a.localeCompare(b)).join("::");
}

function buildRelationshipTitle(summary: RelationshipSummary) {
  const notes = summary.notes.length > 0 ? `\n${summary.notes.join("\n")}` : "";

  return `${summary.plantAName} and ${summary.plantBName}: ${relationshipStyles[summary.type].label}${notes}`;
}

function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

function renderPlantLinks(
  pair: RelationshipSummary,
  groupByName: Map<string, PlantGroup>,
) {
  return [pair.plantAName, pair.plantBName].map((name) => {
    const representative = groupByName.get(name)?.representative;
    if (!representative) return null;

    return (
      <Link
        key={name}
        to={`/plants/${representative.id}`}
        className="btn-secondary"
      >
        {name}
      </Link>
    );
  });
}
