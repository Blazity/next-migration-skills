# Next.js 16 Patterns

These patterns apply when the target Next.js version is 16.x.

## Dynamic APIs (ASYNC — sync access fully removed)

All dynamic APIs are **asynchronous**, same as Next.js 15. The temporary synchronous fallback from 15 has been **completely removed** — async is now the only option.

```tsx
import { cookies, headers, draftMode } from 'next/headers';

// cookies — MUST await (no sync fallback)
const cookieStore = await cookies();
const token = cookieStore.get('token')?.value;

// headers — MUST await
const headersList = await headers();
const userAgent = headersList.get('user-agent');

// draftMode — MUST await
const { isEnabled } = await draftMode();
```

## Page Props (ASYNC — sync access fully removed)

`params` and `searchParams` are **Promises** that MUST be awaited:

```tsx
// Page component — params and searchParams are Promises
export default async function Page(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const slug = params.slug;
  const query = searchParams.q;
  return <div>{slug} — {query}</div>;
}
```

```tsx
// Layout component — params is a Promise
export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ section: string }>;
}) {
  const params = await props.params;
  return <div>{props.children}</div>;
}
```

For client components that cannot be async, use React's `use()`:
```tsx
'use client';
import { use } from 'react';

export default function Page(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  return <div>{params.slug}</div>;
}
```

## Fetch Caching

Same as Next.js 15 — does **NOT cache fetch by default**:

- Default: NOT cached
- For static/cached behavior: `{ cache: 'force-cache' }` explicitly
- For ISR: `{ next: { revalidate: N } }`

## Removed Features (breaking changes from 15)

- **`next/legacy/image`** — REMOVED. Use `next/image` only. Update all imports.
- **AMP support** — REMOVED entirely. Remove all AMP-related config and pages.
- **`next lint` command** — REMOVED. Use ESLint CLI directly: `npx eslint .`
- **Parallel routes** — `default.js` is now REQUIRED for all parallel route slots.

## Requirements

- **Node.js 20.9+** required (Node.js 18 no longer supported)
- **TypeScript 5.1+** required

## Package Version

Update package.json:
```json
"next": "^16.1.0"
```
Then run: `bun install` or `npm install`
