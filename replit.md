# Digest - RSS Feed Reader

## Overview

Digest is a modern RSS feed reader application that allows users to subscribe to feeds, browse articles, and save content for later reading. The application features AI-powered capabilities including article translation and summarization using OpenAI integration. Built with a React frontend and Express backend, it uses PostgreSQL for data persistence and follows a clean, minimal design aesthetic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Animations**: Framer Motion for page transitions and UI animations
- **Build Tool**: Vite with hot module replacement

The frontend follows a page-based architecture with reusable components. Key pages include Explore (article feed), ManageFeeds (subscription management), Saved (bookmarked articles), and ArticleReader (full article view).

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Design**: REST API with typed route definitions in `shared/routes.ts`
- **Database ORM**: Drizzle ORM with PostgreSQL
- **RSS Parsing**: rss-parser library for fetching and parsing feeds

The server uses a shared schema approach where database models and API route definitions are shared between frontend and backend via the `shared/` directory.

### Data Storage
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema**: Two main tables - `feeds` (RSS subscriptions) and `articles` (individual posts)
- **ORM**: Drizzle ORM with Zod validation schemas auto-generated from table definitions
- **Migrations**: Drizzle Kit for schema migrations (`drizzle-kit push`)

### AI Integration
- **Provider**: OpenAI (via Replit AI Integrations)
- **Features**: Article translation, AI-generated summaries/scripts
- **Batch Processing**: Utility functions in `server/replit_integrations/batch/` for rate-limited batch operations
- **Chat Interface**: Optional chat routes in `server/replit_integrations/chat/`
- **Image Generation**: Optional image generation in `server/replit_integrations/image/`

### Build System
- **Development**: `tsx` for TypeScript execution, Vite dev server with HMR
- **Production**: esbuild bundles server code, Vite builds client to static files
- **Output**: Combined distribution in `dist/` (server as `index.cjs`, client in `dist/public/`)

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage for Express (if authentication is added)

### AI Services
- **OpenAI API**: Used for article translation and summarization
  - Configured via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`
  - Supports GPT models and image generation (gpt-image-1)

### External Libraries
- **rss-parser**: Fetches and parses RSS/Atom feeds
- **xml2js**: Parses OPML files for bulk feed import
- **date-fns**: Date formatting and manipulation
- **Zod**: Runtime type validation for API inputs/outputs

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development environment banner