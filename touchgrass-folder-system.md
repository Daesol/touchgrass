# TouchGrass Proposed Folder Structure

This document outlines a proposed folder structure for the TouchGrass application, aiming for clarity, maintainability, and scalability following common Next.js conventions.

```plaintext
src/
├── app/                     # Next.js App Router (Pages, Layouts, API Routes)
│   ├── (auth)/              # Route group for auth pages (login, signup, etc.) - Optional grouping
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── confirmation/
│   │       └── page.tsx
│   ├── (main)/              # Route group for main application pages (e.g., dashboard)
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── layout.tsx       # Layout for the main app section
│   ├── api/
│   │   ├── auth/            # API handlers specific to auth
│   │   │   └── [...nextauth].ts # Example if using NextAuth, or specific routes
│   │   ├── events/
│   │   │   └── route.ts
│   │   ├── contacts/
│   │   │   └── route.ts
│   │   ├── notes/
│   │   │   └── route.ts
│   │   ├── profile/
│   │   │   └── route.ts
│   │   └── action-items/
│   │       └── route.ts
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Root page (e.g., landing page)
│   ├── providers.tsx        # Client-side providers (Theme, Auth Context, etc.)
│   └── globals.css          # Global styles
│
├── components/              # Shared UI components
│   ├── ui/                  # Base UI elements (e.g., Button, Input - potentially from Shadcn/UI)
│   ├── common/              # Common application components (e.g., Header, Footer, Sidebar)
│   └── features/            # Components specific to certain features
│       ├── auth/
│       │   ├── LoginForm.tsx
│       │   └── SignupForm.tsx
│       ├── events/
│       │   └── EventCard.tsx
│       └── ... (contacts, notes, profile, etc.)
│
├── lib/                     # Utilities, helpers, and core logic
│   ├── auth.ts              # Auth configuration, helpers (e.g., if using NextAuth)
│   ├── constants.ts         # Application constants
│   ├── db.ts                # Database client setup (e.g., Prisma or Supabase client *instance*)
│   ├── supabase/            # Supabase specific utilities (e.g., client creation functions)
│   │   ├── client.ts        # Browser client factory
│   │   └── server.ts        # Server client factories (middleware, actions, components)
│   ├── utils.ts             # General utility functions
│   └── validators/          # Zod schemas or other validation logic
│
├── contexts/                # React Context providers (if needed beyond src/app/providers.tsx)
│   └── AuthContext.tsx      # Example: if complex auth state needed globally
│
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts
│   └── useDebounce.ts
│
├── services/                # Business logic, external API interactions (optional)
│   ├── eventsService.ts
│   └── contactsService.ts
│
├── actions/                 # Server Actions (grouped by feature)
│   ├── authActions.ts
│   ├── eventActions.ts
│   ├── contactActions.ts
│   └── ...
│
├── styles/                  # Additional global styles or themes
│   └── theme.ts
│
├── types/                   # Shared TypeScript types and interfaces
│   ├── index.ts
│   └── database.types.ts    # Supabase generated types
│
└── middleware.ts            # Root middleware file

---

## Key Principles:

1.  **App Router Centric:** Leverage `src/app` for routing (pages and API routes).
2.  **Component Colocation:**
    *   Shared, reusable UI primitives go in `src/components/ui`.
    *   Broader common components (layout parts) go in `src/components/common`.
    *   Components tightly coupled to a specific feature can live in `src/components/features/[featureName]/`.
3.  **Library (`lib`) for Core Logic:** Utilities, client initializations (like Supabase), constants, and validators reside here. Avoid React components in `lib`.
4.  **Server Actions:** Consolidate server actions in `src/actions`, potentially grouped by feature.
5.  **Contexts/Hooks:** Use for shared state and logic, respectively.
6.  **Services (Optional):** For abstracting complex business logic or external API calls if needed.
7.  **Clear API Routes:** API logic is handled within `src/app/api/`.
8.  **Types:** Centralized type definitions in `src/types`.
9.  **No More `src/features`:** Eliminate the separate `src/features` directory. Feature-specific logic will be organized within the standard directories (`components/features`, `actions`, `app/api`, etc.).
10. **No More `src/core`:** Completely remove the `src/core` directory.
``` 