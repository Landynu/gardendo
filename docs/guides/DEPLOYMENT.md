# Deployment Guide

## Railway Setup

GardenDo deploys to Railway with:
- **Web service**: WASP app (auto-deploys from main branch)
- **PostgreSQL**: Managed database instance
- **Object Storage**: S3-compatible (planned, for photos)

## Pre-Deploy Checklist

Use `/deploy-check` skill to run automated validation, or manually:

1. TypeScript compiles: `npx tsc --noEmit`
2. No pending migrations: `git diff schema.prisma` shows no changes
3. Build succeeds: `wasp build`
4. Environment variables set on Railway

## Environment Variables

### Required (`.env.server`)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
SMTP_HOST=smtp.postmarkapp.com
SMTP_PORT=587
SMTP_USERNAME=<postmark-api-key>
SMTP_PASSWORD=<postmark-api-key>
```

### Optional
```
# S3 Photo Storage (when configured)
S3_ENDPOINT=...
S3_BUCKET=...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_REGION=...
```

## Database Migrations

### Local Development
```bash
wasp db migrate-dev "description"   # or /db-migrate
```

### Production
Migrations run automatically on deploy via WASP's built-in migration system.

## Monitoring
- Railway dashboard for logs and metrics
- WASP server logs for operation errors
- PostgreSQL metrics via Railway
