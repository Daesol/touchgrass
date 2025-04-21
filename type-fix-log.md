# Type Error Fix Log

This document tracks the progress of fixing type errors based on the agreed-upon data schema definitions in `data-schema.md`.

## Phase 1: Update `src/types/models.ts`

*   **Goal:** Align types in `models.ts` with decisions made in `data-schema.md` review.
*   **Actions:**
    *   Modify `Event`: Add `description?`, `completed?`.
    *   Modify `Contact`: Add `email?`, `phone?`.
    *   Modify `ActionItem`: Rename `text`->`title`, add `description?`, add `event_id?`, make `contact_id` & `due_date` nullable.
*   **Status:** Done

## Phase 2: Systematic Refactoring & Error Fixing

*   **Action:** Run `npx tsc --noEmit` to get baseline errors after model updates.
*   **Result:** Identified 65 errors across 14 files. Errors are mainly:
    *   Type mismatches/missing properties in components (`dashboard.tsx`, `contact-form.tsx`, `contact-detail.tsx`, `task-list.tsx`, `event-list.tsx`) vs. updated `models.ts` types.
    *   Incorrect import paths (`../utils/auth-handlers`, `@/components/dashboard`, `../hooks/useNotes`).
    *   `await` potentially missing (`logout/route.ts`, `server.ts` from lint report).
    *   Incorrect usage of `ActionItem` fields (`text` vs `title`, `dueDate` vs `due_date`, nullability) in `task-list.tsx` and `contact-form.tsx`.
    *   Incorrect usage of `Contact` fields (`linkedinUrl`, `voiceMemo`, missing `rating`/`actionItems`/`date`) in `contact-form.tsx` and `contact-detail.tsx`.
    *   Incorrect usage of `Event` fields (`colorIndex`) in `dashboard.tsx`, `client-event-form.tsx`, `event-selector.tsx`.
    *   Incorrect mock data creation in `data/*Service.ts` (`createdAt`/`updatedAt`).
    *   Missing `GenericSchema`/`PostgrestDefaultSchema` import in `server-client.ts`.
*   **Status:** In Progress

*   **Log (Fix Batch 1 & 2):**
    *   **Action:** Add `MISSING_PARAMETER` to `ApiErrorCode`. (Success)
    *   **Action:** Fix incorrect import paths. (Success for most, deferred complex ones)
    *   **Action:** Rename `dueDate` -> `due_date` in `task-list.tsx`. (Success)
    *   **Action:** Rename `createdAt`/`updatedAt` in `data/*Service.ts` (Attempted, deferred for manual review due to complexity).
    *   **Action:** Rename `text` -> `title` in `task-list.tsx` (Success) & `contact-form.tsx` (Deferred to manual).
    *   **Action:** Fix unescaped entities in `dashboard/fallback/page.tsx`. (Success)
    *   **Action:** Fix missing `await` in `logout/route.ts` cookies call. (Success)
    *   **Action:** Fix `any` types in hooks (`useContacts`, `useEvents`, `useNotes`, `useProfile`) and some lib files (`errorUtils`, `api/response`). (Success for most)
    *   **Action:** Fix various unused variables/imports across multiple files. (Partial Success)
    *   **Action:** Attempted fixes for complex type mismatches. (Deferred most to manual review).
*   **Log (Runtime Fix 1):**
    *   **Issue:** Runtime error `Attempted to call createSupabaseBrowserClient() from the server` in `AuthLayout` called by `isSessionValid`.
    *   **Fix:** Modified `src/app/(auth)/layout.tsx` to use `createSupabaseServerComponentClient` directly for session check instead of calling `isSessionValid`.
    *   **Note:** `isSessionValid` in `src/lib/auth/sessionUtils.ts` may now be redundant or needs review.
*   **Log (Build Fix 1):**
    *   **Issue:** Build failed with `Dynamic server usage: Route /confirmation couldn't be rendered statically because it used \`cookies\`.`
    *   **Cause:** `AuthLayout` uses server-side `getSession()` which reads cookies.
    *   **Fix:** Added `export const dynamic = 'force-dynamic'` to `src/app/(auth)/layout.tsx`.
*   **Final Status:** Automated fixes applied for simple errors. Significant type mismatches remain.

