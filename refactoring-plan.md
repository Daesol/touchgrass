# Refactoring Plan for TouchGrass Application

## Current Issues

1. **Duplicate Supabase Client Implementations**
   - Old files: `supabase.ts` and `supabase-server.ts`
   - New files in `lib/supabase/` directory

2. **Inconsistent Auth Logic**
   - Complex cookie handling spread across multiple files
   - Redundant session management in different components

3. **Monolithic Middleware**
   - Nearly 400 lines with multiple responsibilities
   - Complex routing and auth logic mixed together

4. **Unorganized API Structure**
   - API routes scattered without clear organization
   - Inconsistent error handling patterns

5. **Inconsistent Project Structure**
   - Many top-level directories without clear organization
   - Mix of feature modules and technical layers

## Proposed Architecture

### 1. Core Layers

```
src/
├── core/                    # Core application code
│   ├── auth/                # Authentication related code
│   │   ├── clients/         # Auth clients (browser, server)
│   │   ├── hooks/           # Auth related hooks
│   │   ├── middleware/      # Auth middleware logic
│   │   └── utils/           # Auth utilities
│   ├── api/                 # API utilities and shared logic
│   │   ├── middlewares/     # API middleware functions
│   │   ├── error-handling/  # Centralized error handling
│   │   └── response/        # Response formatting utilities
│   └── db/                  # Database related code
│       ├── schema/          # Database schema/types
│       ├── clients/         # DB clients (browser, server)
│       └── queries/         # Reusable database queries
```

### 2. Feature Modules

```
src/
├── features/               # Feature modules
│   ├── events/             # Events feature
│   │   ├── api/            # Events API routes
│   │   ├── components/     # Event-related components
│   │   ├── hooks/          # Event-related hooks
│   │   └── actions/        # Event-related server actions
│   ├── contacts/           # Contacts feature
│   │   ├── api/            # Contacts API routes
│   │   ├── components/     # Contact-related components
│   │   ├── hooks/          # Contact-related hooks
│   │   └── actions/        # Contact-related server actions
│   └── profile/            # User profile feature
│       ├── api/            # Profile API routes
│       ├── components/     # Profile-related components
│       ├── hooks/          # Profile-related hooks
│       └── actions/        # Profile-related server actions
```

### 3. Shared UI Components

```
src/
├── components/             # Shared UI components
│   ├── layout/             # Layout components
│   ├── ui/                 # UI primitives
│   └── common/             # Common composite components
```

### 4. App Directory (Next.js)

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (thin wrappers around feature APIs)
│   │   ├── auth/           # Auth API routes
│   │   ├── events/         # Events API routes
│   │   └── contacts/       # Contacts API routes
│   ├── dashboard/          # Dashboard routes
│   ├── login/              # Login route
│   └── signup/             # Signup route
```

### 5. Refactoring Priorities

1. **Authentication Layer**
   - Consolidate Supabase clients
   - Simplify cookie management
   - Extract middleware auth logic

2. **API Structure**
   - Use feature-based organization for API routes
   - Standardize error handling
   - Implement consistent response formats

3. **Database Access**
   - Remove SupabaseProvider in favor of React hooks
   - Simplify database operations

4. **Feature Modules**
   - Reorganize code by domain feature
   - Separate UI, data, and business logic

5. **Middleware**
   - Split middleware into smaller, focused middlewares
   - Simplify routing and error handling 