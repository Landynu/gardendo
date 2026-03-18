# Photo System

S3-compatible photo storage with presigned URLs.

## Overview
- Photos stored as S3 object keys in the `Photo` model (not full URLs)
- Access URLs generated server-side via presigned URLs
- Photos can be attached to multiple contexts: zones, beds, tasks, animals, harvest logs, inventory, plants
- Plants can have a designated display photo

## Architecture

### Key Files
- `src/photos/queries.ts` — `getPhotoUrl`, `getPlantPhotos`
- `src/photos/actions.ts` — `getUploadUrl`, `setPlantDisplayPhoto`
- `schema.prisma` — `Photo` model with multiple optional foreign keys

### Upload Flow (Planned)
```
Client requests upload URL → getUploadUrl action → Generate presigned PUT URL
Client uploads directly to S3 → Create Photo record with object key
```

### Display Flow
```
Client needs photo → getPhotoUrl query → Generate presigned GET URL → Return temporary URL
```

## Configuration
- Railway Object Storage (S3-compatible) — not yet configured
- Env vars needed: `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION`

## Status
Schema is ready but S3 storage is not yet configured on Railway. Photo upload/display UI is pending.

## Related
- [PLANT_LIBRARY.md](PLANT_LIBRARY.md) — Plant display photos
- [GARDEN_BEDS.md](GARDEN_BEDS.md) — Bed photos
