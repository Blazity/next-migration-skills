---
name: component-migration
description: >
  Migrate React components for RSC (React Server Component) compatibility.
  Classifies components as client or server based on hooks (useState,
  useEffect, useRouter), event handlers (onClick, onChange, onSubmit),
  and browser APIs (window, document, localStorage). Adds 'use client'
  directives, splits mixed components into server wrapper + client
  interactive parts, and ensures props across the boundary are serializable.
  Use when: adding 'use client', splitting components, handling useState/
  useEffect in server components, fixing RSC boundary errors, migrating
  forms or interactive UI. Keywords: component, client, server, RSC,
  'use client', useState, useEffect, useRouter, onClick, forms, interactive,
  split, boundary, serializable props.
  Related: route-conversion (does this per-route), validation-testing (verify after).
---

# Component Migration

Migrate components for RSC (React Server Component) compatibility. Determine which components need `'use client'` directives and which can remain server components.

## Toolkit Setup

```bash
TOOLKIT_DIR="$(cd "$(dirname "$SKILL_PATH")/../.." && pwd)"
cd "$TOOLKIT_DIR" && bash scripts/setup.sh >/dev/null
```

## Steps

### 1. Inventory All Components

```bash
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" analyze components <srcDir>
```

### 2. Review Classification

For each component classified as "client":
- Review the client indicators (hooks, events, browser APIs)
- Determine if the entire component needs to be client, or if it can be split

### 3. Apply Client Directives

For components that must be client components:
- Add `'use client';` as the first line of the file
- Ensure all imports used by the client component are also client-compatible

### 4. Split Components Where Possible

If a component has both server and client parts:
- Extract the interactive part into a separate client component
- Keep the data-fetching and static rendering in the server component
- Import the client component into the server component

**Example split pattern:**
```
// Before: One component with both data and interactivity
// After:
// - ServerWrapper (server component) — fetches data, renders static parts
// - InteractiveSection (client component) — handles clicks, state, effects
```

### 5. Update Props

```bash
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" analyze props <componentFile>
```

- Ensure props passed from server to client components are serializable
- No functions, classes, or Date objects as props across the boundary
- Convert non-serializable props to serializable alternatives

### 6. Validate Components

```bash
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" validate <appDir>
```

Check that:
- All files using client features have `'use client'`
- No server-only imports in client components
- No `next/router` usage (should be `next/navigation`)
