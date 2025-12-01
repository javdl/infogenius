# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InfoGenius Vision is a React web application that generates AI-powered infographics using Google's Gemini API. Users enter a topic, select audience level, visual style, and language, then the app researches the topic using Google Search grounding and generates a visual infographic.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (port 3000)
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build
```

## Environment Setup

Create `.env.local` with:
```
GEMINI_API_KEY=your_api_key_here
```

**Important**: The API key requires billing enabled for Gemini 3 Pro models. Free-tier keys will fail with 403/404 errors.

## Deployment

The app can be deployed to Google Cloud Run. See `docs/deployment-gcp-cloud-run.md` for complete deployment instructions including:
- Cloud Run deployment with IAP authentication
- Secret Manager configuration for API keys
- Multi-stage Docker build (Node 20 Alpine → serve static files)

## Architecture

**Entry Point**: `index.tsx` → `App.tsx`

**State Management**: All state lives in `App.tsx` (no Redux/Context). State includes:
- Form inputs (topic, complexity, style, language)
- Loading state and progress messages
- Image history (not persisted, in-memory only)
- Search results from grounding
- API key validation state (for AI Studio integration)

**Core Flow**:
1. User enters topic with settings (complexity, style, language)
2. `researchTopicForPrompt()` in `geminiService.ts` uses Gemini 3 Pro Preview with Google Search grounding to research topic and generate an image prompt
3. `generateInfographicImage()` generates the infographic using Gemini 3 Pro Image Preview
4. User can edit/refine the image via `editInfographicImage()` which takes the current image + edit instruction

**Components** (`components/`):
- `IntroScreen.tsx` - Animated splash screen with skip option
- `Loading.tsx` - Research progress display with fact cycling
- `Infographic.tsx` - Image display with fullscreen, zoom, download, and edit controls
- `SearchResults.tsx` - Displays grounding sources from research

**Services** (`services/geminiService.ts`):
- Handles all Gemini API interactions
- Models: `gemini-3-pro-preview` (text/research), `gemini-3-pro-image-preview` (image generation/editing)
- Uses Google Search tool for grounding research results
- API client instantiated fresh per request via `getAi()` to pick up latest API key from `process.env.API_KEY`

**Types** (`types.ts`):
- `ComplexityLevel`: Elementary | High School | College | Expert
- `VisualStyle`: Default | Minimalist | Realistic | Cartoon | Vintage | Futuristic | 3D Render | Sketch
- `Language`: 10 supported languages
- `GeneratedImage`, `SearchResultItem`, `ResearchResult` interfaces

## Key Implementation Details

- **API Key Handling**: API key is baked into the JavaScript bundle at build time via Vite's `define` config. Supports both `GEMINI_API_KEY` (Cloud Run) and `API_KEY` (legacy) environment variable names.
  - ⚠️ Security: Since the key is client-side, anyone with app access can extract it from the browser. IAP provides network-level protection.
  - For local dev: Set `GEMINI_API_KEY` in `.env.local`
  - For Cloud Run: Pass as build arg via `--set-build-env-vars`
- **AI Studio Integration**: App detects AI Studio context via `window.aistudio.hasSelectedApiKey()` and shows key selection modal if needed
- **Dark/light mode**: Toggle persisted via `document.documentElement.classList` (not localStorage)
- **Image history**: Maintained in component state (not persisted, lost on refresh)
- **Aspect ratio**: Hardcoded to 16:9 in all API calls
- **Path alias**: `@/*` maps to project root
