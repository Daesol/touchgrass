# Implementation Plan for Codebase Refactoring

## Phase 1: Create Core Authentication Layer

### Step 1: Set up Core Directory Structure
```bash
mkdir -p src/core/auth/{clients,hooks,middleware,utils}
mkdir -p src/core/db/{schema,clients,queries}
mkdir -p src/core/api/{middlewares,error-handling,response}
```

### Step 2: Consolidate Supabase Clients
1. Move database types to proper location:
```bash
mv src/lib/database.types.ts src/core/db/schema/database.types.ts
```

2. Create simplified browser client:
```
src/core/auth/clients/browser.ts
```
- Extract core functionality from `src/lib/supabase/browser-client.ts`
- Remove duplicate caching logic
- Implement clean error handling

3. Create simplified server client:
```
src/core/auth/clients/server.ts
```
- Extract core functionality from `src/lib/supabase/server-client.ts`
- Simplify cookie handling
- Create specialized versions for different contexts (server components, server actions, middleware)

4. Create utility for cookie management:
```
src/core/auth/utils/cookies.ts
```
- Extract cookie handling logic from server-client.ts
- Implement clean API for reading/writing cookies
- Handle fragmented cookies with proper caching

### Step 3: Refactor Middleware
1. Extract route configuration:
```
src/core/auth/middleware/routes.ts
```
- Move route definitions from middleware.ts
- Create clean API for route matching

2. Extract authentication logic:
```
src/core/auth/middleware/auth.ts
```
- Move authentication logic from middleware.ts
- Create clean API for auth checks

3. Create middleware composition system:
```
src/core/auth/middleware/index.ts
```
- Allow composing multiple middleware functions
- Implement proper error handling

4. Create new middleware.ts file:
```
src/middleware.ts
```
- Import and use the middleware components from core
- Keep the file small and focused

## Phase 2: Implement Feature-based Structure

### Step 1: Create Feature Modules
```bash
mkdir -p src/features/{events,contacts,profile}/{api,components,hooks,actions}
```

### Step 2: Migrate Events Feature
1. Move events API logic:
```bash
mv src/app/api/events/route.ts src/features/events/api/route.ts
```
- Refactor to use new Supabase clients

2. Move events server actions:
```bash
mv src/actions/events.ts src/features/events/actions/index.ts
```
- Refactor to use new Supabase clients

3. Move event-related components to feature folder

### Step 3: Migrate Contacts Feature
1. Move contacts API logic:
```bash
mv src/app/api/contacts/route.ts src/features/contacts/api/route.ts
```
- Refactor to use new Supabase clients

2. Create contact-related server actions
3. Move contact-related components to feature folder

### Step 4: Migrate Profile Feature
1. Move profile API logic:
```bash
mv src/app/api/profile/route.ts src/features/profile/api/route.ts
```
- Refactor to use new Supabase clients

2. Create profile-related server actions
3. Move profile-related components to feature folder

## Phase 3: Implement React Hooks Instead of Context

### Step 1: Create Auth Hooks
```
src/core/auth/hooks/useAuth.ts
```
- Simplified authentication hooks to replace SupabaseProvider

### Step 2: Create DB Hooks for Each Entity
```
src/features/events/hooks/useEvents.ts
src/features/contacts/hooks/useContacts.ts
src/features/profile/hooks/useProfile.ts
```
- Entity-specific data hooks to replace SupabaseProvider methods

### Step 3: Refactor Components to Use Hooks
- Replace SupabaseProvider usage with hooks
- Update components to use the new data pattern

## Phase 4: Standardize API Structure and Error Handling

### Step 1: Create Standard Response Utilities
```
src/core/api/response/index.ts
```
- Standardized success/error response formatters
- Consistent error codes and messages

### Step 2: Create Error Handling Utilities
```
src/core/api/error-handling/index.ts
```
- Centralized error handling
- Proper error logging and formatting

### Step 3: Update API Routes
- Implement thin wrappers in app/api that use feature-based API handlers
- Use consistent error handling and response formats

## Phase 5: Clean Up and Migration Completion

### Step 1: Remove Legacy Files
```bash
rm src/lib/supabase.ts
rm src/lib/supabase-server.ts
rm -rf src/lib/supabase
rm src/contexts/SupabaseProvider.tsx
```

### Step 2: Update Imports
- Search for all imports of old files and update them
- Fix any broken references

### Step 3: Testing and Verification
- Test authentication flows
- Test database operations
- Verify API functionality

## Migration Order

This plan prioritizes:
1. Auth infrastructure (most critical)
2. Data access patterns
3. Feature organization
4. API standardization
5. Cleanup

Focus on making incremental changes that can be tested at each step rather than refactoring everything at once. 