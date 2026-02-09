import { describe, it, expect } from "vitest";
import path from "node:path";
import { validateMigration } from "../../skills/nextjs-migration-toolkit/src/ast/analyzers/migration-validator.js";

const APP_FIXTURES = path.resolve("tests/fixtures/input/app");

describe("validateMigration", () => {
  it("fails on next/router import in app/ files", () => {
    const result = validateMigration(APP_FIXTURES);
    const routerIssue = result.issues.find((i) => i.rule === "no-next-router");
    expect(routerIssue).toBeDefined();
    expect(routerIssue!.severity).toBe("error");
    expect(routerIssue!.filePath).toContain("blog");
  });

  it("passes on clean app/ files", () => {
    const result = validateMigration(APP_FIXTURES);
    const aboutIssues = result.issues.filter((i) => i.filePath.includes("about"));
    expect(aboutIssues).toHaveLength(0);
  });

  it("warns about missing client directive when client features are used", () => {
    const result = validateMigration(APP_FIXTURES);
    const directive = result.issues.find((i) => i.rule === "missing-client-directive");
    expect(directive).toBeDefined();
    expect(directive!.severity).toBe("warning");
  });

  it("provides summary with passed status", () => {
    const result = validateMigration(APP_FIXTURES);
    expect(result.summary.passed).toBe(false);
    expect(result.summary.errors).toBeGreaterThanOrEqual(1);
    expect(result.filesChecked).toBe(2);
  });
});
