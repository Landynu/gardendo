# Database Schema

## Overview

PostgreSQL database with ~40 Prisma models. All IDs are String UUIDs. Farm dates stored as `YYYY-MM-DD` strings to avoid timezone drift.

## Core Entity Groups

### User & Property
- **User** — Auth entity (WASP-managed), plus `aiApiKey`, `aiProvider` fields
- **Property** — 25-acre property with frost dates, timezone, custom AI system prompt
- **PropertyMember** — Join table (userId + propertyId + role: OWNER/MEMBER)
- **PropertyInvitation** — Email-based invitations with expiration

### Garden
- **PropertyZone** — Permaculture zones (ZONE_1 through ZONE_5, plus WILD)
- **GardenBed** — Named bed within a zone, with width/length in feet
- **BedSquare** — Individual square foot cell (row, col, plantId reference)
- **Planting** — Lifecycle record: planted date → harvested date, tied to BedSquare
- **BedDesignHistory** — AI design conversation history
- **AiChatSession** — Persistent AI chat sessions per bed

### Plants
- **Plant** — Comprehensive plant data (name, category, spacing, schedule fields, Trefle data)
- **PlantFamily** — Botanical families for companion grouping
- **CompanionPlant** — Many-to-many companion relationships (COMPANION, ANTAGONIST, NEUTRAL)

### Schedule & Tasks
- **CalendarEvent** — Auto-generated from plant schedules relative to frost dates
- **Task** — Manual or auto-generated tasks with status, priority, recurrence

### Animals
- **AnimalGroup** — Flock/herd grouping (type: CHICKEN, GOAT, etc.)
- **Animal** — Individual animals within a group
- **AnimalHealthRecord** — Health tracking per animal
- **EggLog** — Daily egg production logging

### Resources
- **WaterSystem** — Irrigation systems (type: DRIP, SPRINKLER, etc.)
- **WaterLog** — Water usage records
- **CompostBin** — Compost bin tracking
- **CompostLog** — Compost activity records

### Inventory & Harvest
- **SeedInventory** — Seed stock tracking
- **InventoryItem** — General inventory (category: TOOLS, SUPPLIES, etc.)
- **HarvestLog** — Harvest records with weight/quantity

### Photos
- **Photo** — S3 object keys with multiple context relationships (zone, bed, task, animal, harvestLog, inventory, plant)

### Integration
- **AppSettings** — Home Assistant connection config
- **HaSensor** — HA sensor entity tracking
- **HaSensorReading** — Sensor data readings

## Key Relationships

```
User ─┬─ PropertyMember ─── Property ─┬─ PropertyZone ─── GardenBed ─┬─ BedSquare ─── Plant
      │                                │                               ├─ Planting
      │                                │                               ├─ BedDesignHistory
      │                                │                               └─ AiChatSession
      │                                ├─ Task
      │                                ├─ CalendarEvent
      │                                ├─ AnimalGroup ─── Animal ─── AnimalHealthRecord
      │                                ├─ WaterSystem ─── WaterLog
      │                                ├─ CompostBin ─── CompostLog
      │                                └─ Photo
      └─ PropertyInvitation

Plant ─┬─ CompanionPlant (self-referencing many-to-many)
       ├─ PlantFamily
       ├─ BedSquare (current placement)
       ├─ Planting (lifecycle history)
       └─ Photo (display photo)
```

## Enums

- **PropertyRole**: OWNER, MEMBER
- **PermacultureZone**: ZONE_1 through ZONE_5, WILD
- **PlantCategory**: VEGETABLE, FRUIT, HERB, FLOWER, TREE, SHRUB, GRASS, COVER_CROP, OTHER
- **CompanionType**: COMPANION, ANTAGONIST, NEUTRAL
- **TaskStatus**: PENDING, IN_PROGRESS, COMPLETED, SKIPPED
- **TaskPriority**: LOW, MEDIUM, HIGH, URGENT
- **TaskRecurrence**: NONE, DAILY, WEEKLY, BIWEEKLY, MONTHLY, YEARLY
- **AnimalType**: CHICKEN, DUCK, GOOSE, TURKEY, GOAT, SHEEP, PIG, COW, HORSE, RABBIT, BEE, OTHER
- **WaterSourceType**: WELL, MUNICIPAL, RAIN_BARREL, POND, RIVER, OTHER
- **InventoryCategory**: SEEDS, TOOLS, SUPPLIES, AMENDMENTS, FEED, OTHER
