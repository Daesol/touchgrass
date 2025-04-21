# Directory Structure and Migration Plan

## Current Structure

```
src/
├── app/
│   └── (auth)/                 # New auth group
│       ├── login/             # New login page
│       ├── signup/            # New signup page
│       └── confirmation/      # New confirmation page
├── components/                # Old components directory
│   └── logout-button.tsx     # Moved to features/auth/components
├── contexts/                  # Old contexts directory (removed)
└── features/
    └── auth/                 # New auth feature directory
        ├── app/              # Auth-related pages and routes
        │   ├── callback/     # Auth callback route
        │   ├── callback-processing/ # Callback processing page
        │   └── error/        # Error handling page
        ├── components/       # Auth-related components
        │   └── LogoutButton.tsx
        ├── contexts/        # Auth-related contexts
        │   └── SupabaseProvider.tsx
        └── utils/           # Auth-related utilities
            └── auth-handlers.ts
```

## Migration Status

### Completed
- [x] Created new auth feature directory structure
- [x] Migrated auth handlers to features/auth/utils
- [x] Migrated LogoutButton to features/auth/components
- [x] Migrated SupabaseProvider to features/auth/contexts
- [x] Created new auth group pages (login, signup, confirmation)
- [x] Migrated callback processing logic
- [x] Migrated auth error handling
- [x] Removed old contexts directory
- [x] Updated imports to use correct paths in new files
- [x] Removed old auth directory
- [x] Updated all callback and redirect URLs to use new paths

### In Progress
- [ ] Test all auth flows with new structure

### To Do
- [ ] Clean up any unused imports or dependencies
- [ ] Update documentation to reflect new structure

## Verification Checklist
- [ ] All components render without errors
- [ ] Authentication flows work as expected
- [ ] No duplicate functionality exists
- [x] All imports are updated to new paths
- [x] No references to old file locations remain
- [ ] Tests pass with new structure

## Files Migrated and Removed
1. ✅ src/app/auth/callback-processing/page.tsx → src/features/auth/app/callback-processing/page.tsx
2. ✅ src/app/auth/callback/route.ts → src/features/auth/app/callback/route.ts
3. ✅ src/app/auth/auth-error/page.tsx → src/features/auth/app/error/page.tsx
4. ✅ src/contexts/SupabaseProvider.tsx → src/features/auth/contexts/SupabaseProvider.tsx
5. ✅ src/components/logout-button.tsx → src/features/auth/components/LogoutButton.tsx

## Backup Location
- All original files backed up to: src/backup/auth/

## Next Steps
1. Test the authentication flows:
   - Email signup and confirmation
   - Email login
   - OAuth login (Google)
   - Password reset
   - Logout

2. Clean up:
   - Remove any unused imports
   - Update remaining documentation
   - Remove backup directory after successful testing 