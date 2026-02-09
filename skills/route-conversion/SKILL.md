---
name: route-conversion
description: Convert Next.js pages/ routes to app/ routes including file structure, data fetching, and metadata
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

Based on the data-fetching analysis:

**getStaticProps → Server Component**
- Remove the getStaticProps export
- Move data fetching directly into the component body (async server component)
- Use `fetch()` with `{ cache: 'force-cache' }` or `{ next: { revalidate: N } }`

**getServerSideProps → Server Component**
- Remove the getServerSideProps export
- Move data fetching into the component body
- Use `fetch()` with `{ cache: 'no-store' }`

**getStaticPaths → generateStaticParams**
- Convert to `export async function generateStaticParams()`
- Return array of param objects instead of paths array

### 4. Extract Metadata

If the page uses `next/head` or `next-seo`:
- Extract title, description, og tags
- Create `export const metadata: Metadata = { ... }` or `export async function generateMetadata()`
- Remove the Head/NextSeo component usage

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
