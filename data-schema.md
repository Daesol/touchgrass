# Data Schema Analysis

This document analyzes and compares the type definitions found in `src/types/database.types.ts` (assumed DB schema) and `src/types/models.ts` (application models) to establish a source of truth for refactoring.

## 1. Event Type

### `database.types.ts` (Public.Tables.events.Row)

```typescript
{
  id: string
  created_at: string
  title: string
  description: string | null // DB has description
  date: string
  location: string | null
  user_id: string
  completed: boolean         // DB has completed status
}
```

### `models.ts` (Event)

```typescript
{
  id: string;
  user_id: string;
  title: string;
  location: string | null;
  company: string | null;  // Model has company
  date: string;
  color_index: number;     // Model has color_index
  created_at?: string;
  updated_at?: string;
};
```

### Comparison & Discrepancies

*   **Missing Fields:**
    *   DB has `description: string | null`, Model is missing it.
    *   DB has `completed: boolean`, Model is missing it.
    *   Model has `company: string | null`, DB is missing it (might be in `description`?).
    *   Model has `color_index: number`, DB is missing it (likely stored differently, e.g., tags).
*   **Naming:** Consistent (snake_case where applicable).
*   **Nullability:** `location` matches.

### Proposed Source of Truth

*   **Recommendation:** Update `models.ts` `Event` type to be the primary type used in the application code (actions, hooks, components).
    *   **Add:** `description?: string | null` and `completed?: boolean` based on DB.
    *   **Keep:** `company: string | null` (as UI uses it) and `color_index: number` (as UI uses it). Logic in actions/services will need to map `company`/`color_index` to/from DB fields (`description`?, tags?).
    *   Ensure all properties match DB nullability (`location`, `description` are nullable).

## 2. Contact Type

### `database.types.ts` (Public.Tables.contacts.Row)

```typescript
{
  id: string
  created_at: string
  name: string
  email: string | null         // DB has email
  phone: string | null         // DB has phone
  notes: string | null         // DB has notes
  last_contacted: string | null // DB has last_contacted
  user_id: string
}
```

### `models.ts` (Contact)

```typescript
{
  id: string;
  user_id: string;
  event_id: string;        // Model has event_id
  linkedin_url?: string;   // Model has linkedin_url
  name: string;
  position?: string;       // Model has position
  company?: string;        // Model has company
  summary?: string;        // Model has summary
  voice_memo?: {           // Model has voice_memo object
    url: string;
    duration: number;
  };
  created_at?: string;
  updated_at?: string;
};
```

### Comparison & Discrepancies

*   **Missing Fields:**
    *   DB has `email`, `phone`, `notes`, `last_contacted`. Model is missing these.
    *   Model has `event_id`, `linkedin_url`, `position`, `company`, `summary`, `voice_memo`. DB is missing these.
*   **Naming:** Consistent where fields overlap (`id`, `created_at`, `name`, `user_id`).
*   **Structure:** The relationship seems different (e.g., `event_id` in model vs. separate table implied by DB?). `voice_memo` is structured in the model but likely stored differently (e.g., URL in `notes` or separate table?).

### Proposed Source of Truth

*   **Recommendation:** This requires clarification. The two types seem to represent significantly different structures.
    *   **Option A (Align with DB):** Update `models.ts` `Contact` to match `database.types.ts`, adding `email`, `phone`, `notes`, `last_contacted`. Remove fields not in DB (`event_id`, `linkedin_url`, etc.) or determine how they map (e.g., store `linkedin_url` in `notes`?). This would require significant UI refactoring.
    *   **Option B (Align with Model):** Assume `models.ts` represents the desired structure. This implies the DB schema (`database.types.ts`) is outdated or needs migration to add columns like `event_id`, `linkedin_url`, `position`, `company`, `summary`, potentially a separate `voice_memos` table.
    *   **Proposal:** Let's tentatively assume `models.ts` is closer to the *intended* application logic, but acknowledge the DB schema needs updating. For refactoring, we'll use the `models.ts` definition and note where DB interaction will fail or needs adjustment. **Add** the nullable `email` and `phone` fields from the DB type to the `models.ts` type for completeness.

## 3. ActionItem Type

### `database.types.ts` (Public.Tables.action_items.Row)

```typescript
{
  id: string
  created_at: string
  title: string              // DB uses title
  description: string | null // DB has description
  due_date: string | null    // DB due_date is nullable
  completed: boolean
  user_id: string
  contact_id: string | null  // DB contact_id is nullable
  event_id: string | null    // DB has event_id
}
```

### `models.ts` (ActionItem)

```typescript
{
  id: string;
  user_id: string;
  contact_id: string;     // Model contact_id is non-nullable
  text: string;             // Model uses text
  due_date: string;         // Model due_date is non-nullable
  completed: boolean;
  created_at?: string;
  updated_at?: string;
};
```

### Comparison & Discrepancies

*   **Naming:** DB uses `title`, Model uses `text`.
*   **Missing Fields:** DB has `description`, `event_id`. Model is missing these.
*   **Nullability:** `contact_id` and `due_date` are nullable in DB but not in Model.

### Proposed Source of Truth

*   **Recommendation:** Align `models.ts` `ActionItem` with the DB schema (`database.types.ts`).
    *   Rename `text` to `title`.
    *   Add `description?: string | null`.
    *   Add `event_id?: string | null`.
    *   Make `contact_id` nullable: `contact_id: string | null`.
    *   Make `due_date` nullable: `due_date: string | null`.

## 4. Profile Type

### `database.types.ts` (Public.Tables.profiles?)

*Table `profiles` not found in `database.types.ts`.*

### `models.ts` (Profile)

```typescript
{
  id: string
  user_id: string
  full_name?: string
  avatar_url?: string
  email?: string
  phone?: string
  company?: string
  position?: string
  bio?: string
  linkedin_url?: string
  twitter_url?: string
  website_url?: string
  created_at?: string
  updated_at?: string
}
```

### Comparison & Discrepancies

*   Cannot compare as DB schema definition is missing.

### Proposed Source of Truth

*   **Recommendation:** Use `models.ts` `Profile` as the source of truth for now. Assume the DB schema needs to be created or updated to match this structure. Verify all fields used by the application (`profile-section.tsx`, API handlers) are present.

## 5. Note Type

### `database.types.ts` (Public.Tables.notes?)

*Table `notes` not found in `database.types.ts`.*

### `models.ts` (Note)

```typescript
{
  id: string
  content: string // Model uses 'content'
  user_id: string
  contact_id: string
  created_at: string
  updated_at?: string
}
```

### Comparison & Discrepancies

*   Cannot compare directly as DB schema definition for `notes` table is missing.
*   *However*, the `contacts` table in `database.types.ts` has a `notes: string | null` field. It's possible individual notes aren't a separate table, but are stored within the contact record itself. The application code (`useNotes`, `noteActions`, API route) *treats* Notes as a separate entity linked by `contact_id`.

### Proposed Source of Truth

*   **Recommendation:** This indicates a potential mismatch between the application's desired data model (separate notes) and the current DB schema (notes possibly embedded in contacts).
    *   **Option A (Align with current DB):** Refactor the app to not use separate Notes. Store note content in `contacts.notes`. Remove `Note` type, hooks, actions, API. High impact.
    *   **Option B (Align with App Model):** Assume the app model is correct. The DB needs a `notes` table matching the `models.ts` `Note` structure (likely with `content: text` or similar).
    *   **Proposal:** Tentatively proceed assuming **Option B**. Use the `models.ts` `Note` type as the source of truth for refactoring. Acknowledge that DB interaction will likely fail until the schema is updated.

## 6. Task Type

*Note: Derived type (`ActionItem & { ... }`).*

### `models.ts` (Task)

```typescript
// ActionItem & {
  contactId: string
  contactName: string
  eventId: string
  eventTitle: string
// }
```

### Comparison & Discrepancies

*   N/A (Derived type)

### Proposed Source of Truth

*   **Recommendation:** Keep as defined in `models.ts`. Update its base `ActionItem` part according to the proposed changes for `ActionItem` (e.g., `due_date` becomes nullable). Rename camelCase fields (`contactId`, `contactName`, etc.) to snake_case (`contact_id`, `contact_name`, `event_id`, `event_title`) for consistency if desired, although this might just be a UI-level transformation type. Let's keep it as is for now but be mindful during component refactoring.

---

**Next Step:** Please review this analysis, particularly the proposed sources of truth and the handling of discrepancies (especially for Contact and Note types). Let me know if you agree or want to make adjustments before I proceed to Phase 2 (applying fixes based on these decisions). 