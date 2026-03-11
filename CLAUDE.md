# GardenDo — Project Conventions

## Overview
Permaculture property management app for a 25-acre Zone 3B property near Regina, SK.
Built with WASP 0.21, React 19, TypeScript, Tailwind CSS v4, PostgreSQL.

## Tech Stack
- **Framework**: WASP 0.21 (DSL in `main.wasp`, Prisma schema in `schema.prisma`)
- **Frontend**: React 19 + TypeScript, React Router v7 (`import from "react-router"`)
- **Styling**: Tailwind CSS v4 (built-in via `@tailwindcss/vite`, theme in `src/App.css`)
- **Icons**: lucide-react
- **Backend**: Node.js via WASP, Prisma ORM
- **Database**: PostgreSQL (SQLite not used)
- **Jobs**: PgBoss (declared in `main.wasp`)
- **Auth**: WASP email auth (email/password with verification)

## File Structure
```
main.wasp          # App config: routes, queries, actions, jobs, auth
schema.prisma      # Prisma models (postgresql, String UUIDs)
src/
  App.tsx          # Root layout with sidebar + mobile nav
  App.css          # Tailwind v4 @theme (colors, utilities)
  auth/            # Auth pages (Login, Signup, etc.)
  pages/           # Route page components
  plants/          # Plant queries + actions
  property/        # Property queries + actions
  garden/          # Zone/Bed queries + actions
  calendar/        # Calendar queries + actions
  tasks/           # Task queries + actions
  photos/          # Photo queries + actions
  jobs/            # PgBoss job implementations
  lib/             # Shared helpers (auth.ts, etc.)
```

## Key Conventions

### IDs
All Prisma models use `String @id @default(uuid())`. Never use Int autoincrement.

### Dates
- **Farm dates** (planting, harvest, due dates): stored as `String` in `YYYY-MM-DD` format. No timezone drift.
- **Frost dates** on Property: stored as `String` in `MM-DD` format.
- **Audit timestamps** (createdAt, updatedAt): use `DateTime`.
- Use `date-fns` for all date math. Never use raw `Date` objects for farm dates.

### Auth & Authorization
- Every query/action checks `context.user` exists (throw HttpError 401).
- Property-scoped operations verify membership via `PropertyMember` table.
- Use `requirePropertyMember()` from `src/lib/auth.ts`.

### WASP Operations
- **Queries**: `import { type GetPlants } from "wasp/server/operations"`
- **Actions**: `import { type CreatePlant } from "wasp/server/operations"`
- **Entities**: access via `context.entities.Plant.findMany(...)` (Prisma client)
- **Client imports**: `import { useQuery, getPlants } from "wasp/client/operations"`
- **Auth client**: `import { useAuth, logout } from "wasp/client/auth"`

### Tailwind CSS v4
- No `tailwind.config.js` — theme defined in `src/App.css` using `@theme { }` block.
- Custom utilities via `@utility name { @apply ...; }` in App.css.
- Available utilities: `card`, `page-container`, `page-title`, `btn-primary`, `btn-secondary`, `label`.
- Color palette: `primary-*` (green), `accent-*` (gold), `earth-*` (brown), `neutral-*`.

### React Router v7
- Import from `"react-router"` (NOT react-router-dom).
- Root component uses `<Outlet />`.
- Params: `import { useParams } from "react-router"`.
- Links: `import { Link } from "react-router"`.

### Component Patterns
- Pages use `page-container` wrapper with `page-title` heading.
- Data fetching via `useQuery` hook from WASP.
- Loading states: show simple "Loading..." text.
- Error states: show error message.
- Empty states: friendly message with CTA.

### Calendar Engine
- Events auto-generated from plant schedule fields relative to property frost dates.
- `generationKey` ensures idempotent regeneration (e.g., `"2026:plantId:SEED_START_INDOOR"`).
- Events with `isUserEdited: true` are never overwritten by regeneration.

### Garden Bed Grid
- `BedSquare` is authoritative for grid layout.
- `Planting` is the lifecycle record (planted → harvested).
- Grid rendered with CSS Grid: `grid-template-columns: repeat(widthFt, 1fr)`.
- `saveBedSquares` batch action handles grid saves.

### Photos
- Store S3 object `key` only in `Photo.key`.
- Access URLs derived server-side via presigned URLs (not stored).
- Railway Object Storage (S3-compatible) — not yet configured.

### Multi-user
- `PropertyMember` join table with roles (OWNER, MEMBER).
- Creating a property auto-creates OWNER membership for current user.
- All property-scoped queries filter by membership.

## Climate Data (Zone 3B, Regina SK)
- Last spring frost: ~May 20-21
- First fall frost: ~Sep 10-12
- Frost-free days: ~112-115
- Property defaults: `lastFrostDate: "05-21"`, `firstFrostDate: "09-12"`, `timezone: "America/Regina"`
