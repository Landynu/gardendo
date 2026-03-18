# Plant Library

Comprehensive plant database with local data and Trefle API enrichment.

## Overview
- Plants are the core entity — referenced by beds, calendar, companions, photos
- Each plant has schedule fields for calendar event generation
- Plant data can be enriched from the Trefle API (external botanical data)
- Plants belong to PlantFamily for companion grouping

## Architecture

### Key Files
- `src/plants/queries.ts` — `getPlants`, `getPlantById`, `getCompanionships`
- `src/plants/actions.ts` — `createPlant`, `updatePlant`, `searchPlants`, `importPlant`, `enrichPlants`
- `src/pages/PlantsPage.tsx` — Plant listing
- `src/pages/PlantDetailPage.tsx` — Plant detail view
- `src/seeds/` — Seed data for initial plant database

### Key Fields
- **Identity**: name, commonName, scientificName, category, plantFamily
- **Schedule**: seedStartIndoorWeeks, transplantWeeks, directSowWeeks, harvestWeeks, daysToGermination, daysToMaturity
- **Spacing**: spacingInches, sqftColor (for grid display)
- **Trefle Data**: soilNutrients, soilHumidity, growthMonths, bloomMonths, fruitMonths, toxicity, edibleParts, appearance fields
- **Sync**: externalSlug, lastSyncedAt (for API sync tracking)

### Trefle API Integration
- `searchPlants` — Search Trefle API for plant data
- `importPlant` — Import a plant from Trefle search results
- `enrichPlants` — Bulk enrich existing plants with Trefle data

## Related
- [CALENDAR_ENGINE.md](CALENDAR_ENGINE.md) — Uses plant schedule fields
- [COMPANION_PLANTING.md](COMPANION_PLANTING.md) — Plant relationships
- [GARDEN_BEDS.md](GARDEN_BEDS.md) — Plants placed in bed grid
