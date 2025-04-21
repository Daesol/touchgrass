# Folder Structure Optimization Plan

## Current Issues

### 1. Duplicate Auth-Related Code
- Auth pages scattered in `src/app/` (`login`, `signup`, `confirmation`, `reset`, `bypass`, `logout`)
- Auth logic in `src/core/auth/`
- Auth features in `src/features/auth/`

### 2. Multiple API Locations
- `src/app/api/`
- `src/core/api/`
- `src/core/auth/api/`

### 3. Backup Files
- `src/backup/auth/` contains migrated files

### 4. Standalone Actions
- `src/actions/events.ts` should be with its feature

## Target Structure

```
src/
├── core/                  # Core utilities and configurations
│   ├── api/              # Core API utilities
│   │   ├── error-handling/
│   │   ├── middlewares/
│   │   └── response/
│   └── db/               # Database utilities
│       ├── clients/
│       ├── queries/
│       └── schema/
└── features/             # Feature-based modules
    ├── auth/             # Authentication feature
    │   ├── app/          # Next.js pages
    │   │   ├── (auth)/   # Auth group
    │   │   │   ├── login/
    │   │   │   ├── signup/
    │   │   │   ├── confirmation/
    │   │   │   ├── reset/
    │   │   │   ├── logout/
    │   │   │   └── bypass/
    │   │   ├── callback/
    │   │   ├── callback-processing/
    │   │   └── error/
    │   ├── components/
    │   ├── contexts/
    │   ├── utils/
    │   └── api/          # Auth-related API routes
    └── events/           # Events feature
        ├── actions/
        │   └── events.ts
        └── [other event-related code]
```

## Migration Steps

### 1. Move Auth Pages (In Progress)
- [ ] Move `src/app/login` → `src/features/auth/app/(auth)/login`
- [ ] Move `src/app/signup` → `src/features/auth/app/(auth)/signup`
- [ ] Move `src/app/confirmation` → `src/features/auth/app/(auth)/confirmation`
- [ ] Move `src/app/reset` → `src/features/auth/app/(auth)/reset`
- [ ] Move `src/app/logout` → `src/features/auth/app/(auth)/logout`
- [ ] Move `src/app/bypass` → `src/features/auth/app/(auth)/bypass`
- [ ] Update import paths in moved files
- [ ] Test all auth flows after migration

### 2. Clean Up API Structure
- [ ] Audit API routes in `src/app/api`
- [ ] Move auth-specific API routes to `src/features/auth/api`
- [ ] Move generic API utilities to `src/core/api`
- [ ] Update import paths

### 3. Move Events Feature
- [ ] Create `src/features/events` directory structure
- [ ] Move `src/actions/events.ts` to `src/features/events/actions`
- [ ] Update import paths

### 4. Clean Up
- [ ] Remove `src/backup/auth` directory
- [ ] Remove empty directories
- [ ] Update documentation
- [ ] Test all features

## Progress Tracking

### Completed
- [x] Initial auth feature migration
- [x] Core API structure setup
- [x] Database utilities organization

### In Progress
- [ ] Moving auth pages to features
- [ ] Updating import paths

### To Do
- [ ] API route organization
- [ ] Events feature migration
- [ ] Final cleanup

## Rollback Plan
1. Keep backup of all files before moving
2. Test each feature after its migration
3. Document all path changes
4. Have restore points ready 