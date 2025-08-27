# @geo-web-app/types

Shared TypeScript types for the Geo Web Application monorepo.

## Overview

This package contains all shared TypeScript type definitions used across the frontend, backend, and playwright packages. By centralizing types here, we ensure type consistency and avoid duplication across the monorepo.

## Structure

```
src/
├── index.ts          # Main exports
├── common.ts         # Common types shared across all packages
├── api.ts           # API types for frontend-backend communication
└── playwright.ts    # Playwright-specific types for scraping
```

## Types

### Common Types (`common.ts`)

- `FormData` - Form data structure for brand analysis requests
- `ApiError` - Standard error response structure
- `TimestampedResponse` - Base interface for responses with timestamps

### API Types (`api.ts`)

- `QuestionsResponse` - Response containing generated questions
- `InitScrapingRequest` - Request to start scraping process
- `InitScrapingResponse` - Response from scraping initialization
- `Report` - Report status and metadata
- `ReportsResponse` - List of reports
- `SSEMessage` - Server-sent event message structure

### Playwright Types (`playwright.ts`)

- `UserParams` - Parameters for scraping operations
- `OutputRecord` - Structure for CSV output records
- `AiOverview` - AI overview response structure
- `Video`, `ListItem`, `TableCell`, `TextBlock`, `Reference` - AI response components

## Usage

### Installation

The package is automatically available in the monorepo workspace. No additional installation is needed.

### Importing Types

```typescript
// Import specific types
import type { FormData, Report } from '@geo-web-app/types';

// Import all types
import type * as Types from '@geo-web-app/types';
```

### Development

```bash
# Build the types package
pnpm types:build

# Watch for changes during development
pnpm types:dev
```

## Adding New Types

1. Add the type definition to the appropriate file in `src/`
2. Export it from the main `index.ts` file
3. Run `pnpm types:build` to rebuild
4. The new types will be available in all packages

## Best Practices

- Keep types focused and specific to their domain
- Use descriptive names and add JSDoc comments for complex types
- Extend existing types rather than duplicating them
- Use union types and generics where appropriate
- Maintain backward compatibility when possible
