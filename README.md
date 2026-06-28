# PlacementPilot AI

AI-powered placement preparation platform with personalized roadmaps, daily missions, progress tracking, and adaptive learning.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **AI**: Google Gemini (gemini-2.5-flash with gemini-3.5-flash primary + failover)
- **Storage**: Firebase + localStorage (Phase 5 migration-ready)
- **Routing**: React Router DOM v7

## Features

| Phase | Feature |
|---|---|
| 1 | Goal Analysis Agent — evaluates difficulty, feasibility, execution mode |
| 2 | Roadmap Agent — blueprint-based deterministic week allocation |
| 3 | Daily Mission Agent — converts roadmap weeks into daily execution plans |
| 4 | Progress & XP System — task completion, streaks, achievements |

## Getting Started

```bash
npm install
npm run dev
```

Create a `.env` file at the project root:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GEMINI_API_KEY=...
```

## Architecture

```
src/
├── ai/               AI agents (Goal Analysis, Roadmap, Daily Mission)
├── data/blueprints/  Deterministic learning blueprints (DSA, Java, SQL, Spring Boot)
├── repositories/     Storage abstraction layer (localStorage → Firestore swap-ready)
├── services/         Business logic (progress, XP, streak, achievements)
├── hooks/            React hooks bridging services to UI
├── pages/            LandingPage, GoalPage, AnalysisPage, RoadmapPage, DailyMissionPage
├── types/            TypeScript domain types
└── prompts/          Gemini prompt architecture (see docs/architecture/PROMPT_ENGINEERING.md)
```

## Docs

- [Prompt Engineering Standard](docs/architecture/PROMPT_ENGINEERING.md)
