# StreamRatings

## Overview

StreamRatings is a Chrome Extension that overlays IMDb ratings on streaming service title cards (Netflix, Prime Video, Hotstar). The project consists of two main parts:

1. **Chrome Extension (Manifest V3)** - Content scripts that inject rating badges onto streaming site title cards
2. **Backend API Server** - Express.js server that proxies OMDb API requests to keep the API key secure

The extension displays a small badge with IMDb ratings on each movie/TV show card. Clicking the badge opens the IMDb page. The backend handles all OMDb API communication so the API key is never exposed to the client.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Chrome Extension)
- **Location**: `extension/` folder
- **Manifest V3** with content scripts, background service worker, and options page
- **Adapters pattern**: Site-specific adapters (`netflix.js`, `prime.js`, `hotstar.js`) handle extracting titles from different streaming sites
- **UI**: Badge component with tooltip showing rating details
- **Storage**: Chrome local storage for config (backend URL, secret) and rating cache (7-day TTL)
- **Communication**: Service worker makes API calls to avoid CORS issues in content scripts

### Backend (Express Server)
- **Location**: `server/` folder  
- **Framework**: Express.js with TypeScript
- **Main endpoint**: `GET /api/omdb?title=<title>&year=<year>` - proxies requests to OMDb API
- **Security**: Requires `x-streamratings-secret` header matching `STREAMRATINGS_SECRET` env var
- **CORS**: Allows `chrome-extension://` origins, localhost, and replit.app domains
- **Rate limiting**: Custom in-memory limiter (120 requests/minute per IP)
- **Caching**: In-memory cache with 24-hour TTL for OMDb responses
- **Fuzzy matching**: Levenshtein distance algorithm to find best title match from OMDb results

### Client Dashboard (React)
- **Location**: `client/` folder
- **Framework**: React with Vite, TypeScript, TailwindCSS
- **UI Library**: shadcn/ui components with Radix primitives
- **Purpose**: Landing page with setup instructions and demo widget to test API

### Shared Code
- **Location**: `shared/` folder
- **Schema**: Zod schemas for API request/response validation
- **Routes**: API route definitions with type-safe contracts

### Database
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Current usage**: Schema defined but primarily using in-memory caching
- **Future**: Can persist query cache to database if needed

## External Dependencies

### APIs
- **OMDb API** (omdbapi.com) - Movie/TV rating data source
  - Requires free API key stored in `OMDB_API_KEY` secret
  - Rate limited, hence local caching

### Environment Variables (Replit Secrets)
- `OMDB_API_KEY` - Your OMDb API key
- `STREAMRATINGS_SECRET` - Shared secret for extension authentication
- `DATABASE_URL` - PostgreSQL connection string (auto-provisioned by Replit)

### Key NPM Packages
- **Backend**: express, drizzle-orm, zod, pg
- **Frontend**: react, @tanstack/react-query, framer-motion, tailwindcss
- **UI**: @radix-ui components, shadcn/ui, lucide-react icons

### Build Tools
- **Vite** - Frontend bundling and dev server
- **esbuild** - Server bundling for production
- **tsx** - TypeScript execution for development