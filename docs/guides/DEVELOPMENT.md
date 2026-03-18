# Development Guide

## Prerequisites
- Node.js 20+
- PostgreSQL (local or Docker)
- WASP CLI 0.21.x (`curl -sSL https://get.wasp.sh/installer.sh | sh`)

## Getting Started

```bash
# Clone and install
git clone https://github.com/Landynu/gardendo.git
cd gardendo
npm install

# Set up environment
cp .env.server.example .env.server  # Configure DATABASE_URL, SMTP vars

# Database setup
wasp db migrate-dev "initial"
wasp db seed

# Start development
wasp start
```

## Development Workflow

1. **Schema changes** → Edit `schema.prisma` → Run `/db-migrate` → Restart `wasp start`
2. **New operations** → Use `/wasp-operation` skill to scaffold
3. **New pages** → Use `/wasp-page` skill to scaffold
4. **After code changes** → Run `/rebake` to update CartoGopher index

## Coding Standards

### File Organization
- Queries: `src/{feature}/queries.ts`
- Actions: `src/{feature}/actions.ts`
- Pages: `src/pages/{PageName}.tsx`
- Components: `src/components/{ComponentName}.tsx`

### Naming
- Components/Pages: PascalCase
- Operations: camelCase
- Types/Enums: PascalCase
- Files: camelCase for operations, PascalCase for components

### Imports
- WASP: `wasp/...` prefix in .ts/.tsx, `@src/...` in main.wasp
- Prisma enums: VALUES from `@prisma/client`, TYPES from `wasp/entities`
- React Router: from `"react-router"` (NOT react-router-dom)
- Icons: from `lucide-react`

### Dates
- Farm dates: `String` in `YYYY-MM-DD` (planting, harvest, due dates)
- Frost dates: `String` in `MM-DD`
- Timestamps: `DateTime` (createdAt, updatedAt only)
- Date math: always use `date-fns`

## Common Issues
- **Types not updating**: Restart `wasp start`
- **Missing entity access**: Add to `entities: [...]` in main.wasp
- **Import errors**: Check wasp/ vs @src/ prefix for context
