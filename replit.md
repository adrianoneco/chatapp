# ChatApp - Messaging Platform

## Overview

ChatApp is a modern messaging platform built with a full-stack TypeScript architecture. The application provides real-time communication capabilities with role-based access control (RBAC), supporting three user types: clients, attendants, and administrators. The platform uses Material Design 3 principles combined with WhatsApp-inspired UX patterns for a familiar and intuitive user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type-safe UI development
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)

**UI Component System:**
- Shadcn/ui components based on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Design system follows Material Design 3 principles
- Component library configured in "new-york" style variant

**State Management:**
- TanStack Query (React Query) for server state management
- React Context API for authentication state
- Custom hooks pattern for reusable logic (use-auth, use-mobile, use-toast)

**Form Handling:**
- React Hook Form for form state management
- Zod for runtime schema validation
- @hookform/resolvers for integrating Zod with React Hook Form

**Key Design Decisions:**
- **Problem:** Need for consistent, accessible UI components
- **Solution:** Shadcn/ui component library with Radix UI primitives
- **Rationale:** Provides unstyled, accessible components that can be customized while maintaining consistency

- **Problem:** Efficient server state synchronization
- **Solution:** TanStack Query with custom query functions
- **Rationale:** Automatic caching, background refetching, and optimistic updates reduce boilerplate

### Backend Architecture

**Server Framework:**
- Express.js for HTTP server and API routing
- Node.js runtime with ESM module system
- TypeScript for type safety across the stack

**Authentication & Session Management:**
- Passport.js with Local Strategy for username/password authentication
- Express-session for session management
- connect-pg-simple for PostgreSQL-backed session store
- Scrypt for password hashing (crypto module)

**Database Layer:**
- Drizzle ORM for type-safe database queries
- PostgreSQL as the primary database
- Drizzle-kit for schema migrations
- Zod schemas derived from Drizzle tables for validation consistency

**Key Design Decisions:**
- **Problem:** Secure password storage
- **Solution:** Scrypt hashing algorithm with salt
- **Rationale:** Memory-hard algorithm resistant to brute-force attacks

- **Problem:** Type safety between database and application
- **Solution:** Drizzle ORM with TypeScript integration
- **Rationale:** Compile-time type checking prevents runtime database errors

- **Problem:** Session persistence across server restarts
- **Solution:** PostgreSQL-backed session store
- **Rationale:** Sessions survive server crashes and enable horizontal scaling

### API Architecture

**RESTful Endpoints:**

*Authentication & Users:*
- `/api/register` - User registration with role assignment
- `/api/login` - User authentication
- `/api/logout` - Session termination
- `/api/user` - Current user information
- `/api/users` - User listing (admin-only)
- `/api/users/:id` - Individual user access (auth-required)

*Conversations (Nov 2025):*
- `GET /api/channels` - List active communication channels
- `GET /api/channels/:id` - Get specific channel
- `GET /api/conversations` - List conversations (filters: channelId, status, assignedTo)
- `GET /api/conversations/:id` - Get specific conversation
- `POST /api/conversations` - Create or find conversation (idempotent via xmax)
  - Returns 201 Created + Location header when new
  - Returns 200 OK when existing conversation found
  - Uses PostgreSQL xmax system column to detect INSERT vs UPDATE atomically
- `PATCH /api/conversations/:id` - Update conversation (status, assignment)
- `GET /api/conversations/:id/messages` - List messages (with pagination)
- `POST /api/conversations/:id/messages` - Create message (idempotent via externalId)

*AI Integration (Nov 2025):*
- `POST /api/ai/correct-text` - Text correction using Groq AI (grammar, spelling, punctuation)
  - Body: `{ text: string, language?: string }`
  - Returns: `{ success: boolean, correctedText: string, originalText: string }`
- `POST /api/ai/assistant` - Generate AI assistant response with context
  - Body: `{ userMessage: string, context?: { conversationId, clientName, attendantName, conversationHistory }, systemPrompt?: string }`
  - Returns: `{ success: boolean, response: string }`
- `POST /api/ai/search-templates` - Search knowledge base templates using AI
  - Body: `{ query: string, templates: string[] }`
  - Returns: `{ success: boolean, result: string }`

**Middleware Stack:**
- JSON body parsing with raw body preservation
- Request logging with performance tracking
- Authentication middleware (requireAuth) - server/middleware/auth.ts
- Role-based authorization (requireRole)
- Zod-based request validation

**Error Handling:**
- Dedicated error pages for 400, 401, 403, 404, 500 status codes
- Consistent error response format
- Protected routes with authentication checks

### Security Architecture

**Authentication Flow:**
1. User submits credentials via login form
2. Passport Local Strategy validates against database
3. Password compared using timing-safe comparison
4. Session created and stored in PostgreSQL
5. Session ID returned to client as HTTP-only cookie

**Authorization Layers:**
- Route-level protection via ProtectedRoute component
- Middleware-level checks (requireAuth, requireRole)
- Data sanitization (password stripping from user objects)

**Session Security:**
- HTTP-only cookies prevent XSS attacks
- Secure flag enabled in production
- SameSite=lax prevents CSRF
- 24-hour session expiration
- Trust proxy configuration for HTTPS

### Data Schema

**Users Table (Unified):**
- `id`: UUID primary key (auto-generated)
- `name`: Full name (required)
- `email`: Unique email address (nullable for clients, required for attendants/admins)
- `username`: Unique username (nullable for clients, required for attendants/admins)
- `password`: Scrypt-hashed password (nullable for clients, required for attendants/admins)
- `role`: Enum (client, admin, attendant) - defaults to client
- `phone`: Phone number (nullable, added for clients)
- `notes`: Internal notes (nullable, added for clients)
- `createdBy`: Foreign key to users table (nullable, tracks who created client records)
- `createdAt`: Timestamp (auto-generated)

