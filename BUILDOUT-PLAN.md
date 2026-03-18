# GardenDo — Full Homestead Feature Buildout Plan

## Context

GardenDo has a solid core (plant DB, bed grid designer, AI chat, calendar, tasks, companions, multi-user auth) but **11 Prisma models have no UI, queries, or actions**: SeedInventory, HarvestLog, AnimalGroup, Animal, AnimalHealthRecord, EggLog, WaterSystem, WaterLog, CompostBin, CompostLog, InventoryItem. Key homestead workflows are missing entirely.

This plan brings all existing models to life, adds missing features, extracts reusable components to avoid duplication, and expands AI context awareness across every new feature.

## Pre-work: Commit & Push Current Changes

Before starting any implementation, commit and push all current uncommitted work on the main branch.

## Plan File Location

Save this plan as `BUILDOUT-PLAN.md` in the project root alongside `PLAN.md`. Update it as phases are completed.

---

## Phase 0: Reusable Components & Shared Utilities

### Why
Every new page will use the same patterns (filter tabs, empty states, badges, form inputs, inline forms). Currently these are copy-pasted across TasksPage, PlantsPage, DashboardPage, PlantFormModal. Extracting them first prevents 10x duplication.

### Components to Create in `src/components/ui/`

**`FilterTabs.tsx`** — Horizontal pill-style filter buttons
```tsx
type FilterTab<T extends string> = { value: T; label: string }
type Props<T extends string> = {
  tabs: FilterTab<T>[];
  active: T;
  onChange: (value: T) => void;
}
```
- Active: `bg-primary-600 text-white`
- Inactive: `bg-neutral-100 text-neutral-600 hover:bg-neutral-200`
- Used by: TasksPage, PlantsPage, HarvestPage, InventoryPage, AnimalsPage

**`EmptyState.tsx`** — Centered icon + message + optional CTA
```tsx
type Props = {
  icon: LucideIcon;
  message: string;
  subtext?: string;
  actionLabel?: string;
  actionTo?: string;      // Link destination
  onAction?: () => void;  // Button callback
}
```
- Used by: every list page (8+ pages)

**`Badge.tsx`** — Colored status/category badges
```tsx
type Props = { label: string; color: "green" | "blue" | "amber" | "red" | "orange" | "purple" | "earth" | "neutral" }
```
- Maps to consistent `bg-{color}-100 text-{color}-700` pattern
- Used by: TasksPage, DashboardPage, PlantsPage, CalendarPage, + all new pages

**`FormField.tsx`** — Label + input wrapper with consistent styling
```tsx
type Props = {
  label: string;
  required?: boolean;
  help?: string;
  children: React.ReactNode; // the input/select/textarea
}
```
- Wraps the repeated `<label className="label">` + input pattern

**`PageHeader.tsx`** — Title + action buttons row
```tsx
type Props = {
  title: string;
  children?: React.ReactNode; // action buttons
}
```
- Responsive flex layout with gap

**`StatCard.tsx`** — Clickable stat card (Dashboard pattern)
```tsx
type Props = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  to?: string;
  color?: string;
}
```

**`QuickLogForm.tsx`** — Inline collapsible form for quick data entry
```tsx
type Props = {
  title: string;
  open: boolean;
  onToggle: () => void;
  onSubmit: () => Promise<void>;
  saving: boolean;
  children: React.ReactNode; // form fields
}
```
- Used by: EggLog, WaterLog, CompostLog, HarvestLog, SeedStartLog

### Shared Utility: `src/lib/frostDates.ts`

Extract from `src/calendar/actions.ts:31-34`:
```ts
import { parse, addWeeks, format } from "date-fns";

export function computeDateFromFrost(year: number, frostDateMMDD: string, weeksOffset: number): string {
  const frost = parse(`${year}-${frostDateMMDD}`, "yyyy-MM-dd", new Date());
  return format(addWeeks(frost, weeksOffset), "yyyy-MM-dd");
}

export function frostFreedays(lastFrostMMDD: string, firstFrostMMDD: string, year: number): number {
  const last = parse(`${year}-${lastFrostMMDD}`, "yyyy-MM-dd", new Date());
  const first = parse(`${year}-${firstFrostMMDD}`, "yyyy-MM-dd", new Date());
  return Math.round((first.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}
```
Refactor `src/calendar/actions.ts` to import from this shared utility.

