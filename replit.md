# ChatApp - Messaging Platform

## Overview
ChatApp is a modern, full-stack TypeScript messaging platform designed for real-time communication with robust role-based access control (RBAC). It offers an intuitive user experience inspired by Material Design 3 and WhatsApp, featuring WebRTC audio/video calls, advanced conversation management (status, export, transcription, transfer), and AI integrations for text correction and intelligent assistance. The project aims to deliver a scalable, secure, and feature-rich communication solution for clients, attendants, and administrators.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Design System:** Material Design 3 principles.
- **Components:** Shadcn/ui (Radix UI based) with Tailwind CSS for consistent, accessible UI.
- **Composer:** WhatsApp-style message composer with integrated AI features and media attachment options.

### Technical Implementations
- **Frontend:** React 18, TypeScript, Vite, TanStack Query for server state, Wouter for routing, React Hook Form with Zod for validation.
- **Backend:** Node.js with Express.js, TypeScript.
- **Database:** PostgreSQL with Drizzle ORM for type-safe queries and migrations.
- **Authentication:** Passport.js (Local Strategy), Express-session, Scrypt for password hashing, with session storage in PostgreSQL.
- **API:** RESTful endpoints for core functionalities, including idempotent POST requests.
- **Real-time:** WebSockets for presence system and WebRTC signaling.
- **Security:** Scrypt for password hashing, HTTP-only/secure/SameSite=lax cookies, role-based authorization via middleware, and a GLOBAL_API_KEY system for secure API/WebSocket access.
- **Uploads:** File system storage for media uploads with MIME type validation and size limits, designed for future S3 migration.

### Feature Specifications
- **WebRTC Calls:** Audio/video calls with call state management, permission handling, and UI for incoming/active calls.
- **Conversation Management:** Functionality to close/reopen, export (JSON, TXT transcription), and transfer conversations.
- **AI Integration:** In-message text correction (Groq AI), AI assistant responses using templates, and AI-driven template management with CRUD operations.
- **Media Handling:** Audio and video recording with real-time feedback, and generic file/image uploads with previews.
- **Settings:** Admin-only pages for managing AI templates, webhooks, and Evolution API instances.
- **Presence System:** Real-time online indicators for users.
- **Evolution API Integration:** Processing incoming WhatsApp messages and sending outbound messages, managing conversations based on `externalContactId`.
- **Email Service:** Placeholder for sending conversation transcriptions and meeting notifications.

### System Design Choices
- Unified `users` table with role-based differentiation (`client`, `admin`, `attendant`).
- Shared validation schemas (Zod) between client and server for data consistency.
- Triple-guard pattern in media recorders to prevent race conditions and memory leaks.
- Abstracted upload architecture for easy migration to cloud storage.

## External Dependencies

- **Express.js:** Web server framework.
- **React:** Frontend UI library.
- **Vite:** Frontend build tool.
- **TypeScript:** Primary programming language.
- **PostgreSQL:** Relational database.
- **Drizzle ORM, Drizzle-kit, Drizzle-Zod:** Database ORM and related tooling.
- **Passport.js, Express-session, Connect-pg-simple:** Authentication and session management.
- **@radix-ui/react-\*, Shadcn/ui, Tailwind CSS:** UI component libraries and styling framework.
- **React Hook Form, Zod:** Form management and validation.
- **@tanstack/react-query:** Server state management.
- **Wouter:** Client-side router.
- **Groq API:** AI services for text correction and assistance.
- **Date-fns:** Date manipulation utility.
- **Nanoid:** Unique ID generation.
- **Lucide-react:** Icon library.
- **Evolution API:** Third-party WhatsApp integration.