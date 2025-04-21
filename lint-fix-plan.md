# Lint & Type Error Fix Plan

This document tracks the progress of fixing lint and type errors reported by ESLint and TypeScript (`tsc --noEmit`) after the major refactoring.

## Initial Error Analysis (TSC Output)

*(Will be populated after running tsc)*

## Error Categories & Prioritization

1.  `@typescript-eslint/no-unused-vars` (Safe: Remove unused imports/variables)
2.  `prefer-const` (Safe: Change `let` to `const` where applicable)
3.  `react/no-unescaped-entities` (Safe: Replace quotes/apostrophes with HTML entities)
4.  Module Not Found / Import Errors (Fixable if path is clear)
5.  `@typescript-eslint/no-explicit-any` (Fix with caution: Use `unknown` or specific types)
6.  Specific Type Mismatches / Logic Errors (Requires careful review, potentially manual)

## Fix Execution Log

**Round 1 (Post-Refactor):**
*   Ran `npx tsc --noEmit`. Identified 77 errors across 24 files.
*   **Goal:** Fix safe errors (unused vars/imports, import paths, missing enum members, simple property names, unescaped entities).
*   **Action:** Add `MISSING_PARAMETER` to `ApiErrorCode` type. (Success)
*   **Action:** Fix incorrect import paths:
    *   `actions/authActions` in `ConfirmationForm.tsx`, `LoginForm.tsx`, `SignupForm.tsx` (Success)
    *   `types/models` in `contact-detail.tsx`, `client-event-form.tsx`, `event-selector.tsx`, `event-form.tsx`, `contact-list.tsx`, `contact-form.tsx`, `task-list.tsx`, `api/events/route.ts`, `api/contacts/route.ts`, `api/notes/route.ts`, `api/profile/route.ts`, `actions/contactActions.ts`, `actions/noteActions.ts`, `actions/eventActions.ts` (Success)
    *   `types/database.types` in `lib/supabase/client.ts`, `lib/supabase/dashboard-client.ts` (Success)
    *   `@uidotdev/usehooks` in `sidebar.tsx` (Installed package, fixed import) (Success)
    *   `@/hooks/ui/use-toast` in `toaster.tsx` (Success)
    *   `@/actions/eventActions` in `eventsService.ts` (Success)
    *   `@/components/features/dashboard/dashboard` in `dashboard/page.tsx` (Success)
    *   **FAILED:** `@/hooks/use-mobile` in `sidebar.tsx` (Removed import, replaced usage with `useMediaQuery`)
    *   **FAILED:** `@/components/dashboard` imports in various files (Corrected most to `@/types/models`, but type mismatches remain).
    *   **FAILED:** `../hooks/useNotes` in `NoteItem.tsx`, `NotesList.tsx` (Path incorrect, needs review).
*   **Action:** Attempted fixes for unused vars/imports, `no-explicit-any`, `prefer-const`, unescaped entities across various files (Partial success, many remain).
*   **Action:** Attempted type mismatch fixes in `event-list.tsx`, `contact-detail.tsx`, `client-event-form.tsx`, `event-form.tsx`, `task-list.tsx`, `dashboard.tsx` (Partial success, significant mismatches remain).

## Requires Manual Review

The following files contain complex type errors, likely due to mismatches between component logic/props and the centralized types in `src/types/models.ts`. Automatic fixing is risky.

*   **`src/components/features/dashboard/dashboard.tsx`**: Numerous prop type mismatches when passing data to child components (`EventList`, `ContactList`, `TaskList`, `ContactForm`, `EventSelector`, `ClientEventForm`). Needs alignment with `src/types/models.ts`. Also has unused state/functions (`MOCK_EVENTS`, `toast`, `useCallback`, etc.). `uiContacts.length` missing from `useEffect` dep array.
*   **`src/components/features/contacts/contact-form.tsx`**: Significant discrepancies. Uses camelCase (`linkedinUrl`, `voiceMemo`, `actionItems`, `rating`, `eventId`, `date`, `dueDate`) while `Contact`/`ActionItem` types use snake_case (`linkedin_url`, `voice_memo`, `event_id`, `due_date`) and lack `rating`/`actionItems`/`date`. Needs major rework or potentially removal if `contact-saver.tsx` is the intended component.
*   **`src/components/features/contacts/contact-detail.tsx`**: Similar issues to form - uses props (`rating`, `eventTitle`, `date`, `linkedinUrl`, `voiceMemo`) not present or differently cased in the `Contact` type.
*   **`src/components/features/events/event-list.tsx`**: Still has type errors related to `event` possibly being `undefined` after `find`. Logic might need adjustment or stricter type guards. Many unused imports.
*   **`src/components/features/tasks/task-list.tsx`**: Minor: `setShowFilters` unused.
*   **`src/data/*Service.ts`**: Use incorrect fields (`createdAt`/`updatedAt` instead of `created_at`/`updated_at`) when creating mock data. Parameter `event` implicitly `any` in `eventsService.ts`.
*   **`src/lib/auth/cookies.ts`**: Still contains `any` types that were difficult to fix automatically. Needs review of the intended logic for handling different `cookieStore` types.
*   **`src/lib/supabase/server-client.ts`**: Cannot import `GenericSchema` / `PostgrestDefaultSchema`. This file might be redundant or need Supabase V3 updates.
*   **Remaining Lint Errors:** Numerous unused variables/imports (`@typescript-eslint/no-unused-vars`), explicit `any` types (`@typescript-eslint/no-explicit-any`), unescaped entities (`react/no-unescaped-entities`), etc., across many files as reported by the last `tsc` run. 