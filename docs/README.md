# GardenDo Documentation

Permaculture property management app for a 25-acre Zone 3B property near Regina, SK.
Built with WASP 0.21, React 19, TypeScript, Tailwind CSS v4, PostgreSQL.

## Architecture

| Document | Description |
|---|---|
| [ARCHITECTURE.md](architecture/ARCHITECTURE.md) | System design, tech stack, data flow |
| [DATABASE_SCHEMA.md](architecture/DATABASE_SCHEMA.md) | Entity relationships, key models |
| [AUTH_SYSTEM.md](architecture/AUTH_SYSTEM.md) | Multi-user auth, PropertyMember, invitation flow |

## Features

| Document | Description |
|---|---|
| [CALENDAR_ENGINE.md](features/CALENDAR_ENGINE.md) | Auto-generated events from plant schedules + frost dates |
| [GARDEN_BEDS.md](features/GARDEN_BEDS.md) | Square foot garden bed grid, plantings, layout |
| [PLANT_LIBRARY.md](features/PLANT_LIBRARY.md) | Plant database, Trefle API sync, enrichment |
| [AI_DESIGNER.md](features/AI_DESIGNER.md) | AI-powered bed designer with streaming chat |
| [COMPANION_PLANTING.md](features/COMPANION_PLANTING.md) | Companion plant relationships and charts |
| [PHOTO_SYSTEM.md](features/PHOTO_SYSTEM.md) | S3-compatible photo storage, presigned URLs |

## Guides

| Document | Description |
|---|---|
| [DEVELOPMENT.md](guides/DEVELOPMENT.md) | Setup, coding standards, WASP patterns |
| [DEPLOYMENT.md](guides/DEPLOYMENT.md) | Railway deployment, env vars, migrations |
| [STYLING.md](guides/STYLING.md) | Tailwind v4 design system, color palette, custom utilities |

## Plans

Active implementation plans are in [plans/](plans/). Completed plans are archived in [archive/](archive/).

## Related

- [CLAUDE.md](../CLAUDE.md) — Project conventions for Claude Code
- [PLAN.md](../PLAN.md) — Full architecture and schema plan
- [.claude/rules/](../.claude/rules/) — Claude Code rules
