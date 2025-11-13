# ChatApp Design Guidelines

## Design Approach
**System-Based Approach**: Material Design 3 principles combined with WhatsApp's messaging patterns for utility-focused messaging. The design supports dual themes (light/dark) with gradient accent system using provided brand colors.

## Core Design Elements

### Typography
- **Primary Font**: Inter (Google Fonts CDN)
- **Hierarchy**:
  - Page titles: 2xl (24px), semibold
  - Section headers: xl (20px), medium  
  - Body text: base (16px), regular
  - Labels/metadata: sm (14px), medium
  - Timestamps/captions: xs (12px), regular
- **Language**: All interface text in Portuguese (pt-BR)

### Layout System
**Spacing Units**: Tailwind units of 2, 4, 6, and 8
- Component padding: p-4 to p-6
- Section spacing: space-y-6
- Card gaps: gap-4
- Icon-text spacing: gap-2

**Container Strategy**:
- Header: Full-width, fixed top, h-16
- Sidebar: Full-width when below header, fixed left after, w-64 expanded / w-16 collapsed
- Main content: Adjusts margin based on sidebar state, max-w-7xl mx-auto px-6

## Layout Structure

### Header (Fixed top, full-width, h-16)
- Left section: Logo (chat bubble icon, 40px) + "ChatApp" wordmark
- Right section: Theme toggle button (sun/moon icon, 40px touch target) + User avatar (32px) + username + dropdown chevron
- Gradient background treatment with backdrop blur
- Bottom border for depth separation

### Sidebar (Positioned below header)
**Desktop**: Fixed left, transition-all duration-300
- Expanded: w-64 with icon (20px) + label
- Collapsed: w-16 with centered icons only
- Toggle: Circular button on right edge with chevron
- Navigation spacing: space-y-1
- Active item: Gradient background with left border accent

**Mobile**: Overlay drawer from left, full-height below header

### Main Content Area
- Dynamic margin: ml-64 (expanded) / ml-16 (collapsed) / ml-0 (mobile)
- Padding: p-6 to p-8
- Responsive max-width containers

## Component Library

### Authentication Screens
**Login/Register Cards**:
- Centered layout: max-w-md, rounded-xl
- Logo: 60px centered at top with gradient glow effect
- Form spacing: space-y-4
- Input fields: h-12, rounded-lg, with focus ring treatment
- Submit button: w-full, h-12, gradient background
- Secondary links: Small text with gradient text treatment
- Language: "Entrar", "Registrar", "Email", "Senha", etc.

### Navigation Components
**Sidebar Items**:
- Height: h-12, rounded-lg
- Icon: 20px Heroicons
- Hover: Background highlight with smooth transition
- Active: Gradient background + stronger left border (w-1)
- Role-specific sections divided by subtle separators

**Header Dropdown Menu**:
- Avatar: 32px rounded-full with gradient ring
- Menu items: p-3, icon (16px) left-aligned
- Role badge: Pill shape (px-3 py-1) with gradient
- Sections: "Perfil", "Configurações", role indicator, "Sair"
- Dividers between logical groups

### Theme Toggle
- Icon button: 40px touch target, rounded-full
- Icons: Sun (light mode) / Moon (dark mode) from Heroicons
- Smooth rotation transition on toggle
- Tooltip: "Alternar tema"

### Dashboard & Messaging
**Chat List** (Left panel):
- Contact cards: h-16, with avatar (48px) + name + last message preview
- Unread indicator: Badge with count
- Timestamp: Right-aligned, xs text
- Active chat: Gradient background highlight

**Message Area** (Right panel):
- Header: Contact info with avatar + name + status
- Messages: Bubbles with different alignment (sent vs received)
- Sent bubbles: Gradient background, right-aligned
- Received bubbles: Neutral background, left-aligned
- Input area: Fixed bottom, h-14 with text input + send button (gradient)

### Admin Tables
**User Management**:
- Headers: Uppercase, sm, medium weight ("Usuários", "Função", "Status", "Ações")
- Rows: h-12 minimum, hover state
- Role badges: "Cliente", "Atendente", "Administrador" with gradient
- Actions: Icon buttons (edit/delete) with tooltips
- Pagination: "Anterior", "Próximo", page numbers

### Error Pages (400, 401, 403, 404, 500)
- Centered content: min-h-screen flex layout
- Error code: 6xl, gradient text
- Message: xl, localized ("Página não encontrada", "Acesso negado", etc.)
- Description: base, muted text
- CTA button: "Voltar ao Dashboard" or "Fazer Login" with gradient

## Visual Patterns

**Cards & Containers**:
- Border radius: rounded-lg to rounded-xl
- Elevation: Subtle shadow with theme-aware opacity
- Padding: p-6 for content cards

**Buttons**:
- Primary: h-10 to h-12, px-6, rounded-lg, gradient background
- Secondary: Same sizing, border treatment
- Icon-only: 40px square, rounded
- States: Opacity changes for hover/active, no background changes on gradient backgrounds

**Form Elements**:
- Inputs: h-12, px-4, rounded-lg
- Labels: mb-2, sm weight medium ("Email", "Senha", "Nome completo")
- Focus: Ring treatment with gradient glow
- Error: Red border + error message below

**Status & Badges**:
- Online status: 8px dot (green) with pulse animation
- Role badges: px-3 py-1, rounded-full, gradient backgrounds
- Notification badges: Circular, gradient, with count

## Dark/Light Mode Strategy
**Light Mode**:
- Background: Neutral light tones
- Cards: White with subtle shadows
- Text: Dark grays for hierarchy
- Gradients: Vibrant, full opacity

**Dark Mode**:
- Background: Dark grays/blues
- Cards: Elevated dark surfaces
- Text: Light grays with reduced contrast
- Gradients: Slightly muted for comfort

**Consistent Elements**:
- Gradient accents maintain brand identity across themes
- Focus rings adapt to background
- Borders use theme-aware opacity

## Accessibility
- Touch targets: Minimum 44px
- Focus indicators: Visible rings on all interactive elements
- Color contrast: WCAG AA for both themes
- ARIA labels: "Menu do usuário", "Alternar tema", "Enviar mensagem"
- Semantic HTML with proper heading hierarchy

## Responsive Behavior
- Desktop (lg+): Sidebar + chat dual-pane layout
- Tablet (md): Collapsible sidebar, single pane toggle
- Mobile: Full-screen views with bottom navigation for primary actions
- Header: Remains fixed across all breakpoints

## Images
No hero images required for this utility application. Only functional imagery:
- Logo: Chat bubble icon with gradient treatment
- User avatars: Profile pictures (32px header, 48px chats, larger in profiles)
- Empty states: Simple line icons (message-circle, users) at 64px