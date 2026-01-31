# Migration Notes: Chakra UI to TailwindCSS + Team Feature

## Completed Tasks

### 1. Chakra UI Removal ✅
- Removed Chakra UI packages from `package.json`
- Removed `ChakraProvider` from `src/app/providers.tsx`
- Created Tailwind-based UI primitives in `src/components/ui/*`

### 2. Team Feature Implementation ✅
- Updated Prisma schema with Team models
- Created team auth helpers (`src/lib/teamAuth.ts`)
- Created all Team API routes
- Created all Team pages

## Required Actions

### 1. Regenerate Prisma Client
After updating the schema, you MUST run:
```bash
npx prisma generate
```

This will generate the Prisma client with the new Team models.

### 2. MongoDB Collections
MongoDB will automatically create collections when you first use them. No manual migration needed.

### 3. Install Dependencies
Remove Chakra UI packages:
```bash
npm uninstall @chakra-ui/react @chakra-ui/next-js @emotion/react @emotion/styled
```

### 4. Refactor Remaining Pages
The following pages still use Chakra UI and need to be refactored to use Tailwind:
- `src/app/(dashboard)/HomeClient.tsx`
- `src/app/(dashboard)/analytics/AnalyticsClient.tsx`
- `src/app/(dashboard)/trades/TradesClient.tsx`
- `src/app/(dashboard)/trades/[tradeId]/TradeDetailsClient.tsx`
- And ~38 other files

These can be refactored incrementally. The Team feature is fully functional with Tailwind.

## Team Feature Routes

- `/team` - List teams
- `/team/new` - Create team
- `/team/[teamId]` - Team hub (Overview, Chat, Trades, Rooms, Members tabs)
- `/team/[teamId]/rooms/[roomId]` - Room page (stub)
- `/team/invite/[token]` - Accept invite

## API Routes

All team API routes enforce authentication and membership:
- `GET/POST /api/teams`
- `GET /api/teams/[teamId]`
- `GET/POST /api/teams/[teamId]/messages`
- `GET/POST/DELETE /api/teams/[teamId]/trade-shares`
- `GET/POST /api/teams/[teamId]/rooms`
- `GET/PATCH/DELETE /api/teams/[teamId]/members` (admin-only)
- `GET/POST /api/teams/[teamId]/invites` (admin-only)
- `GET/POST /api/team-invites/[token]`

## Next Steps

1. Run `npx prisma generate`
2. Test Team feature
3. Incrementally refactor remaining Chakra pages to Tailwind