## Requires Manual Refactor / Review

*(Previously listed files plus confirmations from fix attempts)*

*   **`src/components/features/dashboard/dashboard.tsx`**: High number of prop type mismatches vs `models.ts`. Unused state/functions. `useEffect` deps.
*   **`src/components/features/contacts/contact-form.tsx`**: Major discrepancies with `Contact`/`ActionItem` types (camelCase vs snake_case, missing/extra fields like rating/actionItems/date). Needs rework or removal.
*   **`src/components/features/contacts/contact-detail.tsx`**: Mismatches with `Contact` type (rating, eventTitle, date, linkedin_url, voice_memo). `ActionItem` section commented out.
*   **`src/components/features/events/event-list.tsx`**: Potential `undefined` issue with `event` after `find`. Numerous unused imports remain.
*   **`src/data/contactsService.ts`**: Needs manual refactoring for state updates and `Contact` type alignment.
*   **`src/data/tasksService.ts`**: Needs manual refactoring for state updates and `Task`/`ActionItem` type alignment.
*   **`src/lib/auth/cookies.ts`**: Still contains `any` types requiring review of logic.
*   **`src/lib/supabase/server-client.ts`**: Import errors for Supabase types (`GenericSchema`, `PostgrestDefaultSchema`). File might be obsolete or need Supabase v3 updates.
*   **Remaining Lint/Type Errors:** Check `tsc --noEmit` output for remaining errors, especially unused variables/imports and any explicit `any` types not automatically fixed.

*   **Action:** Fix incorrect import paths:
    *   **FIXED:** `@/hooks/use-mobile` in `sidebar.tsx` (Removed import, replaced usage with `useMediaQuery`)
    *   **FIXED:** `@/components/dashboard` in `dashboard-client.tsx` (Corrected to `@/components/features/dashboard/dashboard`)
    *   **PENDING:** `@/components/dashboard` imports in other files (Marked for manual review due to type issues).
    *   **PENDING:** `../hooks/useNotes` in `NoteItem.tsx`, `NotesList.tsx` (Corrected)
*   **Action:** Fix simple property name mismatches:
    *   `dueDate` -> `due_date` in `task-list.tsx` (Success)
    *   `createdAt`/`updatedAt` -> `created_at`/`updated_at` in `data/*Service.ts` (Success)
    *   **PENDING:** `text` -> `title` in `task-list.tsx`, `contact-form.tsx`.
    *   **PENDING:** Other mismatches in `contact-form.tsx`, `contact-detail.tsx` (Marked for manual review).
*   **Action:** Fix unescaped entities.
*   **Action:** Fix missing `await` in `logout/route.ts`.
*   **Action:** Fix unused variables/imports.

*   **Log (Fix Batch 2):**
    *   Targeting remaining import path errors in `auth` components, `dashboard-client.tsx`, `notes` components.
    *   Targeting remaining simple property name mismatches in `task-list.tsx`, `contact-form.tsx`, `data/*Service.ts`.
    *   Targeting unescaped entities in `task-list.tsx`, `contact-form.tsx`, `data/*Service.ts`.
    *   Targeting missing `await` in `logout/route.ts`.
    *   Targeting unused variables/imports in `task-list.tsx`, `contact-form.tsx`, `data/*Service.ts`.

## Requires Manual Refactor / Review

*(Complex issues deferred during systematic fixing will be listed here)*
*   `src/components/features/dashboard/dashboard.tsx`: High number of prop type mismatches.
*   `src/components/features/contacts/contact-form.tsx`: Significant mismatches with `Contact` and `ActionItem` types.
*   `src/components/features/contacts/contact-detail.tsx`: Mismatches with `Contact` type.
*   `src/lib/supabase/server-client.ts`: Import errors for Supabase types.
*   `src/components/features/events/event-list.tsx`: Potential `undefined` issue with `event`.

*   `src/data/contactsService.ts`: Needs manual refactoring to align with `Contact` type from `models.ts` and correct usage of `useLocalStorage` state setter.
*   `src/data/tasksService.ts`: Needs manual refactoring to align with `Task` type from `models.ts` and correct usage of `useLocalStorage` state setter.
*   **Next Actions:** Continue addressing reported type errors or new runtime errors. 