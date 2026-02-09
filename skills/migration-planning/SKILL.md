---
name: migration-planning
description: >
  Use when planning the order and phases of a Next.js Pages-to-App Router
  migration, scheduling migration work, or deciding what to migrate first.
  Requires migration-assessment first.
---

# Migration Planning

Create a detailed, phased migration plan based on the assessment data. The plan prioritizes low-risk routes first and handles dependencies between components.

## Toolkit Setup

```bash
TOOLKIT_DIR="$(cd "$(dirname "$SKILL_PATH")/../.." && pwd)"
cd "$TOOLKIT_DIR" && bash scripts/setup.sh >/dev/null
```

## Prerequisites

Run `migration-assessment` first to generate `.migration/assessment.md`.

## Steps

### 1. Gather Route and Component Data

```bash
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" analyze routes <pagesDir>
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" analyze components <srcDir>
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" analyze dependencies <packageJsonPath>
```

### 2. Classify Routes by Migration Difficulty

Group routes into migration waves:

**Wave 1 — Static pages (lowest risk)**
- Pages with no data fetching
- Pages using only getStaticProps without revalidate
- Server-compatible components only

**Wave 2 — ISR pages**
- Pages with getStaticProps + revalidate
- Pages with getStaticPaths

**Wave 3 — Dynamic pages**
- Pages with getServerSideProps
- Pages requiring client-side features

**Wave 4 — API routes**
- Convert API routes to route handlers
- Handle middleware migration

**Wave 5 — Complex pages**
- Pages with getInitialProps
- Pages with heavy client-side logic
- Pages depending on replaced packages

### 3. Identify Shared Dependencies

For each wave, identify:
- Shared components that need migration first
- Shared layouts that can be extracted
- Packages that need replacement before routes can migrate

### 4. Generate Migration Plan

Create a structured plan document with:
- **Phase 0: Preparation** — Install App Router deps, create app/ directory, set up root layout
- **Phase 1-N: Route waves** — Each wave with specific files to migrate and order
- **Per-route checklist**: Data fetching conversion, import updates, component classification, validation
- **Rollback strategy**: How to revert if issues arise (parallel pages/ and app/ directories)

### 5. Save Plan

Write the plan to `.migration/plan.md` in the target project.
Initialize progress tracking with the state management module.