### Input Style Constant: `src/lib/styles.ts`
```ts
export const INPUT_CLASS = "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none";
export const SELECT_CLASS = INPUT_CLASS;
export const TEXTAREA_CLASS = INPUT_CLASS;
```

### Files to Create
- `src/components/ui/FilterTabs.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/FormField.tsx`
- `src/components/ui/PageHeader.tsx`
- `src/components/ui/StatCard.tsx`
- `src/components/ui/QuickLogForm.tsx`
- `src/lib/frostDates.ts`
- `src/lib/styles.ts`

### Files to Modify
- `src/calendar/actions.ts` — import `computeDateFromFrost` from shared utility
- Optionally refactor existing pages (TasksPage, PlantsPage, DashboardPage) to use new components — but this can be done incrementally per phase

---

## Phase 1: Seed Starting & Seed Management

### Why
Seed starting is the most time-sensitive homestead activity — miss your indoor start window in Zone 3B and you lose weeks. The `SeedInventory` model exists but has zero UI.

### Schema Changes (`schema.prisma`)

**Enhance SeedInventory** — add fields:
```prisma
germinationRate  Int?
storageLocation  String?
seedSource       String?    // PURCHASED | SAVED | TRADED | GIFTED
property         Property @relation(fields: [propertyId], references: [id])
propertyId       String
```
Add reverse relation `seedInventory SeedInventory[]` to Property. Add `startLogs SeedStartLog[]` reverse relation.

