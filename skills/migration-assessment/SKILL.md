---
name: migration-assessment
description: >
  Use when starting a Next.js Pages Router to App Router migration, evaluating
  migration feasibility, or auditing codebase readiness. Run this BEFORE any
  other migration skill.
---

# Migration Assessment

Analyze a Next.js Pages Router codebase to determine migration complexity, identify blockers, and produce a go/no-go recommendation.

## Toolkit Setup

```bash
TOOLKIT_DIR="$(cd "$(dirname "$SKILL_PATH")/../.." && pwd)"
cd "$TOOLKIT_DIR" && bash scripts/setup.sh >/dev/null
```

## Steps

### 1. Gather Codebase Metrics

Run all analyzers to collect data:

```bash
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" analyze routes <pagesDir>
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" analyze components <srcDir>
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" analyze dependencies <packageJsonPath>
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" analyze dead-code <srcDir>
npx tsx "$TOOLKIT_DIR/src/bin/ast-tool.ts" analyze config <nextConfigPath>
```

### 2. Analyze Results

From the JSON output, assess:

- **Route complexity**: Count of dynamic routes, catch-all routes, API routes, and data-fetching patterns (getStaticProps, getServerSideProps, getStaticPaths)
- **Component readiness**: Ratio of server-compatible vs client-only components
- **Dependency risk**: Number of packages needing replacement vs unknown packages
- **Config issues**: Count of errors vs warnings in next.config.js analysis
- **Dead code**: Amount of unused exports that can be cleaned up first

### 3. Calculate Complexity Score

Score from 1-10 based on:
- Routes: 1 point per 10 routes, +2 if >50% use getServerSideProps
- Components: 1 point per 20 client-only components
- Dependencies: 1 point per 3 replaceable packages, +2 per unknown package with no known replacement
- Config: +2 if i18n is configured, +1 per webpack customization
- Scale: 1-3 = Simple, 4-6 = Moderate, 7-10 = Complex

### 4. Produce Assessment Report

Generate a structured report with:
- **Executive summary**: One-paragraph migration readiness overview
- **Complexity score**: Numeric score with breakdown
- **Blockers**: Critical issues that must be resolved before migration
- **Risks**: Non-blocking concerns to monitor
- **Recommendations**: Go/No-go with conditions
- **Estimated effort**: Rough t-shirt sizing (S/M/L/XL) based on score

### 5. Save Assessment

Write the report to `.migration/assessment.md` in the target project.
