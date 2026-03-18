import { useMemo } from "react";
import { type Plant } from "wasp/entities";
import { getActiveCells, type BedShape } from "../lib/bedShapes";
import type { LayoutCell } from "../lib/aiStream";

type AiGridPreviewProps = {
  widthFt: number;
  lengthFt: number;
  shape: string;
  layout: LayoutCell[];
  plantLookup: Record<string, Plant>;
};

export function AiGridPreview({
  widthFt,
  lengthFt,
  shape,
  layout,
  plantLookup,
}: AiGridPreviewProps) {
  const rows = lengthFt;
  const cols = widthFt;

  const activeCells = useMemo(
    () => getActiveCells(cols, rows, (shape ?? "RECTANGLE") as BedShape),
    [cols, rows, shape],
  );

  // Build a map of row-col -> plant from the layout
  const layoutMap = useMemo(() => {
    const map = new Map<string, Plant>();
    for (const cell of layout) {
      const plant = plantLookup[cell.plantId];
      if (plant) {
        map.set(`${cell.row}-${cell.col}`, plant);
      }
    }
    return map;
  }, [layout, plantLookup]);

  return (
    <div className="overflow-x-auto">
      <div className="space-y-0.5">
        {Array.from({ length: rows }, (_, r) => (
          <div
            key={r}
            className="grid gap-0.5"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(1.75rem, 1fr))`,
            }}
          >
            {Array.from({ length: cols }, (_, c) => {
              const key = `${r}-${c}`;
              const isActive = activeCells.has(key);
              const plant = layoutMap.get(key);

              if (!isActive) {
                return (
                  <div
                    key={c}
                    className="aspect-square rounded-sm bg-neutral-100/30"
                  />
                );
              }

              return (
                <div
                  key={c}
                  className="flex aspect-square items-center justify-center rounded-sm border text-[10px] font-bold text-white"
                  style={{
                    backgroundColor: plant
                      ? (plant.sqftColor ?? "#22c55e")
                      : undefined,
                    borderColor: plant ? "rgba(255,255,255,0.3)" : "#e5e7eb",
                  }}
                  title={plant ? `${plant.name}${plant.variety ? ` (${plant.variety})` : ""}` : "Empty"}
                >
                  {plant ? plant.name.slice(0, 2).toUpperCase() : ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      {layoutMap.size > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Array.from(
            new Map(
              Array.from(layoutMap.values()).map((p) => [p.id, p]),
            ).values(),
          )
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((plant) => (
              <div
                key={plant.id}
                className="flex items-center gap-1 text-[11px] text-neutral-600"
              >
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: plant.sqftColor ?? "#22c55e" }}
                />
                {plant.name}
                {plant.variety ? ` (${plant.variety})` : ""}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
