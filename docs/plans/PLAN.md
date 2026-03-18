# GardenDo - Permaculture Property Management App

## Context
Building a comprehensive "farming brain" web app for managing a 25-acre permaculture property near Regina, SK (Zone 3B). The app will handle everything from seed starting schedules to animal care, water systems, and property planning. Designed for 1-2 users (owner + spouse), hosted on Railway, mobile-friendly for field use.

**Key Climate Data (Zone 3B, Regina SK):**
- Last spring frost: ~May 20-21
- First fall frost: ~Sep 10-12
- Frost-free days: ~112-115
- Winter minimum: -37°C to -34°C
- Indoor seed starting: Late Jan - Early March (onions, peppers, tomatoes)
- Transplant after: May 20+
- Cool crops direct sow when soil reaches 5°C, warm crops at 15°C

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **WASP** (latest stable) |
| Frontend | React + TypeScript |
| UI | **shadcn/ui** + **Tailwind CSS** |
| Backend | Node.js + Express (via WASP) |
| Database | **PostgreSQL** (Railway-provisioned) |
| ORM | **Prisma** (built into WASP) |
| Auth | WASP built-in (email/password) |
| File Storage | **Railway Object Storage** (S3-compatible) |
| Background Jobs | **PgBoss** (built into WASP) |
| Plant API | **OpenFarm API** (optional enrichment only) |
| Deployment | **Railway** (`wasp deploy railway launch`) |
| Mobile | **Responsive web** + future PWA manifest |

### Key npm packages to add:
- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` - S3-compatible uploads to Railway object storage
- `multer` - file upload middleware
- `date-fns` + `date-fns-tz` - date manipulation with timezone-aware local dates
- `react-big-calendar` or `@fullcalendar/react` - calendar UI
- `lucide-react` - icons (pairs with shadcn)
- `recharts` - charts for yield tracking, egg production, water levels
- `zod` - schema validation

---

## Component Architecture & Centralized Style

### Design System Foundation
All UI built on shadcn/ui + Tailwind with a centralized theme config. No one-off styles.

- **`tailwind.config.js`** — single source for colors, spacing, fonts, breakpoints. Farm-themed palette (greens, earth tones, warm accents)
- **`src/client/lib/utils.ts`** — `cn()` helper (clsx + tailwind-merge), shared formatters (`formatLocalDate`, `formatQuantity`)
- **`src/client/lib/constants.ts`** — shared enums-to-labels maps, color palettes for plant categories, status colors

### Reusable Component Library (`src/client/components/`)

| Component | Reused In | Purpose |
|-----------|-----------|---------|
| `DataCard.tsx` | Dashboard, Plant, Animal, Water, Compost | Card with title, stats, optional chart. Single card pattern everywhere |
| `DataTable.tsx` | Plants, Tasks, Inventory, Harvest, EggLogs | Sortable/filterable table with search. Wraps shadcn `Table` |
| `FormModal.tsx` | All create/edit flows | Consistent modal with form, validation (zod), loading state |
| `LogEntry.tsx` | EggLog, WaterLog, CompostLog, HarvestLog | Timestamped log entry display. All "logging" UIs share this |
| `PhotoUpload.tsx` | Bed, Zone, Animal, Task, Harvest, Inventory | Presigned upload + gallery. Same component everywhere photos appear |
| `StatusBadge.tsx` | Tasks, Plantings, Animals | Colored badge for status enums (PENDING, COMPLETED, etc.) |
| `EmptyState.tsx` | All list pages | Consistent "nothing here yet" with CTA button |
| `PageHeader.tsx` | All pages | Title + breadcrumb + action buttons. Consistent page structure |
| `Navigation.tsx` | App shell | Responsive sidebar (desktop) / bottom nav (mobile) |
| `BedGrid.tsx` | BedDetail, Dashboard (mini preview) | Square foot grid — reusable at different sizes |
| `TimeSeriesChart.tsx` | Water, Sensors, EggLogs, Harvest | Recharts wrapper for any time-series data. Configure via props |
| `CalendarView.tsx` | Calendar page, Dashboard (upcoming) | Calendar wrapper — full view and compact widget |
| `SearchFilter.tsx` | Plants, Tasks, Inventory | Shared search + filter bar pattern |

### Consistent Patterns
- **All pages** use `PageHeader` → content area → optional `FormModal` for create/edit
- **All log entries** (eggs, water, compost, harvest) use the same `LogEntry` display + `FormModal` for input
- **All list views** use `DataTable` with `SearchFilter`
- **All charts** use `TimeSeriesChart` with data prop + config
- **All forms** use zod schemas + shadcn form components + consistent error display
- **Mobile-first**: all components designed for touch first, enhanced for desktop

### Claude Skills & Agents
Create project-specific Claude configuration to maintain consistency:

- **`CLAUDE.md`** — Project conventions: component patterns, naming, file organization, Prisma schema rules, date handling (always YYYY-MM-DD strings for farm dates), import conventions
- **`/.claude/agents/component-builder.md`** — Agent instructions for building new components: always check existing components first, follow DataCard/DataTable/FormModal patterns, use centralized theme
- **`/.claude/agents/schema-validator.md`** — Agent instructions for schema changes: enforce PropertyMember scoping, local date strings, generationKey for auto-generated records, CompanionPlant ordering

---

## Database Schema (Prisma Models)

### Design Decisions (from review)

1. **Multi-user via PropertyMember**: `PropertyMember` join table with roles (OWNER, MEMBER) replaces simple `Property.ownerId`. Spouse can be added with full access. `propertyId` is first-class on tasks, events, photos, inventory.
2. **Local dates vs timestamps**: `Property.timezone` field (e.g., `"America/Regina"`). Farm dates (`datePlanted`, `dueDate`, frost dates) are stored as `String` in `YYYY-MM-DD` format — no timezone drift. Only audit fields (`createdAt`) use `DateTime`.
3. **BedSquare is authoritative for layout, Planting is the lifecycle record**: When you place a plant in a square, a `Planting` record is auto-created. `BedSquare` references the `Planting`. No dual source of truth — `BedSquare` drives the grid UI, `Planting` tracks the lifecycle (planted → harvested).
4. **Idempotent calendar generation**: `CalendarEvent` has `generationKey` (e.g., `"2026:tomato:SEED_START_INDOOR"`) and `isUserEdited` flag. Regeneration skips user-edited events and upserts by key.
5. **Photo stores key only**: `Photo.key` is the S3 object key. Access URLs are derived server-side via presigned URLs. No stored `url` to go stale.
6. **OpenFarm is optional enrichment**: Seed data is authoritative. Plant has `dataSource` and `isUserEdited` fields. Sync never overwrites user-edited plants.
7. **CompanionPlant dedup**: Enforce `plantAId < plantBId` at the application layer + `@@unique` constraint. Query helper checks both directions.
8. **HA is app-global**: `AppSettings` model stores HA credentials (encrypted, server-only). Not per-property.
9. **HA retention**: `HaSensorReading` has index on `[sensorId, recordedAt]`. Background job rolls up readings older than 30 days into hourly averages, prunes raw data older than 90 days.

### Enums

```prisma
enum PropertyRole {
  OWNER
  MEMBER
}

