import { Node } from "ts-morph";
import { createProject, parseDirectory } from "../utils/parser.js";

interface ValidationIssue {
  filePath: string;
  line: number;
  rule: string;
  severity: "error" | "warning";
  message: string;
}

interface ValidationResult {
  issues: ValidationIssue[];
  filesChecked: number;
  summary: {
    total: number;
    errors: number;
    warnings: number;
    passed: boolean;
  };
}

const OLD_DATA_FETCHING = new Set(["getStaticProps", "getServerSideProps", "getStaticPaths", "getInitialProps"]);

export function validateMigration(appDir: string): ValidationResult {
  const project = createProject();
  const sourceFiles = parseDirectory(project, appDir);
  const issues: ValidationIssue[] = [];

  for (const sf of sourceFiles) {
    const filePath = sf.getFilePath();

    // Rule: no-next-router — app/ files should not import from next/router
    for (const decl of sf.getImportDeclarations()) {
      if (decl.getModuleSpecifierValue() === "next/router") {
        issues.push({
          filePath,
          line: decl.getStartLineNumber(),
          rule: "no-next-router",
          severity: "error",
          message: "Import from 'next/router' is not compatible with App Router. Use 'next/navigation' instead.",
        });
      }
    }

    // Rule: no-old-data-fetching — no getStaticProps etc. in app/ files
    for (const fn of sf.getFunctions()) {
      const name = fn.getName();
      if (name && OLD_DATA_FETCHING.has(name) && fn.isExported()) {
        issues.push({
          filePath,
          line: fn.getStartLineNumber(),
          rule: "no-old-data-fetching",
          severity: "error",
          message: `'${name}' is not supported in App Router. Use server components or route handlers.`,
        });
      }
    }

    // Rule: client-directive-check — if file uses hooks/events, it should have 'use client'
    const hasClientDirective = (() => {
      const stmts = sf.getStatements();
      if (stmts.length === 0) return false;
      const first = stmts[0];
      if (Node.isExpressionStatement(first)) {
        const expr = first.getExpression();
        if (Node.isStringLiteral(expr) && expr.getLiteralValue() === "use client") {
          return true;
        }
      }
      return false;
    })();

    if (!hasClientDirective) {
      const text = sf.getFullText();
      const usesClientFeatures =
        /\buseState\b/.test(text) ||
        /\buseEffect\b/.test(text) ||
        /\buseRef\b/.test(text) ||
        /\bonClick\b/.test(text) ||
        /\bonChange\b/.test(text) ||
        /\bonSubmit\b/.test(text);

      if (usesClientFeatures) {
        issues.push({
          filePath,
          line: 1,
          rule: "missing-client-directive",
          severity: "warning",
          message: "File uses client-side features but is missing 'use client' directive.",
        });
      }
    }
  }

  issues.sort((a, b) => a.filePath.localeCompare(b.filePath) || a.line - b.line);

  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;

  return {
    issues,
    filesChecked: sourceFiles.length,
    summary: {
      total: issues.length,
      errors,
      warnings,
      passed: errors === 0,
    },
  };
}