**New model: SeedStartLog**
```prisma
model SeedStartLog {
  id               String   @id @default(uuid())
  date             String   // YYYY-MM-DD
  cellsStarted     Int
  cellsSprouted    Int?
  sproutedDate     String?  // YYYY-MM-DD
  transplantedDate String?  // YYYY-MM-DD
  medium           String?
  location         String?
  heatMat          Boolean  @default(false)
  lightHours       Int?
  notes            String?
  seedInventory    SeedInventory @relation(fields: [seedInventoryId], references: [id])
  seedInventoryId  String
  plant            Plant    @relation(fields: [plantId], references: [id])
  plantId          String
  property         Property @relation(fields: [propertyId], references: [id])
  propertyId       String
  user             User     @relation(fields: [userId], references: [id])
  userId           String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

### WASP Declarations (`main.wasp`)

Routes: `/seeds` → SeedInventoryPage, `/seeds/starting` → SeedStartingPage

Queries:
- `getSeedInventory` — filter by property, plant, year, expiry. Include plant + startLogs.
- `getSeedStartLogs` — filter by property, activeOnly (transplantedDate null). Include seed inventory + plant.
- `getSeedStartingSchedule` — **computed**: parses frost dates, computes start dates for all plants with `startIndoorWeeks`/`directSowWeeks`, groups into "this week"/"next week"/"upcoming". Cross-references seed inventory for stock status.

Actions:
- `createSeedInventory`, `updateSeedInventory`, `deleteSeedInventory`
- `createSeedStartLog`, `updateSeedStartLog`

### Backend: `src/seeds/queries.ts`, `src/seeds/actions.ts`

**`getSeedStartingSchedule`** — the key query:
1. Fetch property frost dates
2. Use `computeDateFromFrost()` from `src/lib/frostDates.ts`
3. For each plant with `startIndoorWeeks`/`directSowWeeks`, compute target date
4. Group by: thisWeekIndoor, nextWeekIndoor, thisWeekDirectSow, nextWeekDirectSow, upcoming
5. Cross-reference `SeedInventory` to mark "in stock" vs "need to order"

### Frontend Pages

**`src/pages/SeedInventoryPage.tsx`:**
- Uses `FilterTabs` for category filter (ALL, VEGETABLE, HERB, FLOWER...)
- Search by plant name
- Seed cards: plant name, quantity/unit, supplier, year, expiry, germination rate, source Badge
- `QuickLogForm` for adding new seed packets
- Tab/link to `/seeds/starting`

**`src/pages/SeedStartingPage.tsx`** — the killer feature:
- Sections using `StatCard` at top: "Seeds to Start This Week", "Active Trays", "Seeds in Stock"
- "Start Indoors This Week" — cards per plant with: name, start date, days to germination, seed stock Badge, "Log Start" button
- "Direct Sow This Week" — same pattern
- "Coming Up Next Week" — preview
- "Active Trays" — `SeedStartLog` entries where transplantedDate is null. Progress badges: Started → Sprouted → Ready to Transplant
- "Full Schedule" — scrollable timeline of all upcoming seed activities

### AI Context Expansion

Add to `src/ai/context.ts` → `buildBedDesignContext()`:

**New section: "Seed Inventory Status"**
```
## Seed Inventory
Seeds in stock for this property:
- Tomato (Roma): 50 seeds, expires 2027, 85% germination
- Lettuce (Buttercrunch): 200 seeds, expires 2026
Plants with NO seeds in stock: [list]
```

**Why this helps the AI:** When designing a bed layout, the AI can prioritize plants the user actually has seeds for, and note when suggesting plants that aren't in inventory.

### Files to Create
- `src/seeds/queries.ts`
- `src/seeds/actions.ts`
- `src/pages/SeedInventoryPage.tsx`
- `src/pages/SeedStartingPage.tsx`

### Files to Modify
- `schema.prisma`, `main.wasp`, `src/App.tsx`, `src/ai/context.ts`

---

## Phase 2: Harvest Tracking

### Schema Changes (`schema.prisma`)
- Make `HarvestLog.plantingId` optional (String?)
- Add `plantId String?` + Plant relation (quick-log without selecting a planting)
- Add `propertyId String` + Property relation

### Backend: `src/harvest/queries.ts`, `src/harvest/actions.ts`

**`getHarvestLogs`** — filter by property, plant, year. Include plant, planting.plant, user.
**`getHarvestSummary`** — aggregate: total lbs, count, group by plant, group by month.

### Frontend: `src/pages/HarvestPage.tsx`

- `StatCard` row: "Total Harvest (lbs)", "Harvests This Year", "Top Plant"
- `FilterTabs` for year
- Plant filter dropdown
- `QuickLogForm`: plant selector, date (default today), weight, notes
- Harvest log list with `Badge` for plant category

### AI Context Expansion

Add to `buildBedDesignContext()`:

**New section: "Harvest History for This Bed"**
```
## Harvest History (this bed, past 2 years)
- 2025 SUMMER: Tomato (Roma) — 45 lbs from 6 sq ft
- 2025 SUMMER: Basil (Genovese) — 3 lbs from 2 sq ft
- 2024 SUMMER: Pepper (Bell) — 12 lbs from 4 sq ft
```

**Why:** AI can recommend plants that historically produce well in this bed, suggest crop rotation away from recent families, and set yield expectations.

### Files to Create
- `src/harvest/queries.ts`, `src/harvest/actions.ts`, `src/pages/HarvestPage.tsx`

### Files to Modify
- `schema.prisma`, `main.wasp`, `src/App.tsx`, `src/ai/context.ts`

---

## Phase 3: Weather Dashboard Widget

### No Schema Changes — weather is ephemeral.

### Backend: `src/weather/queries.ts`

**`getWeather`** — fetches from Open-Meteo using property lat/lon:
```
https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&temperature_unit=celsius&timezone=${tz}&forecast_days=3
```
Returns: current conditions, 3-day forecast, `frostWarning: boolean` (any daily min <= 0°C).

### Frontend: `src/components/WeatherWidget.tsx`

- Current temp + weather icon (map Open-Meteo codes to lucide: Sun, Cloud, CloudRain, CloudSnow, Wind)
- 3-day forecast strip
- Frost warning banner (amber/red alert)

Integrate into `src/pages/DashboardPage.tsx` as top widget.

### AI Context Expansion

Add to `buildBedDesignContext()`:

**New section: "Current Weather Context"**
```
## Current Weather
Today: 12°C, partly cloudy. Frost warning: YES (overnight low -2°C expected)
3-day outlook: warming trend, highs 15-18°C
Last frost risk: still present
```

**Why:** AI can factor current conditions into transplanting recommendations ("wait until frost risk passes this week before transplanting these seedlings").

### Files to Create
- `src/weather/queries.ts`, `src/components/WeatherWidget.tsx`

### Files to Modify
- `main.wasp`, `src/pages/DashboardPage.tsx`, `src/ai/context.ts`

---

## Phase 4: Garden Journal

### Schema Changes
```prisma
model JournalEntry {
  id           String   @id @default(uuid())
  date         String   // YYYY-MM-DD
  content      String
  weatherNotes String?
  mood         String?  // great | good | okay | tough
  property     Property @relation(fields: [propertyId], references: [id])
  propertyId   String
  user         User     @relation(fields: [userId], references: [id])
  userId       String
  photos       Photo[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@unique([propertyId, date, userId])
}
```
Add optional `journalEntryId` to Photo model.

### Backend: `src/journal/queries.ts`, `src/journal/actions.ts`

**`getJournalEntries`** — search content, date range, limit 30.
**`createJournalEntry`** — upsert by unique constraint (same day updates).

### Frontend: `src/pages/JournalPage.tsx`

- "Today's Entry" section at top (create/edit textarea, mood selector, weather notes)
- Search bar for past entries
- Past entries as expandable cards: date, content preview, mood Badge, photo count

### AI Context Expansion

Add to `buildBedDesignContext()`:

**New section: "Recent Journal Notes (this bed)"**
```
## Recent Garden Notes
- 2026-03-15: "Noticed aphids on the brassica bed. Applied neem oil spray."
- 2026-03-10: "Soil in raised bed #3 looks compacted. Need to add compost before planting."
```

**How:** Search journal entries for mentions of the bed name or plants in the bed. Include last 5 relevant entries.

**Why:** AI gains awareness of pest pressure, soil observations, and user concerns that aren't captured in structured data.

### Files to Create
- `src/journal/queries.ts`, `src/journal/actions.ts`, `src/pages/JournalPage.tsx`

### Files to Modify
- `schema.prisma`, `main.wasp`, `src/App.tsx`, `src/ai/context.ts`

---

## Phase 5: Livestock & Animals

### Schema Changes
Expand `AnimalType` enum: add DUCK, GOOSE, TURKEY, GOAT, SHEEP, PIG, COW, RABBIT, BEE, OTHER.

### Backend: `src/animals/queries.ts`, `src/animals/actions.ts`

**`getAnimalGroups`** — by property. Include animal count, last 7 days egg total.
**`getAnimalGroupById`** — full detail with animals, health records (last 10), egg logs (last 30 days).
**`getEggSummary`** — aggregate by group, day, week.

Actions: CRUD for groups, animals, health records, egg logs.

### Frontend

**`src/pages/AnimalsPage.tsx`:**
- Group cards with `Badge` for animal type, count, egg total
- `QuickLogForm` for egg logging: group selector, date, count, notes
- `StatCard` row: "Total Animals", "Eggs This Week", "Groups"

**`src/pages/AnimalGroupDetailPage.tsx`:**
- Group header with details
- Animals list (name, breed, status Badge, age)
- Health records section with inline add form
- Egg log history table

### AI Context Expansion

**New section in system context (not bed-specific):**
```
## Livestock
- Chickens (12 hens, 1 rooster): avg 8 eggs/day, free-range in Zone 3
```

**Why:** AI can consider animal integration in garden design (e.g., "this bed is near the chicken run — consider plants that benefit from proximity to poultry, or plants that need protection from scratching").

### Files to Create
- `src/animals/queries.ts`, `src/animals/actions.ts`
- `src/pages/AnimalsPage.tsx`, `src/pages/AnimalGroupDetailPage.tsx`

### Files to Modify
- `schema.prisma`, `main.wasp`, `src/App.tsx`, `src/ai/context.ts`

---

## Phase 6: Water & Compost Systems

### No Schema Changes — models exist and are complete.

### Backend: `src/systems/queries.ts`, `src/systems/actions.ts`

Queries: `getWaterSystems` (with latest log), `getCompostBins` (with latest log).
Actions: create systems/bins, create log entries.

### Frontend: `src/pages/SystemsPage.tsx`

Split page with two sections:

**Water Systems:**
- System cards: name, source type Badge, capacity, last level
- `QuickLogForm`: date, level gallons, usage gallons, notes

**Compost Bins:**
- Bin cards: name, type, capacity, last action, last temp
- `QuickLogForm`: date, action (TURN/ADD_GREEN/ADD_BROWN/WATER/HARVEST), temp, notes

### AI Context Expansion

**New section: "Water & Compost Resources"**
```
## Water Systems
- Rainwater tank: 500 gal capacity, currently at 320 gal
- Well: unlimited, 5 gpm

## Compost
- Bin A: Active, last turned 2026-03-15, temp 140°F (hot composting)
- Bin B: Curing, ready for use ~April
```

**Why:** AI can factor water availability into plant recommendations (drought-tolerant choices if water is limited) and suggest compost application timing.

### Files to Create
- `src/systems/queries.ts`, `src/systems/actions.ts`, `src/pages/SystemsPage.tsx`

### Files to Modify
- `main.wasp`, `src/App.tsx`, `src/ai/context.ts`

---

## Phase 7: Inventory & Supplies

### No Schema Changes — InventoryItem model is complete.

### Backend: `src/inventory/queries.ts`, `src/inventory/actions.ts`

**`getInventoryItems`** — filter by property, category, search.
CRUD actions.

### Frontend: `src/pages/InventoryPage.tsx`

- `FilterTabs` for category: ALL, TOOL, AMENDMENT, FEED, SUPPLY, SEED
- Search by name
- Item cards: name, category Badge, quantity + unit, location, condition Badge
- Low stock highlight (quantity <= 1 or user-defined threshold)
- Inline CRUD forms

### AI Context Expansion

**New section: "Available Amendments & Supplies"**
```
## Inventory (Amendments)
- Bone meal: 10 lbs
- Garden lime: 25 lbs
- Fish emulsion: 1 gallon
```

**Why:** AI can suggest soil amendments the user actually has on hand when recommending bed prep.

### Files to Create
- `src/inventory/queries.ts`, `src/inventory/actions.ts`, `src/pages/InventoryPage.tsx`

### Files to Modify
- `main.wasp`, `src/App.tsx`, `src/ai/context.ts`

---

## Phase 8: Soil Health Tracking

### Schema Changes
```prisma
model SoilTest {
  id            String     @id @default(uuid())
  date          String     // YYYY-MM-DD
  ph            Float?
  nitrogen      Float?
  phosphorus    Float?
  potassium     Float?
  organicMatter Float?
  texture       String?
  notes         String?
  bed           GardenBed? @relation(fields: [bedId], references: [id])
  bedId         String?
  property      Property   @relation(fields: [propertyId], references: [id])
  propertyId    String
  user          User       @relation(fields: [userId], references: [id])
  userId        String
  createdAt     DateTime   @default(now())
}

model AmendmentLog {
  id           String     @id @default(uuid())
  date         String     // YYYY-MM-DD
  amendment    String
  quantityLbs  Float?
  areaSqFt     Float?
  notes        String?
  bed          GardenBed? @relation(fields: [bedId], references: [id])
  bedId        String?
  property     Property   @relation(fields: [propertyId], references: [id])
  propertyId   String
  user         User       @relation(fields: [userId], references: [id])
  userId       String
  createdAt    DateTime   @default(now())
}
```

### Frontend: `src/pages/SoilPage.tsx`

- Bed selector dropdown
- Soil test history table (date, pH, N-P-K, organic matter)
- Amendment log table (date, amendment, quantity, bed)
- Inline forms for both
- Simple trend: pH values listed chronologically for selected bed

### AI Context Expansion — **This is the highest-value AI integration**

**New section: "Soil Data for This Bed"**
```
## Soil Health (Bed: Raised Bed #3)
Latest test (2026-03-01): pH 6.8, N: moderate, P: low, K: adequate, OM: 4.2%
Texture: loam
Recent amendments:
- 2026-03-10: Bone meal, 2 lbs (for phosphorus)
- 2026-02-15: Compost, 20 lbs

Soil needs: phosphorus is low — favor plants that are light P feeders, or recommend bone meal application before planting.
```

**Why:** This is transformative for AI recommendations. The AI can now suggest plants matched to actual soil conditions, recommend amendments before planting, and avoid plants that won't thrive in the bed's pH range.

### Files to Create
- `src/soil/queries.ts`, `src/soil/actions.ts`, `src/pages/SoilPage.tsx`

### Files to Modify
- `schema.prisma`, `main.wasp`, `src/App.tsx`, `src/ai/context.ts`

---

## Phase 9: Succession Planting UI

### No New Models — uses existing BedSquare (year/season), Planting, BedDesignHistory.

### Implementation

New query: `getSuccessionPlan` — fetches BedSquare data for all 3 seasons for a bed+year, structured as a timeline.

**Enhance `src/pages/BedDetailPage.tsx`:**
- Add "Succession Plan" tab alongside grid view
- Timeline showing SPRING → SUMMER → FALL for each cell group
- Ability to copy/modify layouts between seasons
- Button to generate calendar events for succession plantings

### AI Prompt Enhancement

Update `src/ai/prompts.ts` to add a dedicated succession planning mode:
```
When the user asks about succession planting:
1. Review the current season's layout
2. Identify cells that will be free after early-season crops mature
3. Suggest follow-up plantings with specific timing
4. Consider soil depletion (rotate families between successions)
5. Account for decreasing daylight in fall successions
```

---

## Phase 10: Dashboard Enhancements

### Enhance `src/pages/DashboardPage.tsx`

Add conditional widgets (only render if user has data for that feature):

1. **Weather widget** (Phase 3) — top row
2. **"Seeds to Start This Week"** — from `getSeedStartingSchedule`, compact list
3. **Active seed trays** — count from `getSeedStartLogs` activeOnly
4. **Harvest season progress** — from `getHarvestSummary`, total lbs this year
5. **Today's egg count** — from `getEggSummary`
6. **Frost countdown** — days until first fall frost / days since last spring frost

Each widget is a `StatCard` or small card component.

---

## Navigation Restructuring (`src/App.tsx`)

### Sidebar Grouping
```typescript
const navSections = [
  { items: [{ path: "/", label: "Dashboard", icon: LayoutDashboard }] },
  { label: "Garden", items: [
    { path: "/plants", label: "Plants", icon: Sprout },
    { path: "/seeds", label: "Seeds", icon: Flower2 },
    { path: "/garden", label: "Garden", icon: Grid3X3 },
    { path: "/soil", label: "Soil", icon: Mountain },
  ]},
  { label: "Tracking", items: [
    { path: "/calendar", label: "Calendar", icon: CalendarDays },
    { path: "/tasks", label: "Tasks", icon: CheckSquare },
    { path: "/harvest", label: "Harvest", icon: Apple },
    { path: "/journal", label: "Journal", icon: BookOpen },
  ]},
  { label: "Property", items: [
    { path: "/animals", label: "Animals", icon: Bird },
    { path: "/systems", label: "Systems", icon: Droplets },
    { path: "/inventory", label: "Inventory", icon: Package },
  ]},
  { items: [{ path: "/settings", label: "Settings", icon: Settings }] },
];
```

**Mobile:** Keep 5 bottom nav icons (Dashboard, Plants, Garden, Calendar, Tasks). Expand hamburger menu to include all nav items grouped by section.

---

## AI Context Architecture

### Current State (`src/ai/context.ts`)
The `buildBedDesignContext()` function builds a text prompt with: property climate, bed specs, current state, date context, active cells, available plants table, companion relationships, crop rotation (other beds), succession candidates.

### Expansion Strategy

Each phase adds a new section to `buildBedDesignContext()`. The function gains optional parameters to control which sections to include (to keep context size manageable):

```typescript
export async function buildBedDesignContext(
  entities: ContextEntities,
  propertyId: string,
  bedId: string,
  year: number,
  season: string,
  options?: {
    includeSeedInventory?: boolean;   // Phase 1
    includeHarvestHistory?: boolean;  // Phase 2
    includeWeather?: boolean;         // Phase 3
    includeJournalNotes?: boolean;    // Phase 4
    includeLivestock?: boolean;       // Phase 5
    includeWaterCompost?: boolean;    // Phase 6
    includeInventory?: boolean;       // Phase 7
    includeSoilData?: boolean;        // Phase 8
  }
)
```

Default: all available sections enabled. Each section adds ~5-15 lines of context text. Total additional context across all phases: ~80-120 lines — well within model limits.

### AI System Prompt Updates (`src/ai/prompts.ts`)

Expand the DEFAULT_SYSTEM_PROMPT with awareness of new data sections:

```
You have access to the following context about this property:
- Seed inventory: what seeds are in stock and their viability
- Harvest history: past yields from this bed and others
- Current weather: conditions and frost warnings
- Garden journal: recent observations about this bed
- Livestock: animal locations and integration opportunities
- Water/compost: available resources and readiness
- Inventory: amendments and supplies on hand
- Soil tests: pH, nutrients, and recent amendments for this bed

Use ALL available context to make informed, practical recommendations.
When suggesting plants, note if seeds are in stock or need to be ordered.
When suggesting amendments, reference what's in inventory.
When timing transplants, consider current weather and frost warnings.
Factor soil test results into plant selection and prep recommendations.
```

### WASP Entity Access

For the AI endpoint (`src/ai/designApi.ts`) to access new entities, update the api declaration in `main.wasp`:
```
api aiDesignBed {
  ...
  entities: [...existing..., SeedInventory, HarvestLog, JournalEntry,
             AnimalGroup, WaterSystem, CompostBin, InventoryItem,
             SoilTest, AmendmentLog]
}
```

---

## Migration Strategy

Each phase with schema changes gets its own migration:
1. Phase 1: `wasp db migrate-dev --name "add_seed_start_log_enhance_inventory"`
2. Phase 2: `wasp db migrate-dev --name "harvest_log_flexible_relations"`
3. Phase 4: `wasp db migrate-dev --name "add_journal_entry"`
4. Phase 5: `wasp db migrate-dev --name "expand_animal_types"`
5. Phase 8: `wasp db migrate-dev --name "add_soil_test_amendment_log"`

---

## Phase Dependencies

```
Phase 0 (Components) ──→ All other phases use these
Phase 1 (Seeds)      ──→ Independent (highest priority)
Phase 2 (Harvest)    ──→ Independent
Phase 3 (Weather)    ──→ Independent
Phase 4 (Journal)    ──→ Independent
Phase 5 (Animals)    ──→ Independent
Phase 6 (Systems)    ──→ Independent
Phase 7 (Inventory)  ──→ Independent
Phase 8 (Soil)       ──→ Independent
Phase 9 (Succession) ──→ Depends on existing bed grid
Phase 10 (Dashboard) ──→ Depends on Phases 1, 2, 3, 5
```

Phases 1-8 are all independent and can be built in any order after Phase 0.

---

## Verification Per Phase

1. `wasp db migrate-dev` — migration succeeds
2. `wasp start` — compiles without type errors
3. Navigate to new page — loading state, then empty state renders
4. Create item — form submits, item appears in list
5. Edit/delete — mutations work, UI updates
6. Auth — logged-out user redirected, non-member gets 403
7. Mobile — responsive layout works
8. AI context — open AI designer on a bed, verify new context sections appear in conversation
9. Nav — new items visible in sidebar and mobile menu

For Phase 1 specifically:
- Set frost dates in Settings, add plants with `startIndoorWeeks`
- Visit `/seeds/starting` — verify computed schedule matches expected dates
- Log a seed start → appears in "Active Trays"
- Open AI bed designer → verify seed inventory section in AI context
