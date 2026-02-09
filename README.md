# Next.js Migration Skills

Agent-oriented toolkit for migrating Next.js from Pages Router to App Router. Built for [Skills.sh](https://skills.sh).

## Install

```bash
npx skills add blazity/next-migration-skills
```

## Skills

| Skill | Purpose |
|-------|---------|
| `nextjs-migration-toolkit` | **Required.** AST analysis and transform tools (ts-morph) used by all other skills |
| `migration-assessment` | Analyze codebase complexity and migration readiness |
| `migration-planning` | Create phased migration plan |
| `dependency-mapping` | Map old deps to App Router equivalents |
| `route-conversion` | Convert pages/ routes to app/ routes |
| `component-migration` | Migrate components for RSC compatibility |
| `data-layer-migration` | Migrate data fetching and API routes |
| `validation-testing` | Verify correctness after each phase |

The `nextjs-migration-toolkit` skill is a dependency for all other skills. When you install all skills, they reference the toolkit as a sibling via `../nextjs-migration-toolkit/`.

## Development

```bash
npm install
npm test
npm run build
```

## Architecture

```
skills/
  nextjs-migration-toolkit/   # AST tools (distributed as a skill)
    src/ast/analyzers/         # Route, component, dependency, dead-code, prop analyzers
    src/ast/transforms/        # Import, data-fetching, router, image, config transforms
    src/ast/utils/             # Parser and output utilities
    src/data/                  # Known replacements and transform rules
    src/state/                 # Progress and error tracking
    src/templates/             # Handlebars templates for App Router files
    scripts/setup.sh           # Dependency installer
    package.json               # Runtime dependencies
  migration-assessment/        # Skill: assess migration readiness
  migration-planning/          # Skill: create phased plan
  dependency-mapping/          # Skill: map deps to App Router equivalents
  route-conversion/            # Skill: convert pages/ to app/ routes
  component-migration/         # Skill: migrate components for RSC
  data-layer-migration/        # Skill: migrate data fetching + API routes
  validation-testing/          # Skill: verify correctness
tests/                         # Unit and integration tests (dev only)
evaluation/                    # Eval framework (dev only)
```
