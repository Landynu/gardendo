# AI Garden Designer — Implementation Plan

## Context

GardenDo has rich plant data (95+ plants, 16 families, 157 companion relationships, permaculture attributes, Trefle-sourced environment data) and a square-foot grid bed designer with drag-and-drop. There is no AI integration yet. The goal is to add an AI-powered "Design with AI" feature that acts as an expert master gardener, conversationally designing bed layouts with full awareness of the property's climate, companion planting rules, crop rotation by family, and succession/staggered planting. The AI system prompt should be editable from Settings so it can be tuned without code changes. Additional AI touch-points throughout the app should also be planned.

---

## Decisions

### Model: Claude Sonnet via Anthropic SDK
- **Tool use** guarantees valid JSON grid output (no parsing failures)
- Excellent at following complex system prompts with large context
- `@anthropic-ai/sdk` works server-side in Node.js
- Cost-effective at 1-2 users; Sonnet is the sweet spot for quality/cost

### API Key: Bring Your Own Key (BYOK) at user level
- Each user stores their own Anthropic API key in Settings
- Key stored **encrypted** on the `User` model (`aiApiKey` field, encrypted at rest via AES-256-GCM)
- Server-side `AI_ENCRYPTION_KEY` env var used to encrypt/decrypt — a random 32-byte hex string
- No env-var API key needed — each user brings their own
- Settings page shows a masked key input with save/clear buttons
- API endpoints read the user's key from DB, decrypt, and pass to Anthropic SDK per-request
- If no key set, AI features show a friendly prompt to add one in Settings

### Streaming: WASP `api` route with SSE
- WASP actions are request-response only — can't stream
- WASP `api` routes expose raw Express `(req, res, context)` — perfect for SSE
- API key decrypted server-side per request; auth handled by WASP (`auth: true`)
- Client reads stream via `fetch` + `ReadableStream` reader

### Conversation state: Client-side
- Multi-turn chat lives in React state (simple, no new DB model for ephemeral messages)
- When user accepts a layout → populates `localSquares` → saves via existing `saveBedSquares`
- Accepted designs optionally persisted in `BedDesignHistory` for undo/reference

---

## Phase 1: "Design with AI" Bed Layout

### 1.1 Schema Changes

**File: `schema.prisma`**

```prisma
// Add to User model:
  aiApiKey        String?   // Encrypted Anthropic API key (AES-256-GCM)

// Add to Property model:
  aiSystemPrompt  String?   // Custom AI system prompt override

// New model:
model BedDesignHistory {
  id          String    @id @default(uuid())
  bed         GardenBed @relation(fields: [bedId], references: [id])
  bedId       String
  year        Int
  season      Season    @default(SPRING)
  layoutJson  String    // JSON: [{row, col, plantId}]
  prompt      String    // User prompt that triggered this
  acceptedAt  DateTime  @default(now())
}

// Add to GardenBed model:
  designHistory BedDesignHistory[]
```

Migration: `wasp db migrate-dev --name add-ai-design`

### 1.2 Backend — New Files

