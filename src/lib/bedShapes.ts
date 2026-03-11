export type BedShape = "RECTANGLE" | "OVAL";

/**
 * Returns the set of active (plantable) cell keys ("row-col") for a given
 * bed shape within its bounding-box grid (lengthFt rows × widthFt cols).
 */
export function getActiveCells(
  widthFt: number,
  lengthFt: number,
  shape: BedShape,
): Set<string> {
  const active = new Set<string>();
  const rows = lengthFt;
  const cols = widthFt;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isCellActive(r, c, rows, cols, shape)) {
        active.add(`${r}-${c}`);
      }
    }
  }
  return active;
}

function isCellActive(
  row: number,
  col: number,
  rows: number,
  cols: number,
  shape: BedShape,
): boolean {
  if (shape === "RECTANGLE") return true;

  if (shape === "OVAL") {
    // Ellipse equation: ((x - cx) / a)² + ((y - cy) / b)² <= 1
    // Use cell-center coordinates
    const cx = (cols - 1) / 2;
    const cy = (rows - 1) / 2;
    const a = cols / 2;
    const b = rows / 2;
    const dx = col - cx;
    const dy = row - cy;
    return (dx * dx) / (a * a) + (dy * dy) / (b * b) <= 1;
  }

  return true;
}