**Key Architecture Decision (Nov 2025):**
- **Problem:** Separate `contacts` table duplicated user management logic
- **Solution:** Consolidated into `users` table using role-based differentiation (role=client for contacts)
- **Implementation:** Email/username/password nullable for clients to preserve "contact without credentials" semantics; empty strings ("") normalized to NULL on both create and update paths to prevent unique constraint violations
- **Rationale:** Single source of truth for all user entities, consistent CRUD patterns, prevents data duplication

**Validation Schemas:**
- insertClientSchema: Client/contact creation (credentials optional, normalized "" → null)
- updateClientSchema: Client/contact updates (partial fields, normalized "" → null)
- insertAttendantSchema: Attendant creation (credentials required via Zod validation)
- insertUserSchema: General user creation validation
- loginSchema: Login credentials validation
- registerSchema: Registration with password confirmation
- Shared between client and server via @shared directory

## Recent Changes (Nov 13, 2025)

### WebRTC Audio/Video Calls (Flagship Feature)
- **useWebRTC hook** (`client/src/hooks/use-webrtc.ts`):
  - Multiple critical fixes: call state handling, permission checks, signal buffering, cleanup on error
  - Features: incomingCall state, checkMediaPermissions, currentCall for callee, pending signals buffer with callId scoping
  - Ringtones commented out (audio files not added yet)
- **CallDialog** component: Full-screen video/audio UI with mute/unmute, camera toggle, hang-up
- **IncomingCallToast** component: Toast notification for incoming calls with accept/reject
- **ConversationDetail integration**: Audio/Video call buttons in header

### Conversation Management Features
- **3-dot menu** in ConversationDetail:
  - Close/Reopen conversation (status toggle)
  - Export JSON (client-side download)
  - Transcribe to TXT (endpoint: `POST /api/conversations/:id/transcribe` - timezone-aware export)
  - Transfer attendant (endpoint: `PATCH /api/conversations/:id/transfer` + Dialog UI with attendant selection)

### AI Integration
- **Text correction button** in message box: Groq AI grammar/spelling correction (`/api/ai/correct-text`)
- Placeholder buttons: AI assistant, record audio/video, send photo/attachment

### Schema Fixes
- **messages table**: Removed circular references from `replyToId` and `forwardedFromId` (nullable varchar without foreign key constraints)
- **Message sending**: Fixed senderId validation - now uses authenticated `user.id` instead of null

### Presence System
- **UserAvatar** component already integrated in ConversationList with online indicators
- WebSocket presence tracking via `useWebSocket` hook (onlineUsers state)
- Note: Presence is real-time but not persisted to database (no `isOnline`/`lastSeenAt` columns)

### Technical Debt
- Ringtone audio files not added (commented out in useWebRTC)
- Reply/Forward/Reactions not implemented
- Private messages (isPrivate) field exists but no visual differentiation
- Meetings feature not implemented
- AI assistant modal not implemented

## External Dependencies

### Core Framework Dependencies
- **express** (^4.21.2): Web server framework
- **react** (^18): UI library
- **vite** (latest): Build tool and dev server

### Database & ORM
- **drizzle-orm** (^0.39.3): Type-safe ORM
- **pg** (via drizzle): PostgreSQL client
- **drizzle-kit**: Schema migration tool
- **drizzle-zod** (^0.7.0): Zod schema generation from Drizzle

### Authentication
- **passport** (latest): Authentication middleware
- **passport-local**: Username/password strategy
- **express-session**: Session management
- **connect-pg-simple** (^10.0.0): PostgreSQL session store

### UI Component Libraries
- **@radix-ui/react-*** (v1.x): Headless UI primitives (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, label, popover, select, separator, slider, switch, tabs, toast, tooltip)
- **shadcn/ui**: Pre-built accessible components

### Styling
- **tailwindcss** (latest): Utility-first CSS framework
- **autoprefixer**: CSS vendor prefixing
- **class-variance-authority** (^0.7.1): Component variant handling
- **tailwind-merge**: Tailwind class merging
- **clsx** (^2.1.1): Conditional class names

### Form & Validation
- **react-hook-form** (latest): Form state management
- **@hookform/resolvers** (^3.10.0): Validation resolvers
- **zod** (latest): Schema validation

### State Management
- **@tanstack/react-query** (^5.60.5): Server state management

### Routing
- **wouter** (latest): Lightweight client-side router

### Development Tools
- **typescript** (latest): Type checking
- **tsx**: TypeScript execution
- **esbuild**: Production bundling
- **@replit/vite-plugin-***: Replit-specific development plugins

### Utilities
- **date-fns** (^3.6.0): Date manipulation
- **nanoid**: ID generation
- **lucide-react**: Icon library
- **embla-carousel-react** (^8.6.0): Carousel component

### AI Integration
- **Groq API** (direct fetch): AI-powered text correction and assistant responses
  - Used via direct fetch API to avoid Vite peer dependency conflicts
  - Model: llama-3.3-70b-versatile
  - Service location: server/services/groq.ts
  - Features: Text correction, context-aware responses, template search

### Environment Requirements
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SESSION_SECRET**: Session encryption key (required)
- **GROQ_API_KEY**: Groq AI API key for text correction and assistant features (required)
- **NODE_ENV**: Environment flag (development/production)