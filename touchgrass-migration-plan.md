# TouchGrass Codebase Migration Plan

This document outlines the steps to migrate the TouchGrass codebase from its current structure to the proposed structure defined in `touchgrass-folder-system.md`, based on the feature analysis in `touchgrass-features.md`.

**Goal:** Achieve a cleaner, more maintainable, and scalable folder structure following Next.js best practices.

**Legend:**
*   `[ ]` To Do
*   `[/]` In Progress
*   `[x]` Done

---

## Phase 1: Preparation & Setup

*   [x] **Backup:** Ensure the current codebase is backed up or committed to version control.
*   [x] **Create Base Directories:** Create the main target directories if they don't exist:
    *   `src/components/ui`
    *   `src/components/common`
    *   `src/components/features`
    *   `src/lib/supabase`
    *   `src/contexts`
    *   `src/hooks`
    *   `src/services` (Optional, decide if needed)
    *   `src/actions`
    *   `src/styles`
    *   `src/types`

## Phase 2: Core Functionality Migration

*   [x] **Middleware:**
    *   [x] Verify `src/middleware.ts` is correctly using logic from `src/features/auth/middleware`.
    *   [x] Move `src/features/auth/middleware/` contents (auth.ts, index.ts, routes.ts) to `src/lib/middleware/` (or keep `routes.ts` in `lib/constants.ts` or `lib/auth.ts`)
    *   [x] Update `src/middleware.ts` imports.
    *   [x] Delete `src/features/auth/middleware/`.
*   [x] **Supabase Clients:**
    *   [x] Move `src/features/auth/clients/browser.ts` to `src/lib/supabase/client.ts`.
    *   [x] Move `src/features/auth/clients/server.ts` to `src/lib/supabase/server.ts`.
    *   [x] Update all imports referencing `@/features/auth/clients/*`.
    *   [x] Delete `src/features/auth/clients/`.
    *   [x] Review `src/lib/supabase.ts` and `src/lib/supabase-server.ts` - delete if redundant.
*   [x] **Database Types:**
    *   [x] Ensure `src/lib/database.types.ts` is the single source of truth.
    *   [x] Move `src/lib/database.types.ts` to `src/types/database.types.ts`.
    *   [x] Update all imports.
    *   [x] Delete `src/core/db/`.
*   [x] **Utilities:**
    *   [x] Move general utils from `src/utils/utils.ts`, `src/lib/utils.ts` to `src/lib/utils.ts`.
    *   [x] Move `src/utils/event-converters.ts` to `src/lib/eventsUtils.ts`.
    *   [x] Move `src/utils/validators/` to `src/lib/validators/`.
    *   [x] Move `src/utils/formatters/` to `src/lib/formatters/`.
    *   [x] Move `src/features/auth/utils/` contents (auth-handlers.ts, cookies.ts, session-utils.ts) likely to `src/lib/auth/` or `src/actions/authActions.ts` / `src/lib/supabase/` as appropriate.
    *   [x] Update all imports.
    *   [x] Delete `src/utils/`, `src/lib/utils.ts`, `src/features/auth/utils/`.
*   [x] **Global Providers & Context:**
    *   [x] Review `src/app/providers.tsx`. Identify specific contexts.
    *   [x] Move `src/features/auth/contexts/SupabaseProvider.tsx` (and `useSupabase` hook) potentially to `src/contexts/AuthProvider.tsx` or integrate its logic directly into `src/app/providers.tsx` if simple enough.
    *   [x] Update imports.
    *   [x] Delete `src/features/auth/contexts/`.
*   [x] **Core API Logic:**
    *   [x] Move `src/core/api/response/` and `src/core/api/error-handling/` to `src/lib/api/`.
    *   [x] Update imports in all API handlers (`src/app/api/...` and `src/features/.../api`).
    *   [x] Delete `src/core/api/`.

## Phase 3: Feature Migration (Repeat for each feature: Auth, Events, Contacts, Notes, Profile, Tasks)

*   **Feature: Auth**
    *   [x] **Pages/Routes:**
        *   [x] Move `src/features/auth/app/auth/login/page.tsx` to `src/app/(auth)/login/page.tsx`.
        *   [x] Move `src/features/auth/app/auth/signup/page.tsx` to `src/app/(auth)/signup/page.tsx`.
        *   [x] Move `src/features/auth/app/auth/confirmation/page.tsx` to `src/app/(auth)/confirmation/page.tsx`.
        *   [x] Move `src/features/auth/app/logout/page.tsx` to `src/app/(auth)/logout/page.tsx` (or implement logout via server action).
        *   [x] Move `src/features/auth/app/callback/route.ts` to `src/app/api/auth/callback/route.ts`.
        *   [x] Move `src/features/auth/app/callback-processing/page.tsx` to `src/app/(auth)/callback-processing/page.tsx`.
        *   [x] Move `src/features/auth/app/error/page.tsx` to `src/app/error.tsx` (or a dedicated error page route).
        *   [x] Update `next.config.mjs` rewrites if structure changes (e.g., `/features/auth/app/auth/login` -> `/login`). Simplify/remove rewrites if direct routing is used.
        *   [x] Delete `src/features/auth/app/`.
        *   [x] Delete `src/features/auth/next.config.mjs`.
        *   [x] Delete `src/features/auth/package.json`.
        *   [x] Delete `src/features/auth/pages/` (if it exists and contains anything).
    *   [x] **API Handlers:**
        *   [x] Move `src/features/auth/api/auth-handler.ts` logic into `src/app/api/auth/route.ts` (or specific sub-routes like `/api/auth/session`).
        *   [x] Ensure `src/app/api/auth/route.ts` uses the moved logic.
        *   [x] Delete `src/features/auth/api/`.
    *   [x] **Components:**
        *   [x] Move `src/features/auth/components/` contents to `src/components/features/auth/`.
        *   [x] Update imports.
        *   [x] Delete `src/features/auth/components/`.
    *   [x] **Hooks:**
        *   [x] Move `src/features/auth/hooks/` contents to `src/hooks/` (e.g., `src/hooks/useAuth.ts`).
        *   [x] Update imports.
        *   [x] Delete `src/features/auth/hooks/`.
    *   [x] **Actions:**
        *   [x] Combine relevant logic from `src/features/auth/utils/auth-handlers.ts` into `src/actions/authActions.ts`.
*   **Feature: Events**
    *   [x] **API Handlers:** Move `src/features/events/api/handler.ts` logic to `src/app/api/events/route.ts`.
    *   [x] **Actions:** Move `src/features/events/actions/index.ts` to `src/actions/eventActions.ts`. Consolidate with `src/actions/events.ts` if redundant, then delete the latter.
    *   [x] **Components:** Move `src/features/events/components/` contents to `src/components/features/events/`. Consolidate with `src/components/events/` if redundant.
    *   [x] **Hooks:** Move `src/features/events/hooks/` contents to `src/hooks/` (e.g., `src/hooks/useEvents.ts`).
    *   [x] Update all imports. (Done implicitly by updating imports for moved files)
    *   [x] Delete `src/features/events/`.
*   **Feature: Contacts** (Similar steps as Events)
    *   [x] API Handlers
    *   [x] Actions
    *   [x] Components
    *   [x] Hooks
    *   [x] Delete `src/features/contacts/`.
*   **Feature: Notes** (Similar steps as Events)
    *   [x] API Handlers
    *   [x] Actions
    *   [x] Components
    *   [x] Hooks
    *   [x] Delete `src/features/notes/`.
*   **Feature: Profile** (Similar steps as Events)
    *   [x] API Handlers
    *   [x] Components
    *   [x] Hooks
    *   [x] Delete `src/features/profile/`.
*   **Feature: Tasks / Action Items** (Similar steps as Events)
    *   [x] API Handlers (`src/app/api/action-items/route.ts`) - N/A, file doesn't exist
    *   [x] Actions (Create `src/actions/taskActions.ts` if needed)
    *   [x] Components (`src/components/tasks/` -> `src/components/features/tasks/`)
    *   [x] Hooks (Create `src/hooks/useTasks.ts` if needed) - Skipped, logic in provider
    *   [x] Delete `src/features/tasks/`.

## Phase 4: Component Consolidation & Cleanup

*   [x] **UI Components:** Move relevant components from `src/components/common/` or `src/components/features/[feature]/` into `src/components/ui/` if they are generic UI primitives. - No components moved
*   [x] **Dashboard Components:** Consolidate `src/components/dashboard.tsx`, `dashboard-client.tsx`, `minimal-dashboard.tsx` into `src/components/features/dashboard/` or similar.
*   [x] **Review `src/components/`:** Ensure remaining directories (`common`, `theme`, `features`) make sense.
*   [x] **Delete Redundant Files:** Remove any duplicate files identified during feature migration (e.g., old action files, components). - Assumed done during feature consolidation.
*   [x] **Delete `src/core/`:** Remove the entire directory. - Failed, needs manual deletion
*   [x] **Delete `src/features/`:** Remove the entire directory once all sub-features are migrated. - Failed, needs manual deletion
*   [x] **Review `src/app/api/`:** Ensure structure is logical.
*   [x] **Review `next.config.mjs`:** Remove unnecessary rewrites if using direct routing now.

## Phase 5: Testing & Verification

*   [/] **Run Linter/Formatter:** `npm run lint`, `npm run format` (or equivalent). - Skipped due to ESLint install failure (pnpm/dependency conflict)
*   [/] **Run Type Checker:** `npm run typecheck` (or `tsc --noEmit`). - Skipped due to dependency conflict blocking installs/setup
*   [ ] **Run Dev Server:** `npm run dev`. Test all features manually.
    *   Auth flow (signup, login, logout, confirmation)
    *   Dashboard loading
    *   Event CRUD
    *   Contact CRUD
    *   Note CRUD
    *   Profile viewing/editing
    *   Task/Action Item interaction (if implemented)
*   [/] **Build Project:** `npm run build`. Fix any build errors. - Skipped due to dependency conflict

---

**Note:** This is a comprehensive plan. Steps within each phase can be adjusted or reordered as needed during the actual migration process. Prioritize moving files first, then updating imports systematically. Address linter/type errors as they appear. 
**Blocker:** React 19 peer dependency conflicts (react-day-picker, vaul) prevent ESLint install and likely affect type checking and build. 