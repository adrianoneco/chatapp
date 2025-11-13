# ChatApp - Messaging Platform

## Overview
ChatApp is a modern, full-stack TypeScript messaging platform offering real-time communication with role-based access control (RBAC) for clients, attendants, and administrators. It combines Material Design 3 principles with WhatsApp-inspired UX for an intuitive user experience. Key features include WebRTC audio/video calls, advanced conversation management (status, export, transcription, transfer), and AI integrations for text correction and assistant responses. The project aims to provide a robust, scalable, and secure communication solution.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework:** React 18 with TypeScript, Vite for bundling.
- **UI:** Shadcn/ui (Radix UI based) with Tailwind CSS, following Material Design 3 principles.
- **State Management:** TanStack Query for server state, React Context for authentication, custom hooks for logic.
- **Form Handling:** React Hook Form with Zod for validation.
- **Routing:** Wouter for client-side navigation.
- **Key Decisions:** Emphasis on consistent, accessible UI via Shadcn/ui and efficient server state synchronization with TanStack Query.

### Backend
- **Framework:** Node.js with Express.js, TypeScript.
- **Authentication:** Passport.js (Local Strategy), Express-session with PostgreSQL-backed storage, Scrypt for password hashing.
- **Database:** PostgreSQL with Drizzle ORM for type-safe queries and migrations.
- **API:** RESTful endpoints for authentication, user management, conversations, and AI services.
- **Middleware:** JSON parsing, request logging, authentication, role-based authorization, Zod-based validation.
- **Error Handling:** Consistent error responses and dedicated error pages.
- **Key Decisions:** Secure password storage with Scrypt, type safety across database and application via Drizzle ORM, and session persistence through PostgreSQL.

### API Architecture
- **Authentication & Users:** Endpoints for registration, login, logout, and user information (including admin-only listings).
- **Conversations:** CRUD operations for channels and conversations, including message listing and creation, and advanced features like status updates and attendant transfers. Idempotent POST requests for conversation and message creation.
- **AI Integration:** Endpoints for text correction (Groq AI), AI assistant responses with context, and AI-powered template searching.
- **Settings:** CRUD for AI templates, webhooks, and Evolution API instances (admin-only).

### Security Architecture
- **Authentication:** Passport.js with local strategy, scrypt hashing, and session management via HTTP-only, secure, and SameSite=lax cookies.
- **Authorization:** Route-level and middleware-level checks (`requireAuth`, `requireRole`).
- **Data Schema:** Unified `users` table with role-based differentiation (`client`, `admin`, `attendant`), eliminating a separate `contacts` table. Validation schemas (`insertClientSchema`, `insertAttendantSchema`, etc.) shared between client and server.

### Core Features
- **WebRTC Calls:** Audio/video calls with call state handling, permission checks, and UI components for incoming calls and active call management.
- **Conversation Management:** Functionality to close/reopen conversations, export data (JSON, TXT transcription), and transfer conversations between attendants.
- **AI Integration:** In-message text correction (Groq AI), AI assistant, and AI-driven template management with CRUD for templates and search capabilities.
- **Message Composer:** WhatsApp-style composer with integrated buttons for AI text correction, AI assistant, and placeholders for media attachments and audio/video recording.
- **Settings Page:** Comprehensive settings with tabs for AI Assistant (template CRUD), Webhooks (create/delete), and Evolution API instances (create/delete), with admin-only access for webhooks and Evolution API.
- **Presence System:** Real-time online indicators for users via WebSockets.

## External Dependencies

### Core Technologies
- **Express.js:** Web server.
- **React:** UI library.
- **Vite:** Build tool.
- **TypeScript:** Language.
- **PostgreSQL:** Primary database.

### ORM & Database Tools
- **Drizzle ORM:** Type-safe ORM.
- **Drizzle-kit:** Schema migrations.
- **Drizzle-Zod:** Zod schema generation from Drizzle.

### Authentication & Session
- **Passport.js:** Authentication middleware.
- **Express-session:** Session management.
- **Connect-pg-simple:** PostgreSQL session store.

### UI & Styling
- **@radix-ui/react-\***: Headless UI primitives.
- **Shadcn/ui:** Pre-built accessible components.
- **Tailwind CSS:** Utility-first CSS framework.

### Form & Validation
- **React Hook Form:** Form state management.
- **Zod:** Schema validation.

### State Management & Routing
- **@tanstack/react-query:** Server state management.
- **Wouter:** Lightweight client-side router.

### AI Services
- **Groq API:** Used for text correction and AI assistant features (direct fetch integration).

### Utilities
- **Date-fns:** Date manipulation.
- **Nanoid:** ID generation.
- **Lucide-react:** Icon library.

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `SESSION_SECRET`: Session encryption key.
- `GROQ_API_KEY`: Groq AI API key.
### GLOBAL_API_KEY Protection System (Nov 13, 2025)

**Proteção implementada para WebSocket e rotas de API:**

**Middleware (server/middleware/auth.ts):**
- `requireAuth`: Aceita sessão autenticada OU GLOBAL_API_KEY via Authorization Bearer
- `requireRole`: Capability-based access control para API key
- `req.apiKeyContext`: Contexto explícito para requisições via API key
  - `isApiKey: true`
  - `capabilities: ["admin", "attendant", "client"]`
- Security logging: Logs de uso de API key e tentativas não autorizadas
- Query param removido (apenas Authorization Bearer por segurança)

**WebSocket (server/websocket.ts):**
- `verifyClient`: Validação no HTTP upgrade request (antes do handshake)
- Aceita Authorization Bearer com GLOBAL_API_KEY válida
- IDs únicos por conexão: `api-key-${timestamp}-${random}`
- Previne que conexões API key se autentiquem como usuários reais
- Security logging: Logs de conexões autorizadas/rejeitadas
- Suporte a múltiplas conexões API key simultâneas

**Uso:**
```bash
# HTTP API
curl -H "Authorization: Bearer $GLOBAL_API_KEY" https://chatapp.local/api/conversations

# WebSocket
wscat -H "Authorization: Bearer $GLOBAL_API_KEY" -c wss://chatapp.local/ws
```

**Limitações conhecidas:**
- Alguns handlers ainda assumem `req.user` existe e podem falhar com API key
- Rotas testadas e funcionais: `/api/webhooks`, `/api/evolution-instances`, `/api/templates`
- Para uso completo de API key, handlers precisariam verificar `req.apiKeyContext` antes de acessar `req.user`
- Capabilities atualmente são amplas (admin+attendant+client) - pode ser refinado no futuro
- Rate limiting não implementado (próximo passo de segurança)

## Recent Features (Nov 13, 2025)

### AI Template System Enhancement - Terceira Sessão

**Variáveis de Template** (shared/template-variables.ts):
- Sistema completo de variáveis categorizadas (conversa, atendente, cliente)
- Cada variável tem: key (ex: {{clientName}}), label PT-BR, descrição
- getVariablesByCategory() retorna variáveis filtradas por categoria
- getAllVariableKeys() retorna todas as chaves para fallback

**Backend - Sugestão Inteligente de Templates** (server/routes/ai.ts):
- Endpoint: POST /api/ai/suggest-template
- Recebe: { title, category, description? }
- Detecção automática de variáveis mencionadas em title + description
- Se nenhuma variável detectada, usa todas (fallback inteligente)
- Retorna: { suggestedContent, promptUsed, variablesUsed }
- Integração com Groq API para geração profissional

**Frontend - UI Completa** (client/src/components/settings/ai-assistant-tab.tsx):
- Layout 2 colunas: formulário + sidebar de variáveis (lg:grid-cols-[1fr_18rem])
- Sidebar direita com ScrollArea mostrando todas as variáveis
- Variáveis agrupadas por categoria com descrições
- Click-to-insert: clicar em variável insere no cursor do textarea
- Botão "Sugestão IA" ao lado de "Criar/Atualizar"
- Card mostrando prompt enviado à IA com botão copiar
- Estados visuais: loading (Gerando...), copied (ícone Check)
- Preserva posição do cursor ao inserir variáveis via ref

**Fluxo de Uso:**
1. Usuário preenche título e categoria do template
2. Opcionalmente digita variáveis no conteúdo (ex: {{clientName}})
3. Clica em "Sugestão IA"
4. Backend detecta variáveis mencionadas ou usa todas
5. Groq gera template profissional com variáveis apropriadas
6. Frontend insere conteúdo gerado e mostra prompt usado
7. Usuário pode copiar prompt, adicionar mais variáveis, e salvar

**Correções de UX:**
- Toast agora tem pointer-events-none no viewport (não bloqueia cliques)
- Toast individual mantém pointer-events-auto (permanece interativo)

**Testes E2E Realizados:**
✅ Sugestão IA com variável mencionada (detecção funciona)
✅ Sugestão IA sem variáveis (fallback para todas)
✅ Inserção de variáveis via sidebar (cursor preservado)
✅ Copiar prompt usado pela IA
✅ CRUD completo de templates
✅ Toast não bloqueia botão de salvar

### Evolution API Integration - Segunda Sessão

**Serviço Evolution API** (server/services/evolution.ts):
- Integração com Evolution API WhatsApp
- Métodos: sendTextMessage, getInstanceStatus, setWebhook
- processIncomingMessage: Processa mensagens recebidas, cria/atualiza conversations
- sendOutboundMessage: Envia mensagens para WhatsApp
- Separação por channelId: Usa externalContactId para identificar contatos do WhatsApp
- **Uso**: EVOLUTION_API_URL e EVOLUTION_API_KEY (env vars)

**Webhook Handler** (server/routes/webhooks.ts):
- Endpoint: POST /webhooks/evolution/:channelId
- Recebe webhooks do Evolution API
- Processa evento "messages.upsert"
- Ignora mensagens outbound (fromMe=true)
- Auto-cria conversations para novos contatos

### Email & Transcription System - Segunda Sessão

**Serviço de Email** (server/services/email.ts):
- sendEmail: Serviço base (stub - logs apenas)
- sendConversationTranscription: Envia transcrição formatada
- sendMeetingNotification: Notificações de reuniões (created/updated/cancelled)
- **Uso**: SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD
- **Limitação**: Stub apenas (logs) - nodemailer pendente por conflito de dependências

**Exportação de Transcrição** (server/routes/conversation-export.ts):
- Endpoint: POST /api/conversations/:id/export
- Somente agentes (attendant/admin)
- Envia transcrição por email para usuário logado
- Formata: [timestamp] Sender: Message
- Suporta HTML e plain text

### Meetings Schema Update - Segunda Sessão

**Campo Adicionado**:
- `mentionedParticipants`: Array JSONB de user IDs
- `status`: Enum estendido incluindo "cancelled"

**Migração**: Aplicada via SQL manual (ALTER TABLE)

### Limitações Conhecidas

**Email Service**:
- Implementação stub (logs apenas)
- Nodemailer não instalado (peer dependency conflict)
- Emails não são realmente enviados
- Aparece como "sucesso" mas apenas loga

**Meetings Notifications**:
- Schema atualizado mas notificações não integradas nas rotas de meetings
- Funcionalidade sendMeetingNotification implementada mas não chamada

**Frontend**:
- Botão "Exportar Transcrição" não implementado na UI (backend pronto)
- Integration Evolution API não visível no frontend (backend pronto)

