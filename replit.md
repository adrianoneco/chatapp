# ChatApp - Real-time Chat Application

## Overview

ChatApp is a full-stack web application built for real-time messaging and chat management. The application uses a modern React frontend with a Node.js/Express backend, designed to provide seamless communication between users, contacts, and support attendants. The platform features conversation management, user authentication, contact organization, and team collaboration tools.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tool**: The frontend is built with React 18+ using Vite as the build tool and development server. TypeScript is used throughout for type safety.

**UI Component Library**: The application uses shadcn/ui components built on top of Radix UI primitives, providing accessible and customizable UI components. Tailwind CSS handles styling with a custom design system including color tokens and CSS variables for theming.

**Routing**: Client-side routing is implemented using Wouter, a lightweight routing library. The application supports multiple routes including authentication pages, dashboard, conversations, contacts, attendants, settings, and notifications.

**State Management**: React Query (TanStack Query) manages server state, data fetching, and caching. The application uses a custom query client configured with specific behaviors for handling API requests and 401 unauthorized responses.

**Form Handling**: Forms use React Hook Form with Zod for schema validation, integrated through the @hookform/resolvers package.

**Design System**: The UI follows a consistent design pattern with:
- Custom fonts (Inter and Outfit from Google Fonts)
- A shadcn/ui "new-york" style variant
- Neutral color base with CSS variables for theming
- Custom animations and transitions using Tailwind utilities

### Backend Architecture

**Server Framework**: Express.js serves as the web server framework, handling both API routes and static file serving in production.

**Development vs Production**: The application uses separate entry points:
- `server/index-dev.ts`: Development mode with Vite integration for HMR
- `server/index-prod.ts`: Production mode serving pre-built static assets

**Request/Response Flow**: Express middleware handles JSON parsing, URL encoding, and request logging. The application tracks response times and logs API requests with their payloads.

**Storage Layer**: The application implements an abstraction layer (`IStorage` interface) with an in-memory implementation (`MemStorage`). This design allows for easy swapping to a database-backed storage solution. Currently supports basic user CRUD operations.

**API Structure**: Routes are registered through a centralized `registerRoutes` function, with all API endpoints prefixed with `/api`.

### Data Storage Solutions

**Database ORM**: Drizzle ORM is configured for PostgreSQL, with schema definitions in TypeScript using Drizzle's schema builder.

**Database Provider**: The application is set up to use Neon Database (@neondatabase/serverless) as the PostgreSQL provider.

**Schema Management**: Database schema is defined in `shared/schema.ts` with Drizzle table definitions. Migrations are stored in the `/migrations` directory. The schema includes:
- Users table with UUID primary keys, username, and password fields
- Zod schemas for validation using drizzle-zod integration

**Current Storage**: The application currently uses in-memory storage (`MemStorage`) for development, designed to be replaced with database-backed storage in production.

### Authentication & Authorization

**Planned Implementation**: The codebase includes authentication UI (login, register, password recovery) but the backend authentication logic is not yet implemented. The storage layer includes methods for user creation and retrieval by username, indicating a planned username/password authentication system.

**Session Management**: Dependencies include `connect-pg-simple` for PostgreSQL-backed session storage, though session middleware is not yet configured.

### External Dependencies

**UI Component Libraries**:
- Radix UI: Provides unstyled, accessible component primitives
- shadcn/ui: Pre-built components following a consistent design system
- Lucide React: Icon library
- cmdk: Command palette component

**State & Data Management**:
- @tanstack/react-query: Server state management and data fetching
- React Hook Form: Form state management
- Zod: Schema validation

**Development Tools**:
- Vite: Build tool and dev server with HMR
- TypeScript: Type checking and compilation
- Tailwind CSS: Utility-first CSS framework
- PostCSS: CSS processing
- Replit plugins: Development tools specific to Replit environment (cartographer, dev banner, runtime error modal, meta images plugin)

**Database & ORM**:
- Drizzle ORM: Type-safe database toolkit
- Drizzle Kit: Database migration tool
- @neondatabase/serverless: Neon Database PostgreSQL driver
- Postgres: Database dialect (configured but not yet actively used)

**Utilities**:
- nanoid: ID generation
- date-fns: Date manipulation
- class-variance-authority: Utility for creating component variants
- clsx & tailwind-merge: CSS class management
- vaul: Drawer component primitive
- jsmediatags: Media file metadata reading

**Asset Management**: The application includes media file handling capabilities with references to MP3 and MP4 files in the conversations page, suggesting support for rich media messaging.