# Companion Planting

Tracks beneficial and antagonistic relationships between plants.

## Overview
- Self-referencing many-to-many relationship via `CompanionPlant` model
- Three relationship types: COMPANION (beneficial), ANTAGONIST (harmful), NEUTRAL
- Companion chart page for viewing all relationships
- Data used by AI designer for layout suggestions

## Architecture

### Key Files
- `src/plants/queries.ts` — `getCompanionships`
- `src/plants/actions.ts` — `addCompanion`, `removeCompanion`, `updateCompanion`
- `src/pages/CompanionChartPage.tsx` — Visual companion chart
- `src/seeds/` — Seed data for initial companion relationships

### Data Model
```prisma
model CompanionPlant {
  id        String         @id @default(uuid())
  plantA    Plant          @relation("CompanionA", ...)
  plantB    Plant          @relation("CompanionB", ...)
  type      CompanionType  // COMPANION, ANTAGONIST, NEUTRAL
  notes     String?
}
```

### Bidirectional Queries
Companion relationships are bidirectional — querying companions for Plant A checks both `plantAId` and `plantBId` columns.

## Related
- [PLANT_LIBRARY.md](PLANT_LIBRARY.md) — Plant entity
- [AI_DESIGNER.md](AI_DESIGNER.md) — Uses companion data for suggestions
- [GARDEN_BEDS.md](GARDEN_BEDS.md) — Layout planning
