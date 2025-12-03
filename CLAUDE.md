# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InfoGenius Vision is a React web application that generates AI-powered infographics using Google's Gemini API. Users enter a topic, select audience level, visual style, and language, then the app researches the topic using Google Search grounding and generates a visual infographic.

## Commands

```bash
pnpm install         # Install dependencies
pnpm dev             # Start development server (port 3000)
pnpm build           # Build for production (outputs to dist/)
pnpm preview         # Preview production build
```

No linting or testing is currently configured.

## Environment Setup

Create `.env.local` with:
```
GEMINI_API_KEY=your_api_key_here
```

**Important**: The API key requires billing enabled for Gemini 3 Pro models. Free-tier keys will fail with 403/404 errors.

## Deployment

See `docs/deployment-gcp-cloud-run.md` for Cloud Run deployment with IAP authentication.

**Docker Build**: Multi-stage build (Node 20 Alpine) that bakes `GEMINI_API_KEY` into the JS bundle at build time, then serves static files via `serve` on port 8080.

## Architecture

**Entry Point**: `index.tsx` → `App.tsx`

**State Management**: All state lives in `App.tsx` (no Redux/Context). State includes form inputs, loading state, image history (in-memory only), and search results from grounding.

**Core Flow**:
1. User enters topic with settings (complexity, style, language)
2. `researchTopicForPrompt()` uses Gemini with Google Search grounding to research and generate an image prompt
3. `generateInfographicImage()` generates the infographic
4. User can edit/refine via `editInfographicImage()` with the current image + edit instruction

**Services** (`services/geminiService.ts`):
- `researchTopicForPrompt()` - Research with Google Search grounding, returns facts + image prompt
- `generateInfographicImage()` - Generate infographic from prompt
- `editInfographicImage()` - Edit existing image with instruction
- Models: `gemini-3-pro-preview` (text), `gemini-3-pro-image-preview` (image)
- API client instantiated fresh per request via `getAi()` to pick up latest API key

**Types** (`types.ts`): `ComplexityLevel`, `VisualStyle`, `Language`, `GeneratedImage`, `SearchResultItem`, `ResearchResult`

## Key Implementation Details

- **API Key Handling**: Baked into JS bundle at build time via Vite's `define` config.
  - For local dev: Set `GEMINI_API_KEY` in `.env.local`
  - For Cloud Run: Pass via `--set-build-env-vars`
  - ⚠️ Client-side key is extractable from browser; IAP provides network-level protection
- **AI Studio Integration**: Detects context via `window.aistudio.hasSelectedApiKey()`
- **Dark/light mode**: Toggle via `document.documentElement.classList` (not persisted to localStorage)
- **Image history**: In-memory only, lost on refresh
- **Aspect ratio**: Hardcoded to 16:9
- **Path alias**: `@/*` maps to project root
