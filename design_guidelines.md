# Design Guidelines - Sistema de Conversas (Chatwoot-style)

## Design Approach
**Reference-Based**: Drawing inspiration from Chatwoot, Intercom, and Linear for a clean, professional business application optimized for productivity and data management.

## Core Design Principles
- **Clarity First**: Information hierarchy prioritizes usability over decoration
- **Efficient Workflows**: Minimize clicks, maximize productivity
- **Professional Aesthetic**: Clean, trustworthy interface for business users
- **Data Density**: Comfortable display of tables, lists, and user information

## Typography
- **Primary Font**: Inter or Work Sans via Google Fonts
- **Hierarchy**:
  - Page Titles: text-2xl font-semibold
  - Section Headers: text-lg font-medium
  - Body Text: text-base font-normal
  - Labels: text-sm font-medium
  - Captions/Meta: text-xs text-gray-500

## Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Card gaps: gap-4, gap-6
- Page margins: px-6, py-8

**Dashboard Structure**:
- Sidebar: Fixed width (w-64), full height
- Main Content: flex-1 with max-w-7xl container
- Top Bar: h-16 with user menu and notifications
- Content Cards: Rounded corners (rounded-lg), subtle shadows

## Component Library

### Navigation
- **Sidebar**: Vertical navigation with icons + labels, active state with accent background
- **Top Bar**: User profile, search, notifications on the right
- **Breadcrumbs**: For nested pages (text-sm with "/" separator)

### Authentication Pages
- **Layout**: Centered card (max-w-md) on minimal background
- **Logo**: Top-center, mb-8
- **Form Spacing**: space-y-4 for inputs
- **Links**: Small, underlined links for "Esqueceu a senha?" below form

### User Management
**View Toggles**: Buttons to switch between card and table views (positioned top-right)

**Card View**:
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- User cards: Image (w-16 h-16 rounded-full), name (font-medium), email (text-sm text-gray-600), role badge
- Actions: Edit/Delete icons (top-right of card)

**Table View**:
- Sticky header with sorting indicators
- Columns: Avatar, Nome, Email, Função, Criado em, Ações
- Row hover: Subtle background change
- Avatar: w-10 h-10 rounded-full inline with name

**Filters**:
- Horizontal bar above content with search input + role dropdown + status toggle
- Compact design (h-12 items)

### Forms
- **Input Fields**: h-10, border, rounded-md, focus:ring-2 focus:ring-offset-0
- **Labels**: mb-1.5, font-medium, text-sm
- **Buttons**: h-10, px-6, rounded-md, font-medium
- **Image Upload**: Circular preview (w-24 h-24) with camera icon overlay on hover
- **Validation**: Red border + error message below (text-sm text-red-600)

### Data Display
- **Badges**: For roles (Cliente/Atendente/Admin) - pill-shaped, px-3 py-1, text-xs
- **Status Indicators**: Small colored dots for online/offline/deleted states
- **Empty States**: Centered icon + message + CTA button when no data

### Modals
- **Structure**: Centered overlay (max-w-2xl), backdrop blur
- **Header**: Title + close button (X icon top-right)
- **Body**: p-6, space-y-4
- **Footer**: Flex justify-end with Cancel/Confirm buttons

## Interactions
**Minimal Animations**:
- Hover states: Subtle opacity/background changes
- Modal entry: Simple fade-in (duration-200)
- Page transitions: None (instant navigation for productivity)
- Loading states: Spinner or skeleton screens for tables

## Images
**User Avatars**:
- Circular profile images throughout (w-10 h-10 to w-24 h-24 depending on context)
- Fallback: Initials on colored background if no image
- Upload area: Dotted border with camera icon when empty

**No Hero Images**: This is a business application - login pages use centered cards on clean backgrounds, no decorative hero sections.

## Accessibility
- All form inputs with proper labels and aria-attributes
- Keyboard navigation for tables and modals
- Focus visible states on all interactive elements
- Sufficient color contrast (WCAG AA minimum)
- Error messages linked to inputs

## Portuguese Brazilian Specifics
- All labels, buttons, messages in pt-BR
- Date formats: DD/MM/YYYY
- Form validation messages in Portuguese
- Placeholder text culturally appropriate