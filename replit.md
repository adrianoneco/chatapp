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
- `/api/register` - User registration with role assignment
- `/api/login` - User authentication
- `/api/logout` - Session termination
- `/api/user` - Current user information
- `/api/users` - User listing (admin-only)
- `/api/users/:id` - Individual user access (auth-required)

**Middleware Stack:**
- JSON body parsing with raw body preservation
- Request logging with performance tracking
- Authentication middleware (requireAuth)
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

**Users Table:**
- `id`: UUID primary key (auto-generated)
- `name`: Full name (required)
- `email`: Unique email address (required)
- `username`: Unique username (required)
- `password`: Scrypt-hashed password (required)
- `role`: Enum (client, admin, attendant) - defaults to client
- `createdAt`: Timestamp (auto-generated)

**Validation Schemas:**
- insertUserSchema: User creation validation
- loginSchema: Login credentials validation
- registerSchema: Registration with password confirmation
- Shared between client and server via @shared directory

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

### Environment Requirements
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SESSION_SECRET**: Session encryption key (required)
- **NODE_ENV**: Environment flag (development/production)