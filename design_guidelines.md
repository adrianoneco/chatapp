# ChatApp Design Guidelines

## Design Approach
**System-Based Approach**: Given ChatApp's utility-focused nature as a messaging platform, we'll use **Material Design 3** principles combined with **WhatsApp's messaging UX patterns**. This ensures familiarity for users while maintaining professional functionality for role-based workflows.

## Core Design Elements

### Typography
- **Primary Font**: Inter (Google Fonts) for UI elements and body text
- **Hierarchy**:
  - Page titles: 2xl (24px), semibold
  - Section headers: xl (20px), medium
  - Body text: base (16px), regular
  - Labels/metadata: sm (14px), medium
  - Captions: xs (12px), regular

### Layout System
**Spacing Units**: Use Tailwind spacing of 2, 4, 6, and 8 units consistently
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card gaps: gap-4
- Icon-text spacing: gap-2

**Container Strategy**:
- Main content area: Responsive with sidebar (expanded: ml-64, collapsed: ml-16)
- Content max-width: max-w-7xl mx-auto px-6
- Forms: max-w-md for login/register, max-w-2xl for admin forms

### Layout Structure

**Header** (Fixed, h-16):
- Left: Logo (40px height) with "ChatApp" wordmark
- Right: User profile section with avatar (32px), username, and dropdown menu (chevron down icon)
- Dropdown includes: Profile, Settings, role badge, Logout
- Shadow: Subtle bottom shadow for depth

**Sidebar** (Fixed left, transition-all duration-300):
- Expanded state: w-64 with icon + label
- Collapsed state: w-16 with icon only (centered)
- Toggle button: Positioned center-right edge, circular with chevron icon
- Navigation items: p-3 with rounded hover states
- Active item: Distinct background treatment
- Spacing: space-y-1 between items

**Main Content Area**:
- Automatic margin adjustment based on sidebar state
- Minimum content padding: p-6 to p-8
- Proper viewport usage (no forced 100vh)

## Component Library

### Authentication Screens
**Login Page** (Centered card layout):
- Card: max-w-md, centered vertically and horizontally
- Logo: Centered at top (60px height)
- Form fields: Full width with consistent spacing (space-y-4)
- Input fields: h-12, rounded borders, focus states
- Submit button: w-full, h-12, prominent treatment
- Link to register: Small text below form

**Register Page**:
- Similar card layout to login
- Additional fields: name, email, password, confirm password
- Role selection: Dropdown or radio group (default: client)
- Success state redirects to login

### Navigation Components
**Sidebar Items**:
- Icon: 20px (Heroicons)
- Label: base font (hidden when collapsed)
- Hover: Background highlight
- Active: Stronger background + left border accent

**Header Dropdown**:
- Avatar: 32px rounded-full
- Menu items: p-3, with icons (16px) on left
- Role badge: Small pill showing user's role
- Dividers between sections

### Dashboard & Default Pages
**Default Page** (Empty state):
- Icon: 64px centered (message circle or relevant icon)
- Title: xl, centered below icon (mt-4)
- Description: base, muted, centered (mt-2)
- Optional CTA button: Centered below (mt-6)

### Error Pages
**Structure** (400, 401, 403, 404, 500):
- Centered layout: flex items-center justify-center min-h-screen
- Error code: 4xl to 6xl, bold
- Error message: xl below code (mt-4)
- Description: base, muted (mt-2)
- Action button: "Go to Dashboard" or "Back to Login" (mt-6)
- Each error has appropriate icon (warning, lock, search-x, etc.)

### User Management Tables (Admin)
- Data table: Striped rows for readability
- Column headers: Small, uppercase, medium weight
- Row height: h-12 minimum
- Actions: Icon buttons (edit, delete) right-aligned
- Pagination: Bottom of table with page controls

## Visual Patterns

**Cards**:
- Border radius: rounded-lg
- Padding: p-6
- Shadow: Subtle elevation

**Buttons**:
- Primary: h-10 to h-12, px-6, rounded-lg
- Secondary: Same size, different treatment
- Icon buttons: Square (40px), rounded

**Form Elements**:
- Inputs: h-12, rounded-lg, px-4
- Labels: mb-2, small to base, medium weight
- Error states: Red border, error message below (text-sm)
- Focus states: Ring treatment for accessibility

**Status Indicators**:
- Role badges: Pill shape, small text, px-3 py-1
- Online status: 8px dot (green for online)

## Accessibility
- Minimum touch targets: 44px
- Color contrast: WCAG AA compliance
- Focus indicators: Visible ring on all interactive elements
- Semantic HTML: Proper heading hierarchy
- ARIA labels: For icon-only buttons

## Images
No hero images required. This is a utility application focused on messaging functionality. The only imagery needed is:
- Logo: WhatsApp-inspired icon with chat bubble design
- User avatars: 32px in header, larger in profiles
- Empty state icons: Simple line icons for dashboard and error pages