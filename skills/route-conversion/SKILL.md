---
name: route-conversion
description: >
  Use when converting a specific page from pages/ to app/ directory, or
  migrating a route end-to-end (file structure, data fetching, metadata,
  imports). The main workhorse skill for per-route migration.
---

# Route Conversion

Convert a specific page from pages/ directory to app/ directory, handling data fetching migration, metadata extraction, and file structure changes.

## Toolkit Setup

```bash
TOOLKIT_DIR="$(cd "$(dirname "$SKILL_PATH")/../.." && pwd)"
cd "$TOOLKIT_DIR" && bash scripts/setup.sh >/dev/null
```

## Steps

### 1. Analyze the Source Route

```bash
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" analyze routes <pagesDir>
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" transform data-fetching <sourceFile>
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" transform imports <sourceFile> --dry-run
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" transform router <sourceFile>
```

### 2. Create App Router File Structure

Map the pages/ path to app/ path:
- `pages/index.tsx` → `app/page.tsx`
- `pages/about.tsx` → `app/about/page.tsx`
- `pages/blog/[slug].tsx` → `app/blog/[slug]/page.tsx`
- `pages/api/posts.ts` → `app/api/posts/route.ts`
- `pages/_app.tsx` → `app/layout.tsx` (root layout)
- `pages/_document.tsx` → `app/layout.tsx` (merge into root layout)

### 3. Migrate Data Fetching

Based on the data-fetching analysis, apply the appropriate pattern. See the `data-layer-migration` skill for detailed before/after examples of each pattern.

| Pages Router | App Router |
|-------------|------------|
| `getStaticProps` | Async server component + `fetch()` with `{ cache: 'force-cache' }` |
| `getStaticProps` + revalidate | Async server component + `{ next: { revalidate: N } }` |
| `getServerSideProps` | Async server component + `{ cache: 'no-store' }` |
| `getStaticPaths` | `export async function generateStaticParams()` |

### 4. Extract Metadata

**Before** (using `next/head`):
```tsx
import Head from 'next/head';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About Us</title>
        <meta name="description" content="Learn about our company" />
        <meta property="og:title" content="About Us" />
      </Head>
      <h1>About Us</h1>
    </>
  );
}
```

**After** (using metadata export):
```tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about our company',
  openGraph: { title: 'About Us' },
};

export default function AboutPage() {
  return <h1>About Us</h1>;
}
```

For dynamic metadata (needs params or fetched data), use `generateMetadata`:
```tsx
import { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`).then(r => r.json());
  return { title: post.title, description: post.excerpt };
}
```

Rules:
- Remove all `next/head` imports and `<Head>` usage
- Static metadata → `export const metadata: Metadata`
- Dynamic metadata → `export async function generateMetadata()`
- `next-seo` → replace with the metadata export API

### 5. Update Imports

```bash
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" transform imports <newFile>
```

- Rewrite `next/router` to `next/navigation`
- Remove `next/head` imports
- Update component imports for new file paths

### 6. Validate the Converted Route

```bash
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" validate <appDir>
```

Ensure no validation errors for the converted file.

## Common Pitfalls

### Wrong file naming in app/ directory
**Wrong**: `app/about.tsx` (will not be recognized as a route)
**Right**: `app/about/page.tsx` (every route needs a `page.tsx` inside a folder)
**Exception**: `app/page.tsx` is the root route (replaces `pages/index.tsx`)

### Forgetting the root layout
**Error**: `A required layout.tsx file was not found at root level`
**Fix**: The `app/` directory must have a root `layout.tsx`. Convert `pages/_app.tsx` and `pages/_document.tsx` into:
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Using `router.query` after migration
**Error**: `router.query` is undefined or doesn't exist on the App Router's router.
**Cause**: App Router's `useRouter()` (from `next/navigation`) does not have `.query`. Use `useParams()` for path parameters and `useSearchParams()` for query strings.
**Fix**:
```tsx
// Before (Pages Router)
const { slug, page } = router.query;

// After (App Router)
import { useParams, useSearchParams } from 'next/navigation';
const { slug } = useParams();
const searchParams = useSearchParams();
const page = searchParams.get('page');
```

### Running Pages Router and App Router simultaneously
**Note**: During migration, both `pages/` and `app/` can coexist. But a route must not exist in both directories simultaneously — Next.js will throw a conflict error. Delete the `pages/` version after migrating each route to `app/`.
