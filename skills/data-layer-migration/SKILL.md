---
name: data-layer-migration
description: Migrate data fetching patterns and API routes from Pages Router to App Router patterns
---

# Data Layer Migration

Migrate data-fetching patterns (getStaticProps, getServerSideProps, getStaticPaths) and API routes to App Router equivalents.

## Toolkit Setup

```bash
TOOLKIT_DIR="$(cd "$(dirname "$SKILL_PATH")/../.." && pwd)"
cd "$TOOLKIT_DIR" && bash scripts/setup.sh >/dev/null
```

## Steps

### 1. Analyze Data Fetching Patterns

```bash
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" transform data-fetching <sourceFile>
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" analyze routes <pagesDir>
```

### 2. Migrate getStaticProps

For each page using getStaticProps:
- Make the page component `async`
- Move the data fetching logic directly into the component body
- Use `fetch()` with appropriate caching:
  - No revalidate: `{ cache: 'force-cache' }` (default in App Router)
  - With revalidate: `{ next: { revalidate: <seconds> } }`
- Remove the getStaticProps export
- Pass fetched data directly to JSX (no props indirection)

### 3. Migrate getServerSideProps

For each page using getServerSideProps:
- Make the page component `async`
- Move data fetching into the component body
- Use `fetch()` with `{ cache: 'no-store' }`
- For context.params: use the `params` prop passed to page components
- For context.query: use `searchParams` prop
- For cookies/headers: use `cookies()` and `headers()` from `next/headers`

### 4. Migrate getStaticPaths

For each page using getStaticPaths:
- Create `generateStaticParams()` export
- Convert the paths format:
  ```
  // Before: { paths: [{ params: { slug: 'hello' } }], fallback: 'blocking' }
  // After: export function generateStaticParams() { return [{ slug: 'hello' }]; }
  ```
- For `fallback: true/blocking`: App Router handles this automatically with `loading.tsx`

### 5. Migrate API Routes

For each API route in pages/api/:
- Create corresponding route.ts in app/api/
- Convert handler functions to named exports (GET, POST, PUT, DELETE, PATCH)
- Replace `req`/`res` with `NextRequest`/`NextResponse`:
  ```
  // Before: function handler(req: NextApiRequest, res: NextApiResponse)
  // After: export async function GET(request: NextRequest)
  ```
- Use `request.json()` instead of `req.body`
- Return `NextResponse.json()` instead of `res.json()`

### 6. Validate Data Layer

```bash
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" validate <appDir>
```

Verify no old data-fetching patterns remain in app/ directory.
