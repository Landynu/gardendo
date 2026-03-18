# GardenDo — Outstanding Work

Single source of truth for outstanding work items. Cross-references detailed plans in `plans/`.

## Priority Legend
- **P0**: Blocking / critical path
- **P1**: Important, do next
- **P2**: Nice to have
- **P3**: Future / deferred

## Outstanding Items

### P1 — Important

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Photo upload (S3/Railway Object Storage) | Not started | Schema ready, S3 not configured |
| 2 | Home Assistant sensor integration | Not started | Models in schema, no implementation |
| 3 | Animal tracking UI | Not started | Models in schema |
| 4 | Water system logging UI | Not started | Models in schema |
| 5 | Compost bin tracking UI | Not started | Models in schema |
| 6 | Harvest logging UI | Not started | Models in schema |
| 7 | Inventory management UI | Not started | Models in schema |

### P2 — Nice to Have

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | PWA / offline support | Not started | See PLAN.md |
| 2 | Data visualization (recharts) | Not started | Yield tracking, harvest stats |
| 3 | Frost alert notifications | Not started | PgBoss job defined in PLAN.md |

### P3 — Future

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Plant data API sync (Trefle) | Partial | enrichPlants action exists |
| 2 | Weather API integration | Not started | |
| 3 | Soil testing records | Not started | |

## Completed

- [x] Core plant library with CRUD
- [x] Garden bed grid (square foot)
- [x] Calendar engine with idempotent generation
- [x] Task management with recurrence
- [x] Multi-user with PropertyMember roles
- [x] Member invitation system
- [x] AI bed designer with streaming chat
- [x] Companion planting chart
- [x] Plant enrichment via API