enum PlantCategory {
  VEGETABLE
  FRUIT
  TREE
  SHRUB
  HERB
  COVER_CROP
  FLOWER
  GRASS
}

enum PlantLifecycle {
  ANNUAL
  BIENNIAL
  PERENNIAL
}

enum SunRequirement {
  FULL_SUN
  PARTIAL_SUN
  PARTIAL_SHADE
  FULL_SHADE
}

enum WaterNeed {
  LOW
  MODERATE
  HIGH
}

enum SeasonType {
  COOL
  WARM
}

enum Season {
  SPRING
  SUMMER
  FALL
}

enum PermacultureZone {
  ZONE_0
  ZONE_1
  ZONE_2
  ZONE_3
  ZONE_4
  ZONE_5
}

enum PermacultureLayer {
  CANOPY
  UNDERSTORY
  SHRUB
  HERBACEOUS
  GROUND_COVER
  VINE
  ROOT
  FUNGAL
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  SKIPPED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TaskRecurrence {
  NONE
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
  SEASONAL
  YEARLY
}

enum AnimalType {
  CHICKEN
}

enum WaterSourceType {
  RAINWATER
  RIVER_PUMP
  WELL
  MUNICIPAL
}

enum CalendarEventType {
  SEED_START_INDOOR
  SEED_START_OUTDOOR
  TRANSPLANT
  HARVEST_START
  HARVEST_END
  PRUNING
  FERTILIZE
  COMPOST
  ANIMAL_CARE
  WATER_SYSTEM
  MAINTENANCE
  CUSTOM
}

enum CompanionType {
  BENEFICIAL
  HARMFUL
  NEUTRAL
}

enum InventoryCategory {
  SEED
  TOOL
  AMENDMENT
  FEED
  SUPPLY
}

enum PlantDataSource {
  SEED       // From seed script — authoritative
  OPENFARM   // Enriched from OpenFarm API
  USER       // Manually created/edited by user
}
```

### Core Models

```prisma
// ─── USER & PROPERTY ────────────────────────

model User {
  // WASP manages id, email, password
  memberships     PropertyMember[]
  tasks           Task[]
  harvestLogs     HarvestLog[]
}

model Property {
  id              Int       @id @default(autoincrement())
  name            String
  acreage         Float
  hardinessZone   String    @default("3B")
  lastFrostDate   String    @default("05-21")   // MM-DD local date
  firstFrostDate  String    @default("09-12")   // MM-DD local date
  timezone        String    @default("America/Regina")
  latitude        Float?
  longitude       Float?
  notes           String?

  members         PropertyMember[]
  zones           PropertyZone[]
  waterSystems    WaterSystem[]
  animals         AnimalGroup[]
  compostBins     CompostBin[]
  calendarEvents  CalendarEvent[]
  tasks           Task[]
  photos          Photo[]
  inventoryItems  InventoryItem[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model PropertyMember {
  id          Int          @id @default(autoincrement())
  role        PropertyRole @default(MEMBER)

  user        User         @relation(fields: [userId], references: [id])
  userId      Int
  property    Property     @relation(fields: [propertyId], references: [id])
  propertyId  Int

  createdAt   DateTime     @default(now())

  @@unique([userId, propertyId])
}

model PropertyZone {
  id              Int              @id @default(autoincrement())
  name            String
  permZone        PermacultureZone
  description     String?
  areaSqFt        Float?
  notes           String?

  property        Property   @relation(fields: [propertyId], references: [id])
  propertyId      Int

  gardenBeds      GardenBed[]
  photos          Photo[]

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
}

// ─── GARDEN BEDS & PLANTINGS ────────────────

model GardenBed {
  id              Int       @id @default(autoincrement())
  name            String
  widthFt         Int       // Integer grid dimensions
  lengthFt        Int
  soilType        String?
  notes           String?

  zone            PropertyZone @relation(fields: [zoneId], references: [id])
  zoneId          Int

  squares         BedSquare[]
  plantings       Planting[]
  photos          Photo[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// BedSquare is the AUTHORITATIVE layout model for the grid UI.
// Each square references a Planting for lifecycle tracking.
model BedSquare {
  id            Int       @id @default(autoincrement())
  row           Int       // 0-indexed grid row
  col           Int       // 0-indexed grid column
  year          Int
  season        Season    @default(SPRING)  // Supports succession planting

  bed           GardenBed @relation(fields: [bedId], references: [id])
  bedId         Int
  planting      Planting? @relation(fields: [plantingId], references: [id])
  plantingId    Int?

  notes         String?

  @@unique([bedId, row, col, year, season])
}

// Planting is the LIFECYCLE record (planted → growing → harvested).
// Created automatically when a plant is placed in a BedSquare.
model Planting {
  id              Int       @id @default(autoincrement())
  year            Int
  season          Season    @default(SPRING)
  datePlanted     String?   // YYYY-MM-DD local date
  dateHarvested   String?   // YYYY-MM-DD local date
  notes           String?

  plant           Plant     @relation(fields: [plantId], references: [id])
  plantId         Int
  bed             GardenBed @relation(fields: [bedId], references: [id])
  bedId           Int

  squares         BedSquare[]   // Which grid cells this planting occupies
  harvestLogs     HarvestLog[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// ─── PLANT DATABASE ─────────────────────────

model Plant {
  id                  Int            @id @default(autoincrement())
  name                String
  scientificName      String?
  variety             String?
  category            PlantCategory
  lifecycle           PlantLifecycle
  hardinessZoneMin    String?
  hardinessZoneMax    String?

  // Growing info
  sunRequirement      SunRequirement?
  waterNeed           WaterNeed?
  seasonType          SeasonType?
  daysToMaturity      Int?
  daysToGermination   Int?
  plantDepthInches    Float?
  spacingInches       Float?
  rowSpacingInches    Float?
  plantHeightInches   Float?

  // Schedule (relative to last frost, negative = weeks before)
  startIndoorWeeks    Int?
  transplantWeeks     Int?
  directSowWeeks      Int?
  harvestRelativeWeeks Int?

  // Square foot gardening
  plantsPerSqFt       Int?           // Density (1, 4, 9, 16)
  sqftColor           String?        // Hex color for grid

  // Permaculture
  permLayer           PermacultureLayer?
  isNitrogenFixer     Boolean        @default(false)
  isDynamicAccumulator Boolean       @default(false)
  isEdible            Boolean        @default(true)
  isMedicinal         Boolean        @default(false)
  attractsPollinators Boolean        @default(false)
  deerResistant       Boolean        @default(false)

  // Data source tracking
  dataSource          PlantDataSource @default(SEED)
  isUserEdited        Boolean        @default(false)
  openFarmSlug        String?
  lastSyncedAt        DateTime?

  notes               String?
  imageUrl            String?

  plantings           Planting[]
  companionsA         CompanionPlant[] @relation("CompanionA")
  companionsB         CompanionPlant[] @relation("CompanionB")
  seedInventory       SeedInventory[]
  calendarEvents      CalendarEvent[]

  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
}

model CompanionPlant {
  id          Int            @id @default(autoincrement())
  type        CompanionType
  notes       String?

  // Enforced: plantAId < plantBId (application layer)
  plantA      Plant          @relation("CompanionA", fields: [plantAId], references: [id])
  plantAId    Int
  plantB      Plant          @relation("CompanionB", fields: [plantBId], references: [id])
  plantBId    Int

  @@unique([plantAId, plantBId])
}

// ─── CALENDAR & TASKS ───────────────────────

model CalendarEvent {
  id            Int               @id @default(autoincrement())
  title         String
  description   String?
  eventType     CalendarEventType
  date          String            // YYYY-MM-DD local date
  endDate       String?           // YYYY-MM-DD local date
  allDay        Boolean           @default(true)

  // Idempotent generation
  autoGenerated Boolean           @default(false)
  generationKey String?           // e.g., "2026:tomato-5:SEED_START_INDOOR" — unique per season
  isUserEdited  Boolean           @default(false)

  property      Property          @relation(fields: [propertyId], references: [id])
  propertyId    Int
  plant         Plant?            @relation(fields: [plantId], references: [id])
  plantId       Int?

  tasks         Task[]

  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@unique([generationKey])
}

model Task {
  id            Int            @id @default(autoincrement())
  title         String
  description   String?
  status        TaskStatus     @default(PENDING)
  priority      TaskPriority   @default(MEDIUM)
  dueDate       String?        // YYYY-MM-DD local date
  completedAt   DateTime?
  recurrence    TaskRecurrence @default(NONE)
  notes         String?

  // Idempotent generation
  generationKey String?        @unique
  isUserEdited  Boolean        @default(false)

  assignee      User           @relation(fields: [assigneeId], references: [id])
  assigneeId    Int
  property      Property       @relation(fields: [propertyId], references: [id])
  propertyId    Int

  calendarEvent CalendarEvent? @relation(fields: [calendarEventId], references: [id])
  calendarEventId Int?

  photos        Photo[]

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

// ─── ANIMALS ────────────────────────────────

model AnimalGroup {
  id            Int         @id @default(autoincrement())
  name          String
  animalType    AnimalType
  notes         String?

  property      Property    @relation(fields: [propertyId], references: [id])
  propertyId    Int

  animals       Animal[]
  eggLogs       EggLog[]

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Animal {
  id            Int         @id @default(autoincrement())
  name          String?
  breed         String?
  dateOfBirth   String?     // YYYY-MM-DD
  dateAcquired  String?     // YYYY-MM-DD
  isActive      Boolean     @default(true)
  notes         String?

  group         AnimalGroup @relation(fields: [groupId], references: [id])
  groupId       Int

  healthRecords AnimalHealthRecord[]
  photos        Photo[]

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model AnimalHealthRecord {
  id            Int       @id @default(autoincrement())
  date          String    // YYYY-MM-DD
  description   String
  treatment     String?
  notes         String?

  animal        Animal    @relation(fields: [animalId], references: [id])
  animalId      Int

  createdAt     DateTime  @default(now())
}

model EggLog {
  id            Int         @id @default(autoincrement())
  date          String      // YYYY-MM-DD
  count         Int
  notes         String?

  group         AnimalGroup @relation(fields: [groupId], references: [id])
  groupId       Int

  createdAt     DateTime    @default(now())
}

// ─── WATER SYSTEMS ──────────────────────────

model WaterSystem {
  id              Int             @id @default(autoincrement())
  name            String
  sourceType      WaterSourceType
  capacityGallons Float?
  notes           String?

  property        Property        @relation(fields: [propertyId], references: [id])
  propertyId      Int

  logs            WaterLog[]

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model WaterLog {
  id              Int          @id @default(autoincrement())
  date            String       // YYYY-MM-DD
  levelGallons    Float?
  usageGallons    Float?
  notes           String?

  system          WaterSystem  @relation(fields: [systemId], references: [id])
  systemId        Int

  createdAt       DateTime     @default(now())
}

// ─── COMPOSTING ─────────────────────────────

model CompostBin {
  id            Int       @id @default(autoincrement())
  name          String
  type          String?
  capacityCuFt  Float?
  notes         String?

  property      Property  @relation(fields: [propertyId], references: [id])
  propertyId    Int

  logs          CompostLog[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model CompostLog {
  id            Int        @id @default(autoincrement())
  date          String     // YYYY-MM-DD
  action        String
  tempFahrenheit Float?
  notes         String?

  bin           CompostBin @relation(fields: [binId], references: [id])
  binId         Int

  createdAt     DateTime   @default(now())
}

// ─── INVENTORY ──────────────────────────────

model SeedInventory {
  id            Int       @id @default(autoincrement())
  quantity      Int?
  unit          String?
  supplier      String?
  yearPurchased Int?
  expiryYear    Int?
  lotNumber     String?
  notes         String?

  plant         Plant     @relation(fields: [plantId], references: [id])
  plantId       Int

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model InventoryItem {
  id            Int               @id @default(autoincrement())
  name          String
  category      InventoryCategory
  quantity      Int?
  unit          String?
  location      String?
  condition     String?
  notes         String?

  property      Property          @relation(fields: [propertyId], references: [id])
  propertyId    Int

  photos        Photo[]

  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
}

// ─── HARVEST TRACKING ───────────────────────

model HarvestLog {
  id            Int       @id @default(autoincrement())
  date          String    // YYYY-MM-DD
  quantityLbs   Float?
  notes         String?

  planting      Planting  @relation(fields: [plantingId], references: [id])
  plantingId    Int
  user          User      @relation(fields: [userId], references: [id])
  userId        Int

  photos        Photo[]

  createdAt     DateTime  @default(now())
}

// ─── PHOTOS ─────────────────────────────────

// Store S3 key only. Access URLs are derived server-side via presigned URLs.
model Photo {
  id            Int       @id @default(autoincrement())
  key           String    // S3 object key — URL derived server-side
  caption       String?
  takenAt       String?   // YYYY-MM-DD

  // Every photo belongs to a property
  property      Property  @relation(fields: [propertyId], references: [id])
  propertyId    Int

  // Context — exactly one of these should be set
  zoneId        Int?
  zone          PropertyZone? @relation(fields: [zoneId], references: [id])
  bedId         Int?
  bed           GardenBed?   @relation(fields: [bedId], references: [id])
  taskId        Int?
  task          Task?        @relation(fields: [taskId], references: [id])
  animalId      Int?
  animal        Animal?      @relation(fields: [animalId], references: [id])
  harvestLogId  Int?
  harvestLog    HarvestLog?  @relation(fields: [harvestLogId], references: [id])
  inventoryId   Int?
  inventory     InventoryItem? @relation(fields: [inventoryId], references: [id])

  createdAt     DateTime  @default(now())
}

// ─── HOME ASSISTANT ─────────────────────────

// App-global HA connection (not per-property)
model AppSettings {
  id            Int       @id @default(autoincrement())
  key           String    @unique
  value         String    // Encrypted for sensitive values (HA_ACCESS_TOKEN)

  updatedAt     DateTime  @updatedAt
}

model HaSensor {
  id            Int       @id @default(autoincrement())
  entityId      String    @unique
  name          String
  sensorType    String
  unit          String?
  zoneId        Int?
  isActive      Boolean   @default(true)

  readings      HaSensorReading[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model HaSensorReading {
  id            Int       @id @default(autoincrement())
  value         String
  numericValue  Float?
  isRollup      Boolean   @default(false)  // true = hourly average rollup
  recordedAt    DateTime  @default(now())

  sensor        HaSensor  @relation(fields: [sensorId], references: [id])
  sensorId      Int

  @@index([sensorId, recordedAt])
}
```

---

## App Structure

### WASP Pages & Routes

```
/                     → Dashboard (today's tasks, upcoming events, quick stats)
/calendar             → Full calendar view (planting schedule, tasks, events)
/plants               → Plant database (search, filter, add)
/plants/:id           → Plant detail (growing info, schedule, companions)
/garden               → Property map (zones, beds overview)
/garden/bed/:id       → Bed detail (square foot grid planner, plantings, photos)
/tasks                → Task management (list, filter, complete)
/animals              → Animal management (flocks, individuals)
/animals/:groupId     → Flock detail (egg logs, health records)
/water                → Water systems overview (levels, usage charts)
/compost              → Compost bins (logs, status)
/inventory            → Seeds & supplies inventory
/harvest              → Harvest log (yields by plant, year)
/sensors              → Home Assistant sensor dashboard (readings, charts)
/settings             → Property settings (frost dates, zones, HA connection)
```

### WASP Queries & Actions
- **Queries**: getPlants, getPlantById, getPlantings, getTasks, getCalendarEvents, getAnimals, getEggLogs, getWaterSystems, getWaterLogs, getInventory, getHarvestLogs, getDashboardStats, getPhotoUrl (generates presigned URL from key)
- **Actions**: createPlant, updatePlant, createPlanting, saveBedSquares (batch), createTask, completeTask, logEggs, logWater, logHarvest, logCompost, getUploadUrl (presigned), generateCalendar (idempotent)

### WASP Jobs (PgBoss cron)
- `generateDailyTasks` - creates tasks from calendar events each morning (idempotent via generationKey)
- `syncPlantData` - optional OpenFarm API enrichment (skips user-edited plants)
- `syncHaSensors` - polls Home Assistant REST API (every 5-15 min)
- `pruneHaSensorData` - rolls up readings >30 days to hourly averages, prunes >90 days (daily)
- `frostAlertCheck` - weather API check near frost dates (future)

---

## File/Photo Storage

Railway Object Storage is S3-compatible. Approach:
1. Backend action `getUploadUrl` generates a **presigned upload URL** via `@aws-sdk/s3-request-presigner`
2. Frontend uploads directly to Railway Object Storage using the presigned URL
3. Store only the S3 object `key` in the `Photo` model
4. Backend query `getPhotoUrl` generates presigned download URLs on demand — never store URLs

---

## Garden Bed Visualization (Square Foot Gardening)

**Core Phase 1 feature.** Interactive visual grid for planning and tracking garden beds using square foot gardening principles.

### How It Works

1. **Grid-based beds**: Each `GardenBed` has `widthFt` x `lengthFt` (integer) dimensions → rendered as an interactive grid where each cell = 1 sq ft
2. **Drag-and-drop planting**: Select a plant from the database, click/tap grid cells to place it. Plant spacing rules auto-calculate how many plants fit per square (e.g., tomatoes = 1/sqft, carrots = 16/sqft, lettuce = 4/sqft)
3. **Visual indicators**: Each planted square shows the plant icon/color, growth stage (seed → seedling → mature → harvest), and companion planting warnings (red border if bad neighbor)
4. **Season layers**: Toggle between spring/summer/fall views for succession planting — same square, different plants per season
5. **Mobile-friendly**: Touch-friendly grid with pinch-to-zoom for large beds

### Data Flow
1. User places plant in grid square → `BedSquare` created with season + year
2. `Planting` record auto-created linking plant to bed for that season
3. `BedSquare.plantingId` set to the new planting
4. Multiple squares can reference the same `Planting` (e.g., 4 squares of tomatoes = 1 planting)
5. Harvest logs attach to the `Planting`, not individual squares

### UI Components
- **`BedGrid.tsx`** — CSS Grid renderer. Each cell = clickable div with plant color + abbreviation + count/sqft
- **`BedPlanner.tsx`** — Wrapper: plant palette sidebar, season selector, year picker, grid. Click palette → click grid to place
- **`BedLegend.tsx`** — Color legend showing what's planted
- **`CompanionOverlay.tsx`** — Toggle overlay highlighting companion compatibility between adjacent squares

### Implementation
- **CSS Grid** (`grid-template-columns: repeat(widthFt, 1fr)`) — simple, responsive
- **React state** manages grid data, syncs to `BedSquare` records via `saveBedSquares` batch action
- Hover/tap shows: full plant name, days to maturity, planting date, companion info

---

## Calendar Engine (Core "Brain" Feature)

The calendar auto-generates a full season schedule based on:
1. **Property frost dates** (configurable, defaults to Regina Zone 3B)
2. **Plant schedule fields** (`startIndoorWeeks`, `transplantWeeks`, `directSowWeeks`)
3. Each plant in the database produces calendar events relative to frost dates
4. Events auto-create tasks with reminders

### Idempotent Generation
- Each generated event gets a `generationKey`: `"{year}:{plantId}:{eventType}"` (e.g., `"2026:5:SEED_START_INDOOR"`)
- `generateCalendar` action upserts by key — creates new events, updates unchanged ones, **skips any with `isUserEdited: true`**
- User edits (changing date, adding notes) set `isUserEdited: true` to protect from regeneration
- Similarly, generated tasks get `generationKey` and `isUserEdited` protection

### Example Calculation
- Tomato: `startIndoorWeeks: -8` → Start indoors 8 weeks before May 21 = ~March 26
- Tomato: `transplantWeeks: 1` → Transplant 1 week after May 21 = ~May 28
- Tomato: `daysToMaturity: 75` → Expected harvest ~Aug 11

### Timezone Handling
- All calendar dates stored as `YYYY-MM-DD` strings (local dates, no timezone drift)
- `Property.timezone` used only for display and "what day is it today?" logic
- `date-fns` handles all date arithmetic; no `Date` objects for farm dates

---

## Home Assistant Integration

**Scope:** Read-only sensor data, app-global (one HA instance).

**Credentials:** Stored in `AppSettings` model with `key: "HA_URL"` and `key: "HA_ACCESS_TOKEN"` (encrypted value). Configurable via settings page. Server-only — never sent to client.

### How It Works
1. **Settings page**: Configure HA connection URL + long-lived access token
2. **Sensor registration**: Add HA entity IDs to track (e.g., `sensor.outdoor_temperature`, `binary_sensor.coop_door`)
3. **`syncHaSensors` cron job**: Polls HA REST API every 5-15 min, writes `HaSensorReading` records
4. **`pruneHaSensorData` cron job**: Daily — rolls up readings >30 days to hourly averages, deletes raw data >90 days
5. **Dashboard widgets**: Latest readings + time-series charts (recharts)
6. **Calendar alerts**: Soil temp crosses 5°C → "Cool crops can be direct sown"
7. **Water system link**: Tank level sensors can auto-populate `WaterLog` entries

---

## PWA / Mobile Strategy

Phase 1: **Responsive web** with Tailwind breakpoints, mobile-first design, touch-friendly UI
Phase 2: Add PWA manifest + service worker for:
- Home screen install
- Offline access to plant database
- Push notifications for task reminders

---

## Implementation Phases

### Phase 1a — Core Loop (Build First)
The minimum viable "farming brain" — one loop that's immediately useful:

1. **Project setup**: WASP init, Tailwind + shadcn/ui, auth (email/password)
2. **Database**: All Prisma models + migrations
3. **Property setup**: Create property with frost dates, timezone, zones
4. **Plant database**: Seed with ~100+ Zone 3B plants (authoritative data). Browse, search, filter, view details
5. **Garden beds + SqFt grid planner**: Create beds, visual grid, place plants, succession planting
6. **Calendar engine**: Auto-generate planting schedule from frost dates + plant data (idempotent)
7. **Task manager**: Daily/weekly tasks, auto-generated from calendar, manual creation
8. **Basic photo uploads**: Railway object storage integration
9. **Deploy to Railway**

**Core loop**: Define property → seed/select plants → plan beds visually → generate season calendar → create/complete tasks → record plantings

### Phase 1b — Full Property Management (Layer On)
10. **Harvest logging**: Record yields per planting
11. **Animal management**: Chicken flocks, egg logging, health records
12. **Water systems**: Track tanks, log levels/usage
13. **Composting**: Bin tracking with logs
14. **Seed inventory**: Linked to plant database
15. **General inventory**: Tools, amendments, feed, supplies
16. **OpenFarm API enrichment**: Optional sync, never overwrites user data

### Phase 2 — Enhancements (Future)
- Home Assistant integration (polling job + sensor dashboard)
- PWA with offline support + push notifications
- Weather API integration (frost alerts, rain forecasts)
- Crop rotation suggestions (track what was planted in each bed by year)
- Permaculture guild builder (auto-suggest companion plantings)
- Map/visual property layout (interactive SVG or canvas)
- Soil test logging
- Budget/expense tracking
- Permaculture plan upload and overlay
- Yield analytics and year-over-year comparisons

---

## Railway Deployment

Services needed:
1. **WASP app** (client + server) - auto-configured by `wasp deploy railway launch`
2. **PostgreSQL** - provisioned by Railway
3. **Object Storage** - Railway's S3-compatible storage for photos

Environment variables to configure:
- `DATABASE_URL` (auto-set by Railway)
- `JWT_SECRET`
- `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` (Railway object storage)
- `OPENFARM_API_URL` (https://openfarm.cc/api/v1)

HA credentials stored in DB (`AppSettings`), not env vars — configurable via settings UI.

---

## Verification

### Phase 1a Smoke Test
1. `wasp start` - app runs locally with dev database
2. Auth: register user, log in, log out
3. Create property with Regina frost dates + timezone
4. Add spouse as MEMBER via PropertyMember
5. Browse seeded plant database, filter by category
6. Create a zone + garden bed (e.g., 4x8 raised bed)
7. Open SqFt grid planner, place tomatoes, carrots, lettuce across spring/summer
8. Verify `Planting` records auto-created from grid placements
9. Generate calendar → verify idempotent (run twice, no duplicates)
10. Edit a generated event → regenerate → verify edit preserved
11. View auto-generated tasks on dashboard
12. Upload photo to a garden bed
13. `wasp deploy railway launch` - deploys to Railway
14. Verify mobile responsiveness on phone browser

### Key Test Areas
- Calendar engine: frost-date math with `America/Regina` timezone
- Idempotency: `generateCalendar` and `generateDailyTasks` produce no duplicates on rerun
- User edits survive regeneration (`isUserEdited` flag)
- PropertyMember permission scoping (spouse sees same property data)
- OpenFarm sync never overwrites `isUserEdited: true` plants
- Photo URL derivation (presigned URLs from key, no stale stored URLs)

---

## Key Files to Create

```
gardendo/
├── main.wasp                    # WASP config (entities, routes, queries, actions, jobs, auth)
├── src/
│   ├── client/
│   │   ├── App.tsx              # Root layout, navigation
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Calendar.tsx
│   │   │   ├── Plants.tsx
│   │   │   ├── PlantDetail.tsx
│   │   │   ├── Garden.tsx
│   │   │   ├── BedDetail.tsx
│   │   │   ├── Tasks.tsx
│   │   │   ├── Animals.tsx
│   │   │   ├── FlockDetail.tsx
│   │   │   ├── Water.tsx
│   │   │   ├── Compost.tsx
│   │   │   ├── Inventory.tsx
│   │   │   ├── Harvest.tsx
│   │   │   ├── Sensors.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/
│   │   │   ├── ui/              # shadcn components
│   │   │   ├── PlantCard.tsx
│   │   │   ├── TaskList.tsx
│   │   │   ├── CalendarView.tsx
│   │   │   ├── PhotoUpload.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── BedGrid.tsx          # Square foot grid renderer
│   │   │   ├── BedPlanner.tsx       # Grid + plant palette + controls
│   │   │   ├── BedLegend.tsx        # Color legend
│   │   │   └── CompanionOverlay.tsx  # Companion planting overlay
│   │   └── lib/
│   │       ├── utils.ts
│   │       └── calendarEngine.ts  # Client-side frost date helpers
│   ├── server/
│   │   ├── queries/
│   │   │   ├── plants.ts
│   │   │   ├── garden.ts
│   │   │   ├── tasks.ts
│   │   │   ├── animals.ts
│   │   │   ├── water.ts
│   │   │   ├── photos.ts       # getPhotoUrl (presigned URL generation)
│   │   │   └── calendar.ts
│   │   ├── actions/
│   │   │   ├── plants.ts
│   │   │   ├── garden.ts       # saveBedSquares (batch)
│   │   │   ├── tasks.ts
│   │   │   ├── animals.ts
│   │   │   ├── water.ts
│   │   │   ├── photos.ts       # getUploadUrl (presigned)
│   │   │   └── calendar.ts     # generateCalendar (idempotent)
│   │   ├── jobs/
│   │   │   ├── dailyTasks.ts
│   │   │   ├── plantSync.ts
│   │   │   ├── sensorSync.ts
│   │   │   └── sensorPrune.ts  # HA reading rollup + pruning
│   │   └── lib/
│   │       ├── s3.ts             # Railway object storage client
│   │       ├── openFarm.ts       # OpenFarm API client
│   │       ├── homeAssistant.ts  # HA REST API client
│   │       └── calendarEngine.ts # Server-side schedule generation
│   └── shared/
│       └── types.ts
├── prisma/
│   └── seed.ts                   # Zone 3B plant data seed (~100+ plants)
├── tailwind.config.js
├── postcss.config.js
└── components.json               # shadcn/ui config
```
