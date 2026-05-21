# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NovelAI is an AI-assisted long-form novel writing platform. It provides comprehensive world-building management, character profiles, chapter editing, and consistency checking features for novel authors.

**Architecture**: Full-stack web application with React frontend and NestJS backend, using SQLite database (Prisma ORM).

## Tech Stack

**Frontend** (client/):
- React 18 + TypeScript + Vite
- Tailwind CSS for styling
- TipTap rich text editor for chapter editing
- React Query for server state management
- Zustand for local state management
- React Router for navigation

**Backend** (server/):
- NestJS framework + TypeScript
- Prisma ORM with SQLite database
- JWT authentication (Passport)
- Multiple AI provider integrations (OpenAI, Claude, DeepSeek, Mimo)

## Development Commands

### Backend (server/)

```bash
# Install dependencies
npm install

# Generate Prisma client after schema changes
npm run prisma:generate

# Run database migrations (development)
npm run prisma:migrate

# Deploy migrations (production)
npm run prisma:migrate:deploy

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Start development server (watch mode)
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm run test
npm run test:watch
npm run test:cov
```

### Frontend (client/)

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Deployment

```bash
# Start all services (database, backend, frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild and start
docker-compose up --build
```

## Database

**Provider**: SQLite (configured in server/prisma/schema.prisma)
**Location**: Development database is typically at server/prisma/dev.db

After modifying schema.prisma:
1. Run `npm run prisma:generate` to update Prisma Client
2. Run `npm run prisma:migrate` to create and apply migration

## Core Module Structure

The backend follows NestJS modular architecture (server/src/modules/):

- **auth**: User authentication (JWT, Passport strategies)
- **projects**: Novel project CRUD operations
- **characters**: Character management with relationships
- **world-settings**: World-building settings (geography, history, politics, magic systems, culture)
- **chapters**: Chapter management and content storage
- **scenes**: Scene management
- **plots**: Plot structure and plot points
- **outlines**: Story outline management with hierarchical structure
- **turning-points**: Key story turning points tracking
- **timeline**: Timeline event management
- **ai**: AI provider abstraction layer with multiple providers
- **ai-config**: User AI model configuration per action type
- **api-keys**: Encrypted API key storage for AI providers
- **consistency-check**: AI-powered consistency checking
- **usage-logs**: AI API usage tracking and cost monitoring
- **writing-styles**: Custom writing style management and fusion

## AI Integration Architecture

The platform uses a provider abstraction pattern (server/src/modules/ai/providers/):

- **base.provider.ts**: Abstract base class defining provider interface
- **openai.provider.ts**: OpenAI integration
- **claude.provider.ts**: Anthropic Claude integration
- **deepseek.provider.ts**: DeepSeek integration
- **mimo.provider.ts**: Xiaomi Mimo integration

Users configure their own API keys (stored encrypted). The AIConfig system allows per-action model selection (e.g., use Claude for consistency checks, OpenAI for dialogue generation).

**Context Building**: The ContextBuilderService (server/src/modules/ai/context-builder.service.ts) aggregates project context (characters, world settings, chapter summaries) for AI calls, managing token budgets across long-form content.

## Frontend Routing Structure

Main routes (client/src/App.tsx):
- `/login`, `/register`: Authentication
- `/projects`: Project list
- `/ai-settings`: Global AI configuration
- `/projects/:projectId`: Project workspace with nested routes:
  - `/`: Project overview
  - `/settings`: Project settings
  - `/characters`: Character management
  - `/character-network`: Character relationship visualization
  - `/world`: World settings
  - `/chapters`: Chapter list
  - `/chapters/:chapterId`: Chapter editor
  - `/plots`: Plot management
  - `/scenes`: Scene management
  - `/outlines`: Outline management
  - `/turning-points`: Turning point tracking
  - `/timeline`: Timeline management
  - `/consistency-check`: AI consistency checking
  - `/usage-logs`: AI usage statistics

## Environment Configuration

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL`: SQLite database path (for Prisma)
- `JWT_SECRET`: Secret for JWT token signing (change in production)
- `VITE_API_BASE_URL`: API endpoint for frontend (default: http://localhost:4000/api)

API keys are NOT stored in environment variables - users add them through the UI, stored encrypted in the database.

## Key Data Models

**Project**: Top-level container for a novel
- Contains: characters, world settings, chapters, scenes, plots, outlines, timeline events
- Tracks: word count, status (IDEATION/IN_PROGRESS/COMPLETED), genre, tags

**Character**: Character profiles with personality, appearance, goals, flaws, relationships
- Supports character relationship graph
- Tracks appearances across chapters

**WorldSetting**: Categorized world-building (Geography, History, Politics, Magic/Tech, Culture)
- Hierarchical: WorldSetting → WorldSettingItem

**Chapter**: Individual chapters with content, summaries, and AI analysis
- Supports multi-part content (ChapterContent)
- Auto-generated summaries for context building

**LoreEntry**: Lorebook system with keyword-triggered context injection
- Categories: CHARACTER, LOCATION, ITEM, MAGIC, RACE, ORGANIZATION
- Priority-based matching for AI context

**ChekhovsGun**: Foreshadowing tracking system
- Tracks setup and payoff across chapters
- Status: SETUP, REMINDER, PAYOFF, ABANDONED

**Outline**: Hierarchical story outline with nested OutlineItem structure

**TurningPoint**: Key plot turning points (PLOT_TURN, CHARACTER_REVEAL, REVERSAL, CRISIS, CLIMAX, RESOLUTION)

**TimelineEvent**: Story timeline with flexible date/time labels

## Testing

Backend tests use Jest. Run from server/:
- `npm run test`: Run all tests
- `npm run test:watch`: Watch mode
- `npm run test:cov`: Coverage report

No frontend tests are currently configured.

## Important Notes

- The database uses SQLite (not PostgreSQL as originally designed) - check schema.prisma datasource
- API keys are encrypted before storage using the ApiKeysService
- All AI calls are logged to UsageLog for cost tracking
- The platform supports multiple AI providers simultaneously - users can configure different models for different actions
- Chapter content can be split across multiple ChapterContent records for large chapters
- The ContextBuilderService automatically manages token budgets when building AI context from long novels