Keep AI code isolated in `src/ai/` (separate from existing plant/garden code per user's preference for smaller files):

```
src/ai/
  client.ts       # Anthropic SDK client factory (per-user key)
  crypto.ts       # AES-256-GCM encrypt/decrypt for API keys
  context.ts      # Assembles DB data into system prompt context
  prompts.ts      # Default system prompt templates
  designApi.ts    # SSE streaming endpoint for bed design
  chatApi.ts      # SSE streaming endpoint for general chat (Phase 2)
  actions.ts      # WASP actions (saveApiKey, updateAiSystemPrompt, saveDesignHistory)
```

#### `src/ai/crypto.ts` — API key encryption
- Uses Node.js `crypto` module with AES-256-GCM
- `AI_ENCRYPTION_KEY` env var (32-byte hex string) for key derivation
- `encrypt(plaintext: string): string` — returns `iv:authTag:ciphertext` as hex
- `decrypt(encrypted: string): string` — reverses the above
- Throws clear error if `AI_ENCRYPTION_KEY` env var is missing

#### `src/ai/client.ts` — Anthropic SDK per-request client
- `getAnthropicClient(encryptedKey: string): Anthropic` — decrypts key, creates SDK client
- No singleton — each request creates a client with the user's own key
- Throws user-friendly error if key is invalid/expired

#### `src/ai/context.ts` — Context assembly
```typescript
export async function buildBedDesignContext(
  entities: any,
  propertyId: string,
  bedId: string,
  year: number,
  season: string,
): Promise<{ systemPrompt: string; plantLookup: Record<string, any> }>
```

Gathers and formats into compact text sections:
1. **Property climate** — zone, frost dates, frost-free days (~112), lat/long, timezone
2. **Bed specs** — name, dimensions, shape, type, height, soil, active cell count + list
3. **Current date & season context** — today's date, weeks until/since frost dates
4. **Available plants** — compact table with columns: `id | name | variety | family | category | plantsPerSqFt | spacingIn | sun | water | seasonType | daysToMaturity | startIndoorWeeks | transplantWeeks | directSowWeeks | permLayer | nitrogenFixer | dynamicAccumulator | attractsPollinators | toxicity | minRootDepthCm | growthHabit | deerResistant`
5. **Companion relationships** — compact list: `PlantA + PlantB = BENEFICIAL/HARMFUL/NEUTRAL`
6. **What's already planted this year** — query all BedSquares for this property/year, grouped by bed name and family, so AI can recommend crop rotation
7. **Plant families** — list with common names for rotation group context
8. **Planting calendar context** — for each plant, calculate concrete dates from frost dates:
   - Indoor seed start date = lastFrostDate + startIndoorWeeks (negative = before frost)
   - Transplant date = lastFrostDate + transplantWeeks
   - Direct sow date = lastFrostDate + directSowWeeks
   - Estimated harvest date = planting date + daysToMaturity
   - Season end = firstFrostDate
   - "Is it too late to plant this?" flag based on current date
   - Example output per plant: `Tomato Early Girl: start indoors Mar 26, transplant May 28, harvest ~Jul 24, 57 days to maturity`
9. **Staggered/succession planting windows** — identify plants where multiple sowings fit within the frost-free window (e.g., lettuce every 2-3 weeks, radish every 2 weeks) based on `daysToMaturity` vs remaining frost-free days

Also returns `plantLookup` (id → plant object) so the frontend can resolve AI-returned IDs to full Plant objects.

Token estimate: ~5,000-7,000 tokens for 95 plants + 157 companions + property context. Well within limits.

#### `src/ai/prompts.ts` — Default system prompt

```
You are an expert permaculture garden designer specializing in cold-climate
growing. You have deep knowledge of companion planting, crop rotation,
succession planting, and square-foot gardening techniques.

## Your Approach
1. Ask 2-3 focused questions to understand the gardener's goals
2. Consider companion planting relationships from the provided data
3. Respect crop rotation — avoid same family where it grew last year
4. Account for plant heights (tall plants on north side to avoid shading)
5. Maximize space using plantsPerSqFt densities
6. Consider frost dates and season type for timing
7. For raised beds, check root depth vs bed height
8. Plan for succession/staggered planting when the season allows it
9. Consider nitrogen fixers and dynamic accumulators for soil health

## Timing Awareness
- You are given concrete planting dates for each plant (indoor start, transplant, direct sow, harvest)
- Flag if a plant is too late to start given the current date
- Suggest the best planting date based on the season and frost window

## Staggered / Succession Planting
When appropriate, suggest succession plantings:
- Fast crops (radish, lettuce) can be sown every 2-3 weeks for continuous harvest
- Early cool-season crops can be followed by warm-season crops in the same cells
- Note which cells could be replanted mid-season after early harvest
- Include specific timing (e.g., "Sow lettuce April 15, harvest by June 1, then plant bush beans June 5")

## Rules
- Only suggest plants from the provided plant database (use exact plant IDs)
- Maximize BENEFICIAL neighbors, avoid HARMFUL pairings
- Default: one primary family per bed unless user overrides
- When ready, call generate_bed_layout to produce the grid
- Include succession notes in the explanation when applicable

## Key Questions to Ask
- Primary goal? (max yield, pollinator support, companion synergy, specific crops)
- Must-have or must-avoid plants?
- One family or mixed planting?
- Interested in succession planting within the season?
```

#### `src/ai/designApi.ts` — SSE streaming endpoint

The handler:
1. Parse body: `{ bedId, propertyId, year, season, messages: [{role, content}] }`
2. Auth check via `context.user`
3. Verify property membership
4. Call `buildBedDesignContext()` to assemble system prompt
5. If property has `aiSystemPrompt`, use it (with context data appended), else use default
6. Define the `generate_bed_layout` tool:
   ```typescript
   {
     name: "generate_bed_layout",
     description: "Generate a square-foot garden bed layout. Call this when you have enough information to design the bed.",
     input_schema: {
       type: "object",
       properties: {
         layout: {
           type: "array",
           items: {
             type: "object",
             properties: {
               row: { type: "number" },
               col: { type: "number" },
               plantId: { type: "string" }
             },
             required: ["row", "col", "plantId"]
           }
         },
         explanation: { type: "string", description: "Design rationale including companion synergy, rotation notes, and succession planting suggestions" },
         successionNotes: {
           type: "array",
           items: {
             type: "object",
             properties: {
               cells: { type: "string", description: "Cell range, e.g. 'rows 0-1, cols 0-3'" },
               timing: { type: "string", description: "When to replant, e.g. 'After lettuce harvest (~June 15), plant bush beans'" },
               plantId: { type: "string" }
             }
           },
           description: "Optional succession planting plan for cells that can be replanted mid-season"
         }
       },
       required: ["layout", "explanation"]
     }
   }
   ```
7. Call Anthropic API with `stream: true`
8. Set SSE headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
9. Stream events:
   - `data: {"type":"text","content":"..."}\n\n` — for conversational text chunks
   - `data: {"type":"layout","layout":[...],"explanation":"...","successionNotes":[...]}\n\n` — when tool use completes
   - `data: {"type":"done"}\n\n` — stream complete
   - `data: {"type":"error","message":"..."}\n\n` — on failure

#### `src/ai/actions.ts` — WASP actions

```typescript
// saveAiApiKey — encrypts and saves user's Anthropic API key to User model
// getAiApiKeyStatus — returns whether key is set (boolean), never returns the actual key
// deleteAiApiKey — clears the user's stored API key
// updateAiSystemPrompt — saves custom prompt to Property
// saveDesignHistory — persists accepted layout for reference
```

### 1.3 WASP Declarations

**File: `main.wasp`** — add:

```wasp
api aiDesignBed {
  fn: import { aiDesignBed } from "@src/ai/designApi",
  httpRoute: (POST, "/api/ai/design-bed"),
  auth: true,
  entities: [User, Plant, PlantFamily, CompanionPlant, Property, PropertyMember,
             GardenBed, BedSquare, Planting, PropertyZone]
}

action saveAiApiKey {
  fn: import { saveAiApiKey } from "@src/ai/actions",
  entities: [User]
}

query getAiKeyStatus {
  fn: import { getAiKeyStatus } from "@src/ai/actions",
  entities: [User]
}

action deleteAiApiKey {
  fn: import { deleteAiApiKey } from "@src/ai/actions",
  entities: [User]
}

action updateAiSystemPrompt {
  fn: import { updateAiSystemPrompt } from "@src/ai/actions",
  entities: [Property, PropertyMember]
}
```

### 1.4 Frontend — New Files

#### `src/lib/aiStream.ts` — SSE client helper

```typescript
export async function streamAiDesign(opts: {
  bedId: string;
  propertyId: string;
  year: number;
  season: string;
  messages: { role: string; content: string }[];
  onText: (chunk: string) => void;
  onLayout: (data: { layout: LayoutCell[]; explanation: string; successionNotes?: SuccessionNote[] }) => void;
  onError: (msg: string) => void;
  onDone: () => void;
}): Promise<AbortController>
```

- Uses `fetch` with `credentials: 'include'` (for WASP session cookie)
- Reads response as `ReadableStream`, parses SSE `data:` lines
- Returns `AbortController` for cleanup on unmount

#### `src/components/AiDesigner.tsx` — Main AI chat panel

A slide-over panel triggered from BedDetailPage:

- **Chat message list** — scrollable, auto-scroll on new messages
- **User input** — textarea + send button (Enter to send, Shift+Enter for newline)
- **Streaming indicator** — animated dots while AI responds
- **Layout preview** — when AI calls `generate_bed_layout`, render an `AiGridPreview` inline in the chat with the proposed layout
- **Succession notes** — if the AI includes succession planting notes, show them as a timeline/list below the grid preview
- **Action buttons below preview**: "Accept Layout", "Modify" (continues conversation), "Start Over"
- **Accept** → calls `onAcceptLayout(layout)` callback → parent sets `localSquares` + `isDirty`

Props:
```typescript
type AiDesignerProps = {
  bed: GardenBed;
  propertyId: string;
  year: number;
  season: string;
  plants: Plant[];              // for resolving plantId → Plant
  onAcceptLayout: (squares: Map<string, Plant>) => void;
  onClose: () => void;
};
```

#### `src/components/AiGridPreview.tsx` — Mini grid preview

Simplified read-only version of the bed grid:
- Reuses `getActiveCells()` from `src/lib/bedShapes.ts`
- Shows plant colors + 2-letter abbreviations
- Visual distinction from the real grid (e.g., dashed border, "AI Suggestion" badge)
- Companion indicators same as main grid

### 1.5 BedDetailPage Integration

**File: `src/pages/BedDetailPage.tsx`**

Add to toolbar:
```tsx
<button onClick={() => setAiPanelOpen(true)} className="btn-secondary">
  <Sparkles className="h-4 w-4" />
  Design with AI
</button>
```

New state: `const [aiPanelOpen, setAiPanelOpen] = useState(false);`

Need `propertyId` — derive from `bed.zone.propertyId` (already included in `getBedById` response via zone include).

Verify `getBedById` includes `zone.propertyId`:

**File to check: `src/garden/queries.ts`** — may need to add `propertyId` to the zone include.

### 1.6 Settings Page Addition

**File: `src/pages/SettingsPage.tsx`**

Add two new cards after existing sections:

**"AI API Key" card:**
- Password input for Anthropic API key (masked, shows `sk-ant-...xxxx` when set)
- "Save Key" button → calls `saveAiApiKey` (encrypts + stores)
- "Remove Key" button → calls `deleteAiApiKey`
- Status indicator: green checkmark if key is set, prompt to add if not
- Link to Anthropic's API key page for convenience
- Note: "Your key is encrypted at rest and never exposed to the browser after saving."

**"AI System Prompt" card:**
- Textarea with current `aiSystemPrompt` (or default prompt shown as placeholder)
- "Save" button → calls `updateAiSystemPrompt`
- "Reset to Default" button → saves `null` (clears override, falls back to default)
- Info text: "Customize how the AI garden designer behaves. The property's climate data, plant database, and companion relationships are automatically included."

### 1.7 Dependencies & Env

```bash
npm install @anthropic-ai/sdk
```

Add to `.env.server`:
```
AI_ENCRYPTION_KEY=<random-64-char-hex-string>
```

Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

No `ANTHROPIC_API_KEY` env var needed — each user brings their own key via Settings.

---

## Phase 1.5: Invite Members to Property

Lightweight addition — no "group" refactor needed. Property *is* the shared group. The data model and auth checks already support multi-user; we just need the invite workflow.

### Schema

```prisma
// New model:
model PropertyInvitation {
  id              String       @id @default(uuid())
  email           String
  property        Property     @relation(fields: [propertyId], references: [id])
  propertyId      String
  invitedBy       User         @relation(fields: [invitedByUserId], references: [id])
  invitedByUserId String
  token           String       @unique @default(uuid())
  role            PropertyRole @default(MEMBER)
  expiresAt       DateTime
  acceptedAt      DateTime?

  createdAt       DateTime     @default(now())

  @@unique([email, propertyId])
}

// Add relations to Property and User models:
//   Property: invitations PropertyInvitation[]
//   User:     invitations PropertyInvitation[]
```

### Backend

**File: `src/property/inviteActions.ts`** (new, separate file per preference)
- `inviteToProperty({ email, propertyId, role })` — creates invitation with 7-day expiry, sends invite email via WASP's `emailSender`
- `acceptInvitation({ token })` — validates token + expiry, creates PropertyMember, marks invitation accepted
- Only OWNER can invite (check role in `PropertyMember`)

**File: `src/property/inviteQueries.ts`** (new)
- `getPendingInvitations({ propertyId })` — returns pending (not accepted, not expired) invitations

### Frontend

**Settings page addition** — in the Members card:
- "Invite Member" button (OWNER only)
- Modal with email input + role selector (OWNER/MEMBER)
- List of pending invitations with cancel option
- Invited user receives email with link → `/accept-invite?token=xxx`

**New page: `src/pages/AcceptInvitePage.tsx`**
- Reads token from URL params
- If logged in → calls `acceptInvitation` → redirects to dashboard
- If not logged in → redirects to signup, then back to accept

### Settings Scope Recap

| Setting | Lives on | Shared? | Why |
|---------|----------|---------|-----|
| API Key | `User.aiApiKey` | No — per person | BYOK, your wife may use her own key |
| System Prompt | `Property.aiSystemPrompt` | Yes — shared | Same property/climate = same AI personality |

---

## Phase 2: General AI Chat + Contextual Helpers

### 2.1 Global "Ask AI" Chat

A garden Q&A chatbot accessible from the sidebar/nav. Reuses the same SSE streaming infra but with a different context (full property overview, current tasks, calendar events, all beds).

```
src/ai/chatApi.ts    # New SSE endpoint
src/components/AiChat.tsx  # Slide-over chat panel in App.tsx
```

**WASP declaration:**
```wasp
api aiChat {
  fn: import { aiChat } from "@src/ai/chatApi",
  httpRoute: (POST, "/api/ai/chat"),
  auth: true,
  entities: [Plant, PlantFamily, CompanionPlant, Property, PropertyMember,
             GardenBed, BedSquare, Planting, CalendarEvent, Task, PropertyZone]
}
```

Tools the AI can use:
- `suggest_tasks` — generates task suggestions, user can one-click add
- `lookup_plant` — searches the plant database for the user
- `companion_check` — checks companion relationships between plants

### 2.2 Contextual AI Throughout the App

Small, focused AI integrations on existing pages:

| Page | Feature | Implementation |
|------|---------|---------------|
| **PlantDetailPage** | "AI Companion Suggestions" — what to pair with this plant | Non-streaming action, short response |
| **CalendarPage** | "AI Season Brief" — summary of what to do this week/month | Non-streaming action using calendar events + date |
| **DashboardPage** | "AI Garden Summary" — overview of garden status + next actions | Non-streaming action, runs on page load with cache |
| **BedDetailPage** | "AI Rotation Check" — warns if same family was planted last year | Can be inline without LLM (pure data check), or enhanced with AI explanation |

These can all share a common non-streaming action:

```wasp
action aiQuickAdvice {
  fn: import { aiQuickAdvice } from "@src/ai/actions",
  entities: [Plant, PlantFamily, CompanionPlant, Property, PropertyMember,
             GardenBed, BedSquare, Planting, CalendarEvent, Task, PropertyZone]
}
```

---

## Phase 3: Photo-Based AI (Future)

### 3.1 Plant Identification
Upload photo → Claude Vision identifies plant → suggests match from DB or Trefle import.

### 3.2 Pest/Disease Diagnosis
Upload photo + symptoms → Claude Vision diagnoses → suggests treatment.

Both use Anthropic SDK's vision capability (image URLs in messages). Requires S3/photo infrastructure to be fully set up first.

---

## File Structure Summary

```
src/ai/
  client.ts           # Anthropic SDK per-request client factory
  crypto.ts           # AES-256-GCM encrypt/decrypt for API keys
  context.ts          # DB data → system prompt context builder
  prompts.ts          # Default system prompt templates
  designApi.ts        # POST /api/ai/design-bed (SSE)
  chatApi.ts          # POST /api/ai/chat (SSE) — Phase 2
  actions.ts          # saveAiApiKey, getAiKeyStatus, deleteAiApiKey,
                      #   updateAiSystemPrompt, saveDesignHistory, aiQuickAdvice
src/components/
  AiDesigner.tsx      # "Design with AI" chat panel for BedDetailPage
  AiGridPreview.tsx   # Read-only mini grid for AI layout preview
  AiChat.tsx          # Global Q&A chat panel — Phase 2
src/lib/
  aiStream.ts         # Client-side SSE stream reader utility
```

## Implementation Order (Phase 1)

1. `schema.prisma` — add `aiApiKey` to User, `aiSystemPrompt` to Property, `BedDesignHistory` model, migrate
2. `main.wasp` — add `api aiDesignBed`, actions for key management + system prompt
3. `npm install @anthropic-ai/sdk`, add `AI_ENCRYPTION_KEY` to `.env.server`
4. `src/ai/crypto.ts` — AES-256-GCM encrypt/decrypt helpers
5. `src/ai/client.ts` — per-request Anthropic client factory
6. `src/ai/prompts.ts` — default system prompt
7. `src/ai/context.ts` — context assembly (property + bed + plants + companions + rotation + succession timing)
8. `src/ai/actions.ts` — key management + system prompt actions
9. `src/ai/designApi.ts` — SSE streaming endpoint with tool use
10. `src/lib/aiStream.ts` — client SSE helper
11. `src/components/AiGridPreview.tsx` — mini preview grid
12. `src/components/AiDesigner.tsx` — chat panel UI
13. `src/pages/BedDetailPage.tsx` — add "Design with AI" button + panel integration
14. `src/pages/SettingsPage.tsx` — add AI API key + system prompt configuration cards
15. Test end-to-end: Settings → add key → open bed → Design with AI → chat → accept layout → save

## Verification

1. **Unit**: Context assembly produces valid, compact prompt text with all data sections
2. **Integration**: SSE endpoint streams text chunks and tool-use layout correctly
3. **E2E**: Full flow — open bed → Design with AI → answer questions → AI generates layout → preview renders correctly → Accept → grid populates → Save persists to DB
4. **Settings**: Custom system prompt saves/loads/resets correctly
5. **Edge cases**: Oval bed (active cells filtering), empty bed, no companion data, large bed (10x10+)
