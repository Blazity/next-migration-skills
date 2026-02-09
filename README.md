# Next.js Migration Skills

Agent-oriented toolkit for migrating Next.js from Pages Router to App Router. Built for [Skills.sh](https://skills.sh).

## Install

```bash
npx skills add org/next-migration-skills
```

## Skills

| Skill | Purpose |
|-------|---------|
| `migration-assessment` | Analyze codebase complexity and migration readiness |
| `migration-planning` | Create phased migration plan |
| `dependency-mapping` | Map old deps to App Router equivalents |
| `route-conversion` | Convert pages/ routes to app/ routes |
| `component-migration` | Migrate components for RSC compatibility |
| `data-layer-migration` | Migrate data fetching and API routes |
| `validation-testing` | Verify correctness after each phase |

## Development

```bash
npm install
npm test
npm run build
```

## Architecture

- `skills/` — Agent skill files (SKILL.md format)
- `src/ast/analyzers/` — Route, component, dependency, dead-code, prop analyzers
- `src/ast/transforms/` — Import, data-fetching, router, image, config transforms
- `src/ast/utils/` — Parser and output utilities
- `src/data/` — Known replacements and transform rules
- `src/state/` — Progress and error tracking
- `src/templates/` — Handlebars templates for App Router files
