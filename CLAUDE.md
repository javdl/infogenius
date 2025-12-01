# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InfoGenius Vision is a React web application that generates AI-powered infographics using Google's Gemini API. Users enter a topic, select audience level, visual style, and language, then the app researches the topic using Google Search grounding and generates a visual infographic.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build
```

## Environment Setup

Create `.env.local` with:
```
GEMINI_API_KEY=your_api_key_here
```

The API key requires billing enabled for Gemini 3 Pro models.

## Architecture

**Entry Point**: `index.tsx` → `App.tsx` (main component with all state management)

**Core Flow**:
1. User enters topic with settings (complexity, style, language)
2. `researchTopicForPrompt()` in `geminiService.ts` uses Gemini with Google Search grounding to research topic and generate an image prompt
3. `generateInfographicImage()` generates the infographic using Gemini 3 Pro Image
4. User can edit/refine the image via `editInfographicImage()`

**Components** (`components/`):
- `IntroScreen.tsx` - Animated splash screen with skip option
- `Loading.tsx` - Research progress display with fact cycling
- `Infographic.tsx` - Image display with fullscreen, zoom, download, and edit controls
- `SearchResults.tsx` - Displays grounding sources from research

**Services** (`services/geminiService.ts`):
- Handles all Gemini API interactions
- Models: `gemini-3-pro-preview` (text/research), `gemini-3-pro-image-preview` (image generation/editing)
- Uses Google Search tool for grounding research results

**Types** (`types.ts`):
- `ComplexityLevel`: Elementary | High School | College | Expert
- `VisualStyle`: Default | Minimalist | Realistic | Cartoon | Vintage | Futuristic | 3D Render | Sketch
- `Language`: 10 supported languages
- `GeneratedImage`, `SearchResultItem`, `ResearchResult` interfaces

## Key Implementation Details

- API key injected via Vite's `define` config from `GEMINI_API_KEY` env var
- Dark/light mode toggle persisted via `document.documentElement.classList`
- Image history maintained in component state (not persisted)
- Aspect ratio hardcoded to 16:9
- Path alias: `@/*` maps to project root
