import {
  useQuery,
  getPlantById,
  getProperties,
  getPlantPhotos,
  getPlants,
  addCompanion,
  updateCompanion,
  removeCompanion,
} from "wasp/client/operations";
import { Link, useParams } from "react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Sun,
  Droplets,
  Ruler,
  Clock,
  Leaf,
  Thermometer,
  Grid3X3,
  Sprout,
  Users,
  Camera,
  ImageIcon,
  Pencil,
  Plus,
  Save,
  Trash2,
  Mountain,
} from "lucide-react";
import { PhotoUpload } from "../components/PhotoUpload";

const categoryLabels: Record<string, string> = {
  VEGETABLE: "Vegetable",
  FRUIT: "Fruit",
  HERB: "Herb",
  FLOWER: "Flower",
  TREE: "Tree",
  SHRUB: "Shrub",
  COVER_CROP: "Cover Crop",
  GRASS: "Grass",
};

const sunLabels: Record<string, string> = {
  FULL_SUN: "Full Sun",
  PARTIAL_SUN: "Partial Sun",
  PARTIAL_SHADE: "Partial Shade",
  FULL_SHADE: "Full Shade",
};

const waterLabels: Record<string, string> = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
};

const seasonLabels: Record<string, string> = {
  COOL: "Cool Season",
  WARM: "Warm Season",
};

const dataSourceLabels: Record<string, string> = {
  SEED: "Seed Data",
  TREFLE: "Trefle",
  USER: "User Added",
};

const companionTypeLabels: Record<CompanionTypeValue, string> = {
  BENEFICIAL: "Beneficial",
  HARMFUL: "Harmful",
  NEUTRAL: "Neutral",
};

const companionTypeColors: Record<CompanionTypeValue, string> = {
  BENEFICIAL: "bg-primary-100 text-primary-700",
  HARMFUL: "bg-red-100 text-red-700",
  NEUTRAL: "bg-neutral-100 text-neutral-600",
};

const companionTypeOrder: Record<CompanionTypeValue, number> = {
  BENEFICIAL: 0,
  NEUTRAL: 1,
  HARMFUL: 2,
};

type PlantPhoto = {
  id: string;
  caption: string | null;
  url: string;
};

type CompanionPlantRef = {
  id: string;
  name: string;
  variety: string | null;
  sqftColor: string | null;
};

type CompanionListItem = {
  id: string;
  plant: CompanionPlantRef;
  type: CompanionTypeValue;
  notes: string | null;
};

type CompanionTypeValue = "BENEFICIAL" | "HARMFUL" | "NEUTRAL";

type CompanionRelationBase = {
  id: string;
  type: CompanionTypeValue;
  notes: string | null;
};

type CompanionRelationWithPlantA = CompanionRelationBase & {
  plantA: CompanionPlantRef;
};

type CompanionRelationWithPlantB = CompanionRelationBase & {
  plantB: CompanionPlantRef;
};

