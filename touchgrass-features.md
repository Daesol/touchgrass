# TouchGrass Feature Analysis

This document outlines the identified features of the TouchGrass application based on the current codebase structure.

## 1. Authentication (Auth)

*   **Description:** Handles user sign-up, login (email/password, Google), logout, session management, email confirmation, and password reset (implied by `/reset` route in middleware). Includes middleware for protecting routes.
*   **Key Files/Folders:**
    *   `src/features/auth/` (Contains most auth logic: api, clients, components, contexts, hooks, middleware, utils, app routes, next.config.mjs, package.json)
    *   `src/middleware.ts` (Imports and uses auth middleware)
    *   `src/app/api/auth/route.ts` (Route handler, likely for server-side session sync)
    *   `src/app/api/debug-auth/` (Likely for debugging auth flows)
    *   `src/app/(auth)/` (Old, now removed auth routes - login, signup, confirmation)
    *   `src/lib/supabase/` (Old location of clients - browser, server, dashboard)
    *   `src/lib/supabase.ts`, `src/lib/supabase-server.ts` (Older Supabase client implementations)
    *   `src/core/auth/` (Old, now removed structure)

## 2. Events Management

*   **Description:** Allows users to create, view, update, and delete events.
*   **Key Files/Folders:**
    *   `src/features/events/` (api, actions, components, hooks)
    *   `src/app/api/events/route.ts` (API route handler)
    *   `src/actions/events.ts` (Standalone server actions - potentially duplicate or older)
    *   `src/components/events/` (UI Components - potentially duplicate or older)
    *   `src/utils/event-converters.ts` (Utility for event data)

## 3. Contacts Management

*   **Description:** Allows users to create, view, update, and delete contacts.
*   **Key Files/Folders:**
    *   `src/features/contacts/` (api, actions, components, hooks)
    *   `src/app/api/contacts/route.ts` (API route handler)
    *   `src/components/contacts/` (UI Components - potentially duplicate or older)

## 4. Profile Management

*   **Description:** Allows users to view and update their profile information.
*   **Key Files/Folders:**
    *   `src/features/profile/` (api, components, hooks)
    *   `src/app/api/profile/route.ts` (API route handler)
    *   `src/components/profile/` (UI Components - potentially duplicate or older)

## 5. Notes Management

*   **Description:** Allows users to create, view, update, and delete notes.
*   **Key Files/Folders:**
    *   `src/features/notes/` (api, actions, components, hooks)
    *   `src/app/api/notes/route.ts` (API route handler)

## 6. Tasks Management (Action Items?)

*   **Description:** Appears to be a feature area, possibly for managing tasks or action items derived from other features (e.g., events, notes). Currently seems unimplemented or minimal. The DB schema has `action_items`.
*   **Key Files/Folders:**
    *   `src/features/tasks/` (Currently empty)
    *   `src/components/tasks/` (UI Components - potentially duplicate or older)
    *   `src/app/api/action-items/route.ts` (API route handler exists)

## 7. Dashboard

*   **Description:** Central view for users after login, likely displaying summaries or access points for other features.
*   **Key Files/Folders:**
    *   `src/app/dashboard/` (layout.tsx, page.tsx - likely main dashboard structure)
    *   `src/components/dashboard.tsx` (Large dashboard component)
    *   `src/components/dashboard-client.tsx` (Client-side logic/hooks for dashboard)
    *   `src/components/minimal-dashboard.tsx` (Alternative/simplified dashboard view?)

## 8. Core Functionality & UI

*   **Description:** Shared utilities, UI components, configurations, database interactions, and overall application setup.
*   **Key Files/Folders:**
    *   `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/providers.tsx`, `src/app/globals.css` (Root layout, landing page, global providers, styles)
    *   `src/components/ui/` (Likely base UI elements - Shadcn/UI?)
    *   `src/components/common/` (Shared application components)
    *   `src/components/theme/` (Theming components/logic)
    *   `src/lib/` (Database types, Supabase setup remnants, general utils)
    *   `src/utils/` (General utilities, formatters, validators)
    *   `src/hooks/` (General hooks, if any)
    *   `src/types/` (Shared TypeScript types, if any)
    *   `src/core/` (Old structure remnants: api/response, db/schema)
    *   `next.config.mjs`, `tailwind.config.ts`, `tsconfig.json`, `package.json` (Project configuration)

## Potential Future Features (Mentioned by User)

*   Voice Memo
*   LinkedIn Fetch
*   AI Summary / Action Item Generator
*   Payment Gateway

## Observations & Issues

*   **Inconsistent Structure:** Features are sometimes in `src/features/`, sometimes directly in `src/app/api`, `src/actions`, or `src/components`.
*   **Redundancy:** Potential duplication of components (e.g., `src/features/events/components` vs `src/components/events`) and actions (`src/features/events/actions` vs `src/actions/events.ts`).
*   **Confusing Naming/Nesting:** `src/features/auth/app/auth` is highly redundant. The purpose of `src/features/auth/pages` is unclear.
*   **Remnants:** Old structures (`src/core`, old files in `src/lib`, `src/actions`) need cleanup.
*   **Feature Modularity:** The `src/features` attempt is good, but implementation is inconsistent and sometimes leaky (e.g., API routes in `src/app/api` instead of within the feature).

This analysis provides a baseline understanding. Next, I'll propose a new folder structure based on these features and best practices. 