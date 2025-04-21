# Src Directory Review (Post-Migration)

This document summarizes the state of the `src` directory after the planned migration.

## Folders/Files Previously Marked for Manual Removal

These folders were targeted for removal, and you confirmed they have been manually deleted:

*   `src/core/`
*   `src/features/`
*   `src/utils/`
*   `src/components/events/`
*   `src/components/contacts/`
*   `src/components/profile/`
*   `src/components/tasks/`

## Reviewed Folders (Keep, Remove, or Rename?)

*   `src/backup/`: Contains `auth/` subdirectory with apparent old/backup auth pages/routes. **Recommendation:** Delete unless specifically needed.
*   `src/cursor/`: Confirmed needed for MCP/Supabase. **Recommendation:** Keep.
*   `src/scripts/`: Contains DB setup, migration, and test scripts. **Recommendation:** Keep (either in `src/` or move to project root `./scripts/`).
*   `src/data/`: Contains service files (`eventsService`, `contactsService`, `tasksService`) abstracting data logic. This fulfills the role of the proposed optional `src/services/` directory. **Recommendation:** Either keep as `src/data/` or rename to `src/services/` for consistency with the proposal (requires updating imports).

## Expected Folders/Files (Present)

The following folders and files are present and align with the proposed structure:

*   `src/app/`
*   `src/actions/`
*   `src/components/` (Contains `common/`, `features/`, `ui/`)
*   `src/contexts/`
*   `src/hooks/`
*   `src/lib/`
*   `src/styles/`
*   `src/types/`
*   `src/middleware.ts`

## Remaining Tasks (from Migration Plan - Phase 5)

*   **Dependency Conflicts:** Resolve React 19 peer dependency issues (`react-day-picker`, `vaul`, potentially others).
*   **Linting/Type Checking:** Run `npm run lint` and `npm run typecheck` after fixing dependencies and resolve any reported errors (including previously skipped type errors in components/API routes).
*   **Build:** Run `npm run build` and fix any errors.
*   **Testing:** Perform thorough manual testing of all application features. 