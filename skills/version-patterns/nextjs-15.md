# Next.js 15 Patterns

These patterns apply when the target Next.js version is 15.x.

## Dynamic APIs (ASYNC — BREAKING CHANGE from 14)

All dynamic APIs in Next.js 15 are **asynchronous**. You MUST use `await`.

```tsx
import { cookies, headers, draftMode } from 'next/headers';

// cookies — MUST await
const cookieStore = await cookies();
const token = cookieStore.get('token')?.value;

// headers — MUST await
const headersList = await headers();
const userAgent = headersList.get('user-agent');

// draftMode — MUST await
const { isEnabled } = await draftMode();
```

## Page Props (ASYNC — BREAKING CHANGE from 14)

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

Next.js 15 does **NOT cache fetch by default** (changed from 14!):

- Default: NOT cached — every request fetches fresh data
- For static/cached behavior: `{ cache: 'force-cache' }` explicitly
- For ISR: `{ next: { revalidate: N } }`
- For SSR (getServerSideProps replacement): no option needed (default is already dynamic)

## Package Version

Update package.json:
```json
"next": "^15.2.0"
```
Then run: `bun install` or `npm install`
