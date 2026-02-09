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

**Before — mixed component (Pages Router):**
```tsx
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function ProductPage({ product }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
      <button onClick={() => alert(`Added ${qty}`)}>Add to Cart</button>
      <button onClick={() => router.back()}>Back</button>
    </div>
  );
}
```

**After — split into server + client (App Router):**

`app/products/[id]/page.tsx` (server component):
```tsx
import { Metadata } from 'next';
import { ProductActions } from './product-actions';

export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await fetch(`https://api.example.com/products/${params.id}`,
    { cache: 'no-store' }).then(r => r.json());
  return { title: product.name };
}

export default async function ProductPage({ params }) {
  const product = await fetch(`https://api.example.com/products/${params.id}`,
    { cache: 'no-store' }).then(r => r.json());

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <ProductActions />
    </div>
  );
}
```

`app/products/[id]/product-actions.tsx` (client component):
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ProductActions() {
  const router = useRouter();
  const [qty, setQty] = useState(1);

  return (
    <>
      <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
      <button onClick={() => alert(`Added ${qty}`)}>Add to Cart</button>
      <button onClick={() => router.back()}>Back</button>
    </>
  );
}
```

Key points in the split:
- Server component does the data fetching (async, no hooks)
- Client component handles all interactivity (useState, onClick, useRouter)
- `useRouter` import changes from `next/router` to `next/navigation`
- Props passed across the boundary must be serializable (no functions or Date objects)

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

## Common Pitfalls

### "You're importing a component that needs useState"
**Error**: `It only works in a Client Component but none of its parents are marked with "use client"`
**Cause**: A server component imports a component that uses hooks/events, but neither file has `'use client'`.
**Fix**: Add `'use client'` to the component that uses the hook — NOT to the page that imports it. The directive marks the boundary; everything imported by a client component is also client.

### Adding 'use client' too broadly
**Wrong**: Adding `'use client'` to a page component just because it imports one interactive child.
**Right**: Add `'use client'` only to the interactive component. Keep the page as a server component and import the client component into it.
**Rule of thumb**: Push `'use client'` as deep as possible in the component tree.

### Passing non-serializable props across the boundary
**Error**: `Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server"`
**Cause**: A server component passes a function, Date object, or class instance as a prop to a client component.
**Fix**: Convert to serializable alternatives:
- Functions → Use server actions (`'use server'`) or pass data and let the client component create its own handlers
- Date objects → Pass as ISO string, parse in client
- Class instances → Pass as plain object

### The "children" pattern for mixing server + client
When a client component needs to render server content, use the children pattern:
```tsx
// layout.tsx (server component)
import { ClientShell } from './client-shell';
import { ServerContent } from './server-content';

export default function Layout() {
  return (
    <ClientShell>
      <ServerContent />   {/* Server component passed as children */}
    </ClientShell>
  );
}
```
This works because `children` is a React node (serializable), not a component reference.
