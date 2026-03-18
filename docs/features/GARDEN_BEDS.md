# Garden Beds

Square foot gardening grid system for planning and tracking bed layouts.

## Overview
- Garden beds are rectangular grids measured in feet (widthFt x lengthFt)
- Each cell is a `BedSquare` mapped to a `Plant`
- `Planting` records track the lifecycle (planted → harvested)
- Beds belong to a `PropertyZone` (permaculture zones 1-5 + wild)

## Architecture

### Key Files
- `src/garden/queries.ts` — `getZones`, `getBedById`
- `src/garden/actions.ts` — `createZone`, `createBed`, `saveBedSquares`
- `src/pages/GardenPage.tsx` — Zone/bed listing
- `src/pages/BedDetailPage.tsx` — Bed grid editor
- `schema.prisma` — `GardenBed`, `BedSquare`, `Planting` models

### Grid Rendering
```tsx
<div style={{ gridTemplateColumns: `repeat(${bed.widthFt}, 1fr)` }}>
  {squares.map(sq => <SquareCell key={sq.id} square={sq} />)}
</div>
```

### Data Model
- **BedSquare** is authoritative for current grid layout (row, col, plantId)
- **Planting** is the lifecycle record (plantedDate, harvestedDate, notes)
- `saveBedSquares` batch action handles grid saves with planting lifecycle updates

### AI Integration
- Beds have `BedDesignHistory` for AI design conversations
- `AiChatSession` provides persistent chat sessions per bed
- AI designer suggests plant layouts based on companion planting rules

## Related
- [AI_DESIGNER.md](AI_DESIGNER.md) — AI bed designer
- [COMPANION_PLANTING.md](COMPANION_PLANTING.md) — Companion relationships
- [DATABASE_SCHEMA.md](../architecture/DATABASE_SCHEMA.md) — Schema details
