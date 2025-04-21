# Authentication Code Reorganization Migration Plan

## Overview
This document tracks the migration of authentication-related code to a more organized structure, reducing duplication and improving maintainability.

## Next Tasks (In Order)
1. Page Migration
   - ✓ Migrate login page
   - ✓ Migrate signup page
   - ✓ Migrate confirmation page
   - Implement password reset flow
   - Implement auth callback handling

2. Auth Flow Implementation
   - Password reset flow
   - Email verification flow
   - OAuth callback handling
   - Session recovery
   - Error recovery paths

3. Testing and Validation
   - Unit tests for utilities
   - Integration tests for auth flows
   - Performance benchmarking
   - Security audit
   - Cross-browser testing

## Directory Structure Target
```
src/
  ├── features/
  │   └── auth/
  │       ├── components/
  │       │   ├── LoginForm.tsx
  │       │   ├── SignupForm.tsx
  │       │   ├── ConfirmationForm.tsx
  │       │   ├── GoogleAuthButton.tsx
  │       │   ├── AuthErrorDisplay.tsx
  │       │   ├── LoadingSpinner.tsx
  │       │   ├── LoadingProvider.tsx
  │       │   └── SuspenseBoundary.tsx
  │       ├── pages/
  │       │   ├── login.tsx
  │       │   ├── signup.tsx
  │       │   └── confirmation.tsx
  │       └── utils/
  │           ├── auth-handlers.ts
  │           ├── session-utils.ts
  │           ├── validation.ts
  │           └── error-handlers.ts
  ├── app/
  │   ├── (auth)/
  │   │   ├── layout.tsx
  │   │   ├── login/page.tsx
  │   │   ├── signup/page.tsx
  │   │   └── confirmation/page.tsx
  │   ├── dashboard/
  │   ├── api/
  │   ├── layout.tsx
  │   └── page.tsx
```

## TODO
- [x] Create new directory structure
  - [x] Create features/auth directory and subdirectories
  - [x] Create (auth) group in app directory

- [x] Extract Common Components
  - [x] GoogleAuthButton component
  - [x] AuthErrorDisplay component
  - [x] Form components (Login, Signup, Confirmation)
  - [x] Loading states and suspense boundaries

- [x] Create Utility Functions
  - [x] Authentication handlers
  - [x] Session management utilities
  - [x] Form validation helpers
  - [x] Error handling utilities

- [ ] Migrate Pages (In Progress)
  - [x] Login page
  - [x] Signup page
  - [x] Confirmation page
  - [ ] Password reset flow
  - [ ] Auth callback handling

- [ ] Update Routes and Navigation
  - [x] Update route group structure
  - [ ] Verify all redirects work correctly
  - [ ] Test navigation flows

- [ ] Testing and Validation
  - [ ] Test all auth flows
  - [ ] Verify error handling
  - [ ] Check performance
  - [ ] Validate security measures

## In Progress
- Page migration (Completed basic pages, moving to password reset flow)
- Auth flow implementation (Next up)
- Testing and validation (Planned)

## Completed
- Created initial directory structure
- Extracted GoogleAuthButton component
- Extracted AuthErrorDisplay component
- Created auth-handlers utility with common authentication functions
- Created session management utilities
- Created form validation helpers
- Created error handling utilities
- Created ConfirmationForm component
- Set up route groups
- Implemented loading states and suspense boundaries
  - Created LoadingSpinner component
  - Created LoadingProvider with context
  - Created SuspenseBoundary component
  - Updated ConfirmationForm to use loading components
- Created basic auth pages
  - Login page with form and loading states
  - Signup page with form and loading states
  - Confirmation page with form and loading states
  - Auth group layout with session check

## Notes
- Keep track of any breaking changes
- Document any configuration changes needed
- Note any dependencies that need to be updated

## Migration Steps

### Step 1: Setup Directory Structure ✓
1. Create new directories ✓
2. Move files to temporary location ✓
3. Verify no breaking changes ✓

### Step 2: Component Extraction ✓
1. Identify common patterns ✓
2. Create shared components ✓
3. Update imports ✓
4. Test functionality ✓

### Step 3: Page Migration (In Progress)
1. Create new page components ✓
2. Update imports ✓
3. Test routing
4. Verify functionality

### Step 4: Cleanup
1. Remove duplicate code
2. Update documentation
3. Final testing
4. Remove old files

## Rollback Plan
In case of issues:
1. Keep old files until migration is complete
2. Test thoroughly before removing old code
3. Document any configuration changes
4. Have backup of original structure 