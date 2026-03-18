# AI Designer

AI-powered garden bed design assistant with streaming chat.

## Overview
- Users can chat with an AI to get garden bed layout suggestions
- Supports OpenRouter and Anthropic API providers
- API keys stored encrypted in User model
- Conversations persist across sessions via AiChatSession
- Design suggestions saved to BedDesignHistory

## Architecture

### Key Files
- `src/components/AiDesigner.tsx` — Main chat UI component
- `src/ai/middleware.ts` — Auth + API key validation middleware
- `src/ai/routes.ts` — `/api/ai/design-bed` streaming endpoint
- `src/ai/queries.ts` — `getAiChatSession`, `getAiKeyStatus`
- `src/ai/actions.ts` — `saveAiApiKey`, `deleteAiApiKey`, `saveDesignHistory`, `saveAiChatSession`, `updateAiSystemPrompt`

### Streaming Flow
```
Client POST /api/ai/design-bed
  → AI middleware (verify auth + API key)
  → Build prompt (system prompt + bed context + companion data)
  → Stream response via Server-Sent Events
  → Client renders incrementally
```

### API Key Management
- Users provide their own API key (OpenRouter or Anthropic)
- Keys encrypted before storage in `User.aiApiKey`
- Provider stored in `User.aiProvider`
- Property-level custom system prompt in `Property.aiSystemPrompt`

### Chat Persistence
- `AiChatSession` stores conversation history per bed
- Sessions can be resumed across page loads
- Design history saved separately in `BedDesignHistory`

## Configuration
- Env vars: None required (users provide their own API keys)
- Custom system prompts configurable per property in Settings

## Related
- [GARDEN_BEDS.md](GARDEN_BEDS.md) — Bed context for AI
- [COMPANION_PLANTING.md](COMPANION_PLANTING.md) — Companion data fed to AI
