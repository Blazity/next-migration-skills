---
name: validation-testing
description: Verify correctness of migrated Next.js App Router code after each migration phase
---

# Validation & Testing

Run comprehensive validation checks on migrated code to ensure correctness and catch common migration issues.

## Toolkit Setup

```bash
TOOLKIT_DIR="$(cd "$(dirname "$SKILL_PATH")/../.." && pwd)"
cd "$TOOLKIT_DIR" && bash scripts/setup.sh >/dev/null
```

## Steps

### 1. Run Migration Validator

```bash
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" validate <appDir>
```

This checks for:
- No `next/router` imports in app/ files (must use `next/navigation`)
- No old data-fetching exports (getStaticProps, getServerSideProps, etc.)
- Missing `'use client'` directives on files using client features
- Orphaned files not following App Router conventions

### 2. Check Import Consistency

For each migrated file:
```bash
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" transform imports <file> --dry-run
```

Verify all imports use App Router-compatible modules.

### 3. Check Router Usage

For each migrated file:
```bash
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" transform router <file>
```

Verify no breaking router patterns remain (router.query, router.pathname, router.events, etc.).

### 4. Verify Build

Run the Next.js build to catch compilation errors:
```bash
npx next build
```

Common build errors after migration:
- Type errors from changed APIs
- Missing exports (generateStaticParams, metadata)
- Client/server boundary violations

### 5. Run Existing Tests

```bash
npm test
```

If tests exist, run them to verify behavior is preserved. Common test failures:
- Router mocking needs updating (next/router → next/navigation)
- Data fetching tests need restructuring
- Component render tests may need `'use client'` handling

### 6. Manual Smoke Test Checklist

Verify in the browser:
- [ ] All routes render without errors
- [ ] Navigation between pages works
- [ ] Dynamic routes resolve correctly
- [ ] Data fetching produces correct data
- [ ] Client-side interactions work (forms, buttons, modals)
- [ ] API routes respond correctly
- [ ] Images load properly
- [ ] Metadata/SEO tags are present

### 7. Report Results

Generate a validation report summarizing:
- Validator results (pass/fail per rule)
- Build status
- Test results
- Remaining manual checks

Save to `.migration/validation-report.md`.