export function PlantDetailPage() {
  const { plantId } = useParams();
  const {
    data: plant,
    isLoading,
    error,
    refetch: refetchPlant,
  } = useQuery(getPlantById, {
    id: plantId!,
  });
  const { data: allPlants } = useQuery(getPlants, {});
  const { data: properties } = useQuery(getProperties);
  const { data: photos, refetch: refetchPhotos } = useQuery(
    getPlantPhotos,
    plantId ? { plantId } : undefined,
  );
  const [photoTab, setPhotoTab] = useState<"yours" | "stock">("yours");
  const [newCompanionPlantId, setNewCompanionPlantId] = useState("");
  const [newCompanionType, setNewCompanionType] =
    useState<CompanionTypeValue>("BENEFICIAL");
  const [newCompanionNotes, setNewCompanionNotes] = useState("");
  const [companionError, setCompanionError] = useState("");
  const [isAddingCompanion, setIsAddingCompanion] = useState(false);
  const [editingCompanionId, setEditingCompanionId] = useState<string | null>(
    null,
  );
  const [editingCompanionType, setEditingCompanionType] =
    useState<CompanionTypeValue>("BENEFICIAL");
  const [editingCompanionNotes, setEditingCompanionNotes] = useState("");
  const [busyCompanionId, setBusyCompanionId] = useState<string | null>(null);

  const property = properties?.[0];

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-20">
          <Leaf className="text-primary-500 h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !plant) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Sprout className="mb-4 h-12 w-12 text-neutral-300" />
          <p className="text-neutral-500">Plant not found</p>
          <Link to="/plants" className="btn-secondary mt-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Plants
          </Link>
        </div>
      </div>
    );
  }

  const companions: CompanionListItem[] = [
    ...((plant.companionsA ?? []) as CompanionRelationWithPlantB[]).map(
      (c) => ({
        id: c.id,
        plant: c.plantB,
        type: c.type,
        notes: c.notes,
      }),
    ),
    ...((plant.companionsB ?? []) as CompanionRelationWithPlantA[]).map(
      (c) => ({
        id: c.id,
        plant: c.plantA,
        type: c.type,
        notes: c.notes,
      }),
    ),
  ].sort((a, b) => {
    const typeDiff =
      (companionTypeOrder[a.type] ?? 99) - (companionTypeOrder[b.type] ?? 99);
    if (typeDiff !== 0) return typeDiff;
    return formatPlantLabel(a.plant).localeCompare(formatPlantLabel(b.plant));
  });

  const availableCompanionPlants = (allPlants ?? []).filter(
    (candidate) =>
      candidate.id !== plant.id &&
      !companions.some((companion) => companion.plant.id === candidate.id),
  );

  const currentPlantId = plant.id;

  const beneficialCompanions = companions.filter(
    (companion) => companion.type === "BENEFICIAL",
  ).length;
  const harmfulCompanions = companions.filter(
    (companion) => companion.type === "HARMFUL",
  ).length;
  const neutralCompanions = companions.filter(
    (companion) => companion.type === "NEUTRAL",
  ).length;

  async function handleAddCompanion(e: React.FormEvent) {
    e.preventDefault();

    if (!newCompanionPlantId) {
      setCompanionError("Choose a companion plant first");
      return;
    }

    setIsAddingCompanion(true);
    setCompanionError("");

    try {
      await addCompanion({
        plantAId: currentPlantId,
        plantBId: newCompanionPlantId,
        type: newCompanionType,
        notes: newCompanionNotes.trim() || undefined,
      });

      setNewCompanionPlantId("");
      setNewCompanionType("BENEFICIAL");
      setNewCompanionNotes("");
      await refetchPlant();
    } catch (err: unknown) {
      setCompanionError(
        getErrorMessage(err, "Failed to add companion relationship"),
      );
    } finally {
      setIsAddingCompanion(false);
    }
  }

  function startEditingCompanion(companion: CompanionListItem) {
    setCompanionError("");
    setEditingCompanionId(companion.id);
    setEditingCompanionType(companion.type);
    setEditingCompanionNotes(companion.notes ?? "");
  }

  function stopEditingCompanion() {
    setEditingCompanionId(null);
    setEditingCompanionType("BENEFICIAL");
    setEditingCompanionNotes("");
  }

  async function handleUpdateExistingCompanion(id: string) {
    setBusyCompanionId(id);
    setCompanionError("");

    try {
      await updateCompanion({
        id,
        type: editingCompanionType,
        notes: editingCompanionNotes.trim(),
      });

      await refetchPlant();
      stopEditingCompanion();
    } catch (err: unknown) {
      setCompanionError(
        getErrorMessage(err, "Failed to update companion relationship"),
      );
    } finally {
      setBusyCompanionId(null);
    }
  }

  async function handleRemoveExistingCompanion(id: string) {
    if (!window.confirm("Remove this companion relationship?")) return;

    setBusyCompanionId(id);
    setCompanionError("");

    try {
      await removeCompanion({ id });
      await refetchPlant();
      if (editingCompanionId === id) stopEditingCompanion();
    } catch (err: unknown) {
      setCompanionError(
        getErrorMessage(err, "Failed to remove companion relationship"),
      );
    } finally {
      setBusyCompanionId(null);
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/plants"
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Plants
        </Link>

        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ backgroundColor: plant.sqftColor ?? "#22c55e" }}
          >
            {plant.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="page-title">{plant.name}</h1>
            {plant.scientificName && (
              <p className="mt-0.5 text-sm text-neutral-500 italic">
                {plant.scientificName}
              </p>
            )}
            {plant.variety && (
              <p className="mt-0.5 text-sm text-neutral-500">
                Variety: {plant.variety}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="bg-primary-100 text-primary-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
                {categoryLabels[plant.category] ?? plant.category}
              </span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {plant.lifecycle.toLowerCase()}
              </span>
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
                {dataSourceLabels[plant.dataSource] ?? plant.dataSource}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Photos Section */}
      <div className="mb-6">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-4">
            <h2 className="text-lg font-semibold text-neutral-900">Photos</h2>
            <div className="flex rounded-lg bg-neutral-100 p-0.5">
              <button
                onClick={() => setPhotoTab("yours")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  photoTab === "yours"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                Your Photos
                {photos && photos.length > 0 && (
                  <span className="bg-primary-100 text-primary-700 ml-1 rounded-full px-1.5 text-xs">
                    {photos.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setPhotoTab("stock")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  photoTab === "stock"
                    ? "bg-white text-neutral-900 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Stock Image
              </button>
            </div>
          </div>

          {photoTab === "yours" ? (
            <div>
              {/* Photo Gallery */}
              {photos && photos.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {photos.map((photo: PlantPhoto) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-square overflow-hidden rounded-lg bg-neutral-100"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || plant.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      {photo.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-xs text-white">{photo.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload */}
              {property && (
                <PhotoUpload
                  propertyId={property.id}
                  plantId={plantId}
                  onUploaded={() => refetchPhotos()}
                />
              )}

              {!property && (
                <p className="text-sm text-neutral-400">
                  Create a property in Settings to upload photos.
                </p>
              )}
            </div>
          ) : (
            <div>
              {plant.imageUrl ? (
                <div className="flex justify-center">
                  <img
                    src={plant.imageUrl}
                    alt={plant.name}
                    className="max-h-80 rounded-lg object-contain"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ImageIcon className="mb-2 h-10 w-10 text-neutral-300" />
                  <p className="text-sm text-neutral-400">
                    No stock image available
                  </p>
                  {plant.dataSource !== "TREFLE" && (
                    <p className="mt-1 text-xs text-neutral-400">
                      Search plants to import a reference image
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Growing Info */}
        <div className="card p-5">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">
            Growing Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {plant.sunRequirement && (
              <InfoItem
                icon={<Sun className="text-accent-500 h-4 w-4" />}
                label="Sun"
                value={sunLabels[plant.sunRequirement] ?? plant.sunRequirement}
              />
            )}
            {plant.waterNeed && (
              <InfoItem
                icon={<Droplets className="h-4 w-4 text-blue-500" />}
                label="Water"
                value={waterLabels[plant.waterNeed] ?? plant.waterNeed}
              />
            )}
            {plant.seasonType && (
              <InfoItem
                icon={<Thermometer className="h-4 w-4 text-orange-500" />}
                label="Season"
                value={seasonLabels[plant.seasonType] ?? plant.seasonType}
              />
            )}
            {plant.hardinessZoneMin && (
              <div className="flex items-start gap-2">
                <Mountain className="mt-0.5 h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-neutral-500">Hardiness Zone</p>
                  <p className="text-sm font-medium text-neutral-800">
                    Zone {plant.hardinessZoneMin}
                    {plant.hardinessZoneMax ? `–${plant.hardinessZoneMax}` : "+"}
                  </p>
                  {property && (
                    <ZoneBadge
                      plantZone={plant.hardinessZoneMin}
                      propertyZone={property.hardinessZone}
                    />
                  )}
                </div>
              </div>
            )}
            {plant.daysToMaturity != null && (
              <InfoItem
                icon={<Clock className="text-primary-500 h-4 w-4" />}
                label="Days to Maturity"
                value={`${plant.daysToMaturity} days`}
              />
            )}
            {plant.daysToGermination != null && (
              <InfoItem
                icon={<Sprout className="text-primary-400 h-4 w-4" />}
                label="Days to Germinate"
                value={`${plant.daysToGermination} days`}
              />
            )}
            {plant.spacingInches != null && (
              <InfoItem
                icon={<Ruler className="text-earth-500 h-4 w-4" />}
                label="Spacing"
                value={`${plant.spacingInches}" apart`}
              />
            )}
            {plant.rowSpacingInches != null && (
              <InfoItem
                icon={<Ruler className="text-earth-400 h-4 w-4" />}
                label="Row Spacing"
                value={`${plant.rowSpacingInches}"`}
              />
            )}
            {plant.plantDepthInches != null && (
              <InfoItem
                icon={<Ruler className="text-earth-600 h-4 w-4" />}
                label="Plant Depth"
                value={`${plant.plantDepthInches}"`}
              />
            )}
            {plant.plantHeightInches != null && (
              <InfoItem
                icon={<Ruler className="text-earth-300 h-4 w-4" />}
                label="Height"
                value={`${plant.plantHeightInches}"`}
              />
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="card p-5">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">
            Schedule (relative to frost date)
          </h2>
          <div className="space-y-3">
            {plant.startIndoorWeeks != null && (
              <ScheduleRow
                label="Start Indoor"
                weeks={plant.startIndoorWeeks}
                color="bg-primary-500"
              />
            )}
            {plant.transplantWeeks != null && (
              <ScheduleRow
                label="Transplant"
                weeks={plant.transplantWeeks}
                color="bg-blue-500"
              />
            )}
            {plant.directSowWeeks != null && (
              <ScheduleRow
                label="Direct Sow"
                weeks={plant.directSowWeeks}
                color="bg-earth-500"
              />
            )}
            {plant.harvestRelativeWeeks != null && (
              <ScheduleRow
                label="Harvest"
                weeks={plant.harvestRelativeWeeks}
                color="bg-amber-500"
              />
            )}
            {plant.startIndoorWeeks == null &&
              plant.transplantWeeks == null &&
              plant.directSowWeeks == null &&
              plant.harvestRelativeWeeks == null && (
                <p className="text-sm text-neutral-400">
                  No schedule data available
                </p>
              )}
          </div>
        </div>

        {/* Square Foot Info */}
        <div className="card p-5">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">
            Square Foot Gardening
          </h2>
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-neutral-200 text-lg font-bold text-white"
              style={{ backgroundColor: plant.sqftColor ?? "#22c55e" }}
            >
              {plant.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              {plant.plantsPerSqFt != null ? (
                <div className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm text-neutral-700">
                    <strong>{plant.plantsPerSqFt}</strong> plants per square
                    foot
                  </span>
                </div>
              ) : (
                <p className="text-sm text-neutral-400">
                  No density data available
                </p>
              )}
              {plant.sqftColor && (
                <div className="mt-1 flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded border border-neutral-200"
                    style={{ backgroundColor: plant.sqftColor }}
                  />
                  <span className="text-sm text-neutral-500">
                    {plant.sqftColor}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Companion Plants */}
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-900">
                <Users className="h-5 w-5 text-neutral-400" />
                Companion Plants
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                These relationships drive the bed-planning highlights and
                warnings.
              </p>
            </div>
            <Link
              to={`/plants/companions?plant=${encodeURIComponent(plant.name)}`}
              className="btn-secondary"
            >
              Chart View
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="bg-primary-100 text-primary-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
              {beneficialCompanions} beneficial
            </span>
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
              {harmfulCompanions} harmful
            </span>
            {neutralCompanions > 0 && (
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                {neutralCompanions} neutral
              </span>
            )}
          </div>

          {companionError && (
            <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {companionError}
            </div>
          )}

          <div className="mt-4 space-y-3">
            {companions.length === 0 ? (
              <p className="text-sm text-neutral-400">
                No companion relationships saved yet.
              </p>
            ) : (
              companions.map((comp) => {
                const isEditing = editingCompanionId === comp.id;
                const isBusy = busyCompanionId === comp.id;

                return (
                  <div
                    key={comp.id}
                    className={`rounded-lg border p-3 ${
                      isEditing
                        ? "border-primary-200 bg-primary-50/60"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <Link
                        to={`/plants/${comp.plant.id}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
                          style={{
                            backgroundColor: comp.plant.sqftColor ?? "#22c55e",
                          }}
                        >
                          {comp.plant.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-800">
                            {comp.plant.name}
                          </p>
                          {comp.plant.variety && (
                            <p className="truncate text-xs text-neutral-400">
                              {comp.plant.variety}
                            </p>
                          )}
                        </div>
                      </Link>

                      {!isEditing && (
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              companionTypeColors[comp.type] ??
                              "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {companionTypeLabels[comp.type] ?? comp.type}
                          </span>
                          <button
                            type="button"
                            onClick={() => startEditingCompanion(comp)}
                            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveExistingCompanion(comp.id)
                            }
                            disabled={isBusy}
                            className="rounded-lg p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-3 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-[10rem,1fr]">
                          <div>
                            <label className="label">Type</label>
                            <select
                              value={editingCompanionType}
                              onChange={(e) =>
                                setEditingCompanionType(
                                  e.target.value as CompanionTypeValue,
                                )
                              }
                              className="focus:border-primary-500 focus:ring-primary-200 mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                            >
                              <option value="BENEFICIAL">Beneficial</option>
                              <option value="HARMFUL">Harmful</option>
                              <option value="NEUTRAL">Neutral</option>
                            </select>
                          </div>
                          <div>
                            <label className="label">Notes</label>
                            <input
                              type="text"
                              value={editingCompanionNotes}
                              onChange={(e) =>
                                setEditingCompanionNotes(e.target.value)
                              }
                              placeholder="Optional notes about this pairing"
                              className="focus:border-primary-500 focus:ring-primary-200 mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateExistingCompanion(comp.id)
                            }
                            disabled={isBusy}
                            className="btn-primary"
                          >
                            {isBusy ? (
                              <Leaf className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={stopEditingCompanion}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      comp.notes && (
                        <p className="mt-2 text-sm text-neutral-500">
                          {comp.notes}
                        </p>
                      )
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-5 border-t border-neutral-200 pt-4">
            <h3 className="text-sm font-semibold text-neutral-700">
              Add Relationship
            </h3>
            <form onSubmit={handleAddCompanion} className="mt-3 space-y-3">
              <div>
                <label className="label">Companion plant</label>
                <select
                  value={newCompanionPlantId}
                  onChange={(e) => setNewCompanionPlantId(e.target.value)}
                  className="focus:border-primary-500 focus:ring-primary-200 mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                >
                  <option value="">Select a plant</option>
                  {availableCompanionPlants.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {formatPlantLabel(candidate)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-[10rem,1fr]">
                <div>
                  <label className="label">Type</label>
                  <select
                    value={newCompanionType}
                    onChange={(e) =>
                      setNewCompanionType(e.target.value as CompanionTypeValue)
                    }
                    className="focus:border-primary-500 focus:ring-primary-200 mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                  >
                    <option value="BENEFICIAL">Beneficial</option>
                    <option value="HARMFUL">Harmful</option>
                    <option value="NEUTRAL">Neutral</option>
                  </select>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <input
                    type="text"
                    value={newCompanionNotes}
                    onChange={(e) => setNewCompanionNotes(e.target.value)}
                    placeholder="Optional notes about this pairing"
                    className="focus:border-primary-500 focus:ring-primary-200 mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  isAddingCompanion ||
                  availableCompanionPlants.length === 0 ||
                  !newCompanionPlantId
                }
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAddingCompanion ? (
                  <Leaf className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add relationship
              </button>

              {availableCompanionPlants.length === 0 && (
                <p className="text-xs text-neutral-400">
                  Every other plant in the catalog is already linked to this
                  plant.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Traits */}
      <div className="mt-6">
        <div className="card p-5">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">
            Traits
          </h2>
          <div className="flex flex-wrap gap-2">
            {plant.isEdible && <TraitBadge label="Edible" />}
            {plant.isMedicinal && <TraitBadge label="Medicinal" />}
            {plant.isNitrogenFixer && <TraitBadge label="Nitrogen Fixer" />}
            {plant.isDynamicAccumulator && (
              <TraitBadge label="Dynamic Accumulator" />
            )}
            {plant.attractsPollinators && (
              <TraitBadge label="Attracts Pollinators" />
            )}
            {plant.deerResistant && <TraitBadge label="Deer Resistant" />}
            {plant.permLayer && (
              <span className="bg-earth-100 text-earth-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
                {plant.permLayer.replace("_", " ").toLowerCase()} layer
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {plant.notes && (
        <div className="mt-6">
          <div className="card p-5">
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              Notes
            </h2>
            <p className="text-sm whitespace-pre-wrap text-neutral-600">
              {plant.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-neutral-400">{label}</p>
        <p className="text-sm font-medium text-neutral-800">{value}</p>
      </div>
    </div>
  );
}

/** Parse zone string like "3B" into a numeric value for comparison (3B = 3.5) */
function zoneToNumber(zone: string): number {
  const match = zone.match(/^(\d+)([AB]?)$/i);
  if (!match) return 0;
  const num = parseInt(match[1], 10);
  const sub = match[2]?.toUpperCase() === "B" ? 0.5 : 0;
  return num + sub;
}

function ZoneBadge({
  plantZone,
  propertyZone,
}: {
  plantZone: string;
  propertyZone: string;
}) {
  const plantNum = zoneToNumber(plantZone);
  const propNum = zoneToNumber(propertyZone);
  // Plant is hardy enough if its minimum zone is <= the property zone
  const isHardy = plantNum <= propNum;

  return (
    <span
      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
        isHardy
          ? "bg-green-50 text-green-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {isHardy
        ? `Hardy in Zone ${propertyZone}`
        : `May not survive Zone ${propertyZone}`}
    </span>
  );
}

function ScheduleRow({
  label,
  weeks,
  color,
}: {
  label: string;
  weeks: number;
  color: string;
}) {
  const direction = weeks < 0 ? "before" : "after";
  const absWeeks = Math.abs(weeks);

  return (
    <div className="flex items-center gap-3">
      <div className={`h-3 w-3 rounded-full ${color}`} />
      <span className="w-28 text-sm font-medium text-neutral-700">{label}</span>
      <span className="text-sm text-neutral-500">
        {absWeeks} week{absWeeks !== 1 ? "s" : ""} {direction} last frost
      </span>
    </div>
  );
}

function TraitBadge({ label }: { label: string }) {
  return (
    <span className="bg-primary-50 text-primary-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
      {label}
    </span>
  );
}

function formatPlantLabel(plant: { name: string; variety?: string | null }) {
  return plant.variety ? `${plant.name} (${plant.variety})` : plant.name;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
