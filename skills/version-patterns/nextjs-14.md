# Next.js 14 Patterns

These patterns apply when the target Next.js version is 14.x.

## Dynamic APIs (SYNCHRONOUS)

All dynamic APIs in Next.js 14 are **synchronous**. Do NOT use `await`.

```tsx
import { cookies, headers, draftMode } from 'next/headers';

// cookies — NO await
const cookieStore = cookies();
const token = cookieStore.get('token')?.value;

// headers — NO await
const headersList = headers();
const userAgent = headersList.get('user-agent');

// draftMode — NO await
const { isEnabled } = draftMode();
```

## Page Props (SYNCHRONOUS)

`params` and `searchParams` are plain objects, NOT Promises:

```tsx
// Page component — params and searchParams are plain objects
export default function Page({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { q?: string };
}) {
  const slug = params.slug;          // Direct access, no await
  const query = searchParams.q;       // Direct access, no await
  return <div>{slug} — {query}</div>;
}
```

```tsx
// Layout component — params is a plain object
export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { section: string };
}) {
  return <div>{children}</div>;
}
```

## Fetch Caching

Next.js 14 **caches fetch by default** (same as 13.4):

- Default: `{ cache: 'force-cache' }` — cached at build time
- For SSR (getServerSideProps replacement): `{ cache: 'no-store' }`
- For ISR (getStaticProps + revalidate): `{ next: { revalidate: N } }`

## Package Version

Update package.json:
```json
"next": "^14.2.0"
```
Then run: `bun install` or `npm install`
