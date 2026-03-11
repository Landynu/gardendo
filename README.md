# GardenDo

A comprehensive permaculture property management web app designed for managing a 25-acre Zone 3B homestead near Regina, Saskatchewan. GardenDo serves as a "farming brain" — tracking everything from seed starting schedules to garden bed layouts, task management, and planting calendars, all calibrated to your local frost dates and growing conditions.

## Features

### Property Management
- Configure property details including acreage, hardiness zone, frost dates, and timezone
- Interactive map (Leaflet + OpenStreetMap) for precise property location setting
- Multi-user support via property membership roles (Owner / Member)

### Plant Database
- Pre-seeded with 80+ plants suitable for Zone 3B (vegetables, herbs, fruits, flowers, cover crops)
- Detailed growing information: days to maturity, spacing, sun/water requirements, planting depth
- Permaculture metadata: nitrogen fixers, dynamic accumulators, pollinator attractors, deer resistance
- Square foot gardening density data (plants per sq ft)
- Schedule data relative to frost dates (indoor start, transplant, direct sow, harvest windows)
- Companion planting relationships (beneficial, harmful, neutral)
- Optional OpenFarm API enrichment (never overwrites user edits)

### Garden Bed Planning (Square Foot Gardening)
- Organize property into permaculture zones (Zone 0-5)
- Create garden beds with configurable dimensions
- Interactive square foot grid planner for visual bed layout
- Season layers (spring, summer, fall) for succession planting
- Automatic planting record creation from grid placements

### Calendar Engine
- Auto-generates a full season planting schedule from your frost dates and plant database
- Idempotent generation — regenerating never duplicates events or overwrites user edits
- Event types: seed start indoor/outdoor, transplant, harvest, pruning, fertilizing, and more
- Calculation example: Tomato with `startIndoorWeeks: -8` and last frost May 21 = start indoors ~March 26

### Task Management
- Daily/weekly task tracking with status workflow (Pending → In Progress → Completed / Skipped)
- Priority levels (Low, Medium, High, Urgent)
- Auto-generated tasks from calendar events via background job
- Recurrence support (daily, weekly, biweekly, monthly, seasonal, yearly)
- Tasks scoped to property with user assignment

