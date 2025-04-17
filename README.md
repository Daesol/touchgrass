# TouchGrass Project

## Architecture Overview

This project follows a modular architecture pattern to improve maintainability, scalability, and code organization.

### Directory Structure

```
src/
├── app/                   # Next.js app router pages
├── components/            # React components organized by feature
│   ├── common/            # Common/shared components
│   ├── contacts/          # Contact-related components
│   ├── events/            # Event-related components
│   ├── profile/           # Profile-related components
│   ├── tasks/             # Task-related components
│   ├── theme/             # Theme-related components
│   └── ui/                # UI components (shadcn/ui)
├── data/                  # Data services and API clients
├── features/              # Feature-specific logic
│   ├── contacts/          # Contact feature logic
│   ├── events/            # Event feature logic
│   └── tasks/             # Task feature logic
├── hooks/                 # Custom React hooks
│   ├── api/               # API-related hooks
│   ├── storage/           # Storage-related hooks
│   └── ui/                # UI-related hooks
├── lib/                   # Third-party library configurations
├── styles/                # Global styles
├── types/                 # TypeScript type definitions
│   ├── api/               # API-related types
│   ├── models/            # Domain model types
│   └── ui/                # UI-related types
└── utils/                 # Utility functions
    ├── formatters/        # Formatting utilities
    └── validators/        # Validation utilities
```

### Key Design Principles

1. **Separation of Concerns**: Each module has a clear responsibility
2. **Feature-Based Organization**: Components and logic are organized by feature
3. **Type Safety**: Strong typing throughout the application
4. **Reusability**: Shared utilities and hooks are easily accessible

### Data Flow

1. UI Components use data services via hooks
2. Data services handle state management and data persistence
3. Features encapsulate feature-specific business logic
4. Utilities provide common functionality used across the application

### Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui components 