# Architecture

## Overview

GardenDo is a permaculture property management app built for a 25-acre Zone 3B property near Regina, SK. It helps plan, track, and manage garden beds, plants, tasks, animals, water systems, compost, harvest, and inventory.

## Tech Stack

- **Framework**: WASP 0.21.1 — declarative DSL generating React frontend + Node.js backend + Prisma ORM
- **Frontend**: React 19, TypeScript, React Router v7
- **Styling**: Tailwind CSS v4 (theme in `src/App.css` via `@theme {}`)
- **Icons**: lucide-react
- **Database**: PostgreSQL via Prisma
- **Background Jobs**: PgBoss (declared in main.wasp)
- **Auth**: WASP email auth (email/password with Postmark SMTP verification)
- **AI**: OpenRouter / Anthropic API for garden bed design assistant
- **Hosting**: Railway (app + PostgreSQL + future S3-compatible object storage)

## Application Structure

```
main.wasp              # Central config: routes, queries, actions, jobs, auth
schema.prisma          # Prisma models (PostgreSQL, String UUIDs)
src/
  App.tsx              # Root layout: sidebar + mobile nav + <Outlet />
  App.css              # Tailwind v4 @theme (colors, custom utilities)
  auth/                # Auth pages (Login, Signup, EmailVerification, etc.)
  pages/               # Route page components
  plants/              # Plant queries + actions
  property/            # Property queries + actions
  garden/              # Zone/Bed queries + actions
  calendar/            # Calendar queries + actions
  tasks/               # Task queries + actions
  photos/              # Photo queries + actions
  ai/                  # AI designer (middleware, routes, chat sessions)
  jobs/                # PgBoss job implementations
  lib/                 # Shared helpers (auth.ts, etc.)
  seeds/               # Database seed scripts
  components/          # Shared UI components (AiDesigner, etc.)
```

## Data Flow

### Query Pattern
```
Client (useQuery) → WASP generated API → Query handler → Prisma → PostgreSQL
```

### Action Pattern
```
Client (await action()) → WASP generated API → Action handler → Prisma → PostgreSQL
                                                                      → Cache invalidation
```

### AI Designer Flow
```
Client → POST /api/ai/design-bed → AI middleware (auth + API key) → OpenRouter/Anthropic API
                                                                   → Server-Sent Events stream
                                                                   → Client renders streamed response
```

## Key Architectural Decisions

1. **Farm dates as strings** — `YYYY-MM-DD` strings avoid timezone drift that `DateTime` would introduce for planting/harvest dates
2. **String UUIDs** — All models use `String @id @default(uuid())` per WASP 0.21 conventions
3. **Property scoping** — All data is scoped to a Property via PropertyMember join table, enabling multi-user access
4. **Calendar idempotency** — `generationKey` field ensures calendar events can be regenerated without duplicates
5. **Separate query/action files** — Unlike some WASP projects that combine into `operations.ts`, GardenDo uses `queries.ts` + `actions.ts` per feature for clarity
6. **No ShadCN** — Custom Tailwind v4 utilities (`card`, `btn-primary`, `page-container`) keep the bundle small

## Deployment

Railway hosts:
- **Web service**: WASP app (auto-deploys from main branch)
- **PostgreSQL**: Managed database
- **Object Storage**: S3-compatible (planned, for photos)