### Dashboard
- Today's tasks at a glance
- Upcoming calendar events
- Quick stats (total plants, active beds, pending tasks)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [WASP](https://wasp-lang.dev/) 0.21 |
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Node.js + Express (via WASP) |
| Database | PostgreSQL |
| ORM | Prisma (built into WASP) |
| Auth | WASP built-in (email/password) |
| Background Jobs | PgBoss (built into WASP) |
| Maps | Leaflet + react-leaflet + OpenStreetMap |
| Icons | lucide-react |
| Charts | recharts |
| Validation | zod |
| Date Handling | date-fns + date-fns-tz |
| Deployment | Railway |

## Project Structure

```
gardendo/
├── main.wasp                  # WASP config (routes, queries, actions, jobs, auth)
├── schema.prisma              # Prisma database schema (30+ models)
├── package.json               # Dependencies
├── src/
│   ├── App.tsx                # Root layout (sidebar + bottom nav)
│   ├── App.css                # Tailwind v4 theme (farm palette)
│   ├── auth/                  # Auth pages (login, signup, email verification, password reset)
│   ├── lib/
│   │   └── auth.ts            # requirePropertyMember helper
│   ├── pages/
│   │   ├── DashboardPage.tsx  # Home dashboard with stats and upcoming items
│   │   ├── PlantsPage.tsx     # Plant database browser with search/filter
│   │   ├── PlantDetailPage.tsx# Individual plant details and growing info
│   │   ├── GardenPage.tsx     # Zones and beds overview
│   │   ├── BedDetailPage.tsx  # Square foot grid planner
│   │   ├── CalendarPage.tsx   # Planting calendar with event generation
│   │   ├── TasksPage.tsx      # Task management with status filters
│   │   └── SettingsPage.tsx   # Property setup and configuration
│   ├── components/
│   │   └── LocationPicker.tsx # Interactive Leaflet map component
│   ├── property/
│   │   ├── queries.ts         # getProperties, getPropertyById
│   │   └── actions.ts         # createProperty, updateProperty
│   ├── plants/
│   │   ├── queries.ts         # getPlants, getPlantById
│   │   └── actions.ts         # createPlant, updatePlant
│   ├── garden/
│   │   ├── queries.ts         # getZones, getBedById
│   │   └── actions.ts         # createZone, createBed, saveBedSquares
│   ├── calendar/
│   │   ├── queries.ts         # getCalendarEvents
│   │   └── actions.ts         # generateCalendar (idempotent)
│   ├── tasks/
│   │   ├── queries.ts         # getTasks
│   │   └── actions.ts         # createTask, updateTask
│   ├── photos/
│   │   ├── queries.ts         # getPhotoUrl (presigned URL)
│   │   └── actions.ts         # getUploadUrl (presigned upload)
│   ├── jobs/
│   │   └── dailyTasks.ts      # PgBoss cron: auto-generate tasks from calendar events
│   └── seeds/
│       └── plants.ts          # 80+ Zone 3B plants seed data
└── public/                    # Static assets
```

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [WASP CLI](https://wasp-lang.dev/docs/quick-start) 0.21
- PostgreSQL database (local or hosted, e.g. Railway)

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd gardendo
```

WASP handles dependency installation automatically on first run.

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.server.example .env.server
```

Required variables in `.env.server`:

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=your-secret-key-here
```

### 3. Set up the database

```bash
# Run migrations to create all tables
wasp db migrate-dev --name init

# Seed the plant database with 80+ Zone 3B plants
wasp db seed
```

### 4. Start development server

```bash
wasp start
```

The app will be available at:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3001

### 5. Create your account

1. Navigate to http://localhost:3000/signup
2. Register with email and password
3. Go to **Settings** and create your property (Zone 3B defaults are pre-filled for Regina, SK)

## Database Schema Overview

The schema uses PostgreSQL with UUID primary keys and includes models for:

- **Users & Properties** — Multi-user with PropertyMember join table (OWNER/MEMBER roles)
- **Zones & Garden Beds** — Permaculture zones (0-5) containing garden beds
- **Bed Squares & Plantings** — Square foot grid layout (BedSquare) with lifecycle tracking (Planting)
- **Plants** — Comprehensive plant database with growing data, schedules, and permaculture attributes
- **Companion Plants** — Beneficial/harmful/neutral relationships between plants
- **Calendar Events** — Auto-generated planting schedule with idempotent generation keys
- **Tasks** — Property-scoped tasks with status, priority, recurrence, and calendar event links
- **Animals & Egg Logs** — Flock management and production tracking
- **Water Systems & Logs** — Water source tracking and usage logging
- **Compost Bins & Logs** — Composting management
- **Inventory** — Seeds (linked to plants) and general supplies
- **Harvest Logs** — Yield tracking per planting
- **Photos** — S3 key storage with presigned URL generation
- **Home Assistant** — Sensor integration for environmental monitoring

### Key Design Decisions

- **Local date strings** (`YYYY-MM-DD`) for all farm dates — no timezone drift. `DateTime` only for audit fields (`createdAt`, `updatedAt`).
- **Idempotent generation** — Calendar events and tasks use `generationKey` for upsert. `isUserEdited` flag protects manual edits from being overwritten on regeneration.
- **BedSquare is layout, Planting is lifecycle** — Grid UI driven by BedSquare, growing records tracked by Planting. No dual source of truth.
- **PropertyMember scoping** — All queries verify user membership before returning data.

## Design System

The UI uses a farm-themed Tailwind v4 palette defined in `src/App.css`:

- **Primary** (green) — Main actions, navigation highlights, growing/healthy states
- **Accent** (gold/yellow) — Secondary actions, warnings, harvest-related
- **Earth** (brown) — Soil, composting, grounded elements
- **Neutral** (warm gray) — Text, borders, backgrounds

Custom utility classes: `card`, `page-container`, `page-title`, `btn-primary`, `btn-secondary`, `label`

## Deployment

### Railway (Recommended)

```bash
# Build the app
wasp build

# Deploy to Railway
wasp deploy railway launch
```

Required Railway services:
1. **WASP app** (client + server) — auto-configured by `wasp deploy railway launch`
2. **PostgreSQL** — provisioned by Railway
3. **Object Storage** (future) — Railway's S3-compatible storage for photos

### Environment Variables for Production

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Railway) |
| `JWT_SECRET` | Secret key for JWT token signing |
| `S3_ENDPOINT` | Railway object storage endpoint (future) |
| `S3_BUCKET` | Storage bucket name (future) |
| `S3_ACCESS_KEY` | Storage access key (future) |
| `S3_SECRET_KEY` | Storage secret key (future) |

## Roadmap

### Phase 1a — Core Loop (Current)
- [x] Project setup (WASP, Tailwind v4, auth)
- [x] Database schema (30+ models)
- [x] Property setup with interactive map
- [x] Plant database seeded with 80+ Zone 3B plants
- [x] Garden zones and beds management
- [x] Square foot grid bed planner
- [x] Calendar engine with idempotent generation
- [x] Task management
- [ ] Photo uploads (Railway object storage)

### Phase 1b — Full Property Management
- [ ] Harvest logging with yield tracking
- [ ] Animal management (chicken flocks, egg logging, health records)
- [ ] Water systems (tank levels, usage tracking)
- [ ] Composting (bin tracking, temperature logs)
- [ ] Seed inventory (linked to plant database)
- [ ] General inventory (tools, amendments, feed, supplies)
- [ ] OpenFarm API enrichment

### Phase 2 — Enhancements
- [ ] Home Assistant integration (sensor polling, dashboard)
- [ ] PWA with offline support and push notifications
- [ ] Weather API integration (frost alerts)
- [ ] Crop rotation tracking and suggestions
- [ ] Permaculture guild builder
- [ ] Yield analytics and year-over-year comparisons

## Climate Data (Zone 3B — Regina, SK)

| Parameter | Value |
|-----------|-------|
| Hardiness Zone | 3B |
| Last Spring Frost | ~May 20-21 |
| First Fall Frost | ~Sep 10-12 |
| Frost-Free Days | ~112-115 |
| Winter Minimum | -37 to -34 C |
| Indoor Seed Starting | Late Jan - Early March |
| Transplant After | May 20+ |
| Cool Crop Direct Sow | Soil at 5 C |
| Warm Crop Direct Sow | Soil at 15 C |

## License

Private project. All rights reserved.
