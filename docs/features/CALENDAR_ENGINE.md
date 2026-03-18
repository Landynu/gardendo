# Calendar Engine

Auto-generates calendar events from plant schedules relative to property frost dates.

## Overview
- Events are generated per plant based on schedule fields (seedStartIndoor, transplant, directSow, harvest weeks)
- Generation is idempotent via `generationKey` (format: `"YYYY:plantId:EVENT_TYPE"`)
- User-edited events (`isUserEdited: true`) are never overwritten by regeneration
- Events tied to property frost dates (last spring frost, first fall frost)

## Architecture

### Key Files
- `src/calendar/queries.ts` — `getCalendarEvents` query
- `src/calendar/actions.ts` — `generateCalendar` action
- `schema.prisma` — `CalendarEvent` model

### Generation Flow
```
User triggers generateCalendar
  → For each Plant with schedule data:
    → Calculate dates relative to property frost dates
    → Create/update CalendarEvent with generationKey
    → Skip events where isUserEdited = true
```

### Event Types
Generated from plant schedule fields:
- `SEED_START_INDOOR` — Based on `seedStartIndoorWeeks` before last frost
- `TRANSPLANT` — Based on `transplantWeeks` after last frost
- `DIRECT_SOW` — Based on `directSowWeeks` relative to frost
- `HARVEST` — Based on `harvestWeeks` after planting

## Configuration
- Property frost dates: `lastFrostDate` ("05-21"), `firstFrostDate` ("09-12")
- Zone 3B defaults: ~112-115 frost-free days

## Related
- [DATABASE_SCHEMA.md](../architecture/DATABASE_SCHEMA.md) — CalendarEvent model
- [PLANT_LIBRARY.md](PLANT_LIBRARY.md) — Plant schedule fields
