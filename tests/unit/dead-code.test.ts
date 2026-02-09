import { describe, it, expect } from "vitest";
import path from "node:path";
import { detectDeadExports } from "../../skills/nextjs-migration-toolkit/src/ast/analyzers/dead-code.js";

const FIXTURES = path.resolve("tests/fixtures/input/lib");

describe("detectDeadExports", () => {
  it("detects exports that are not imported anywhere", () => {
    const result = detectDeadExports(FIXTURES);
    const deadNames = result.deadExports.map((d) => d.exportName);
    expect(deadNames).toContain("unusedHelper");
    expect(deadNames).toContain("UNUSED_CONSTANT");
  });

  it("does not flag exports that are imported", () => {
    const result = detectDeadExports(FIXTURES);
    const deadNames = result.deadExports.map((d) => d.exportName);
    expect(deadNames).not.toContain("usedHelper");
    expect(deadNames).not.toContain("USED_CONSTANT");
  });

  it("provides accurate summary", () => {
    const result = detectDeadExports(FIXTURES);
    expect(result.summary.deadExports).toBeGreaterThanOrEqual(2);
    expect(result.summary.totalExports).toBeGreaterThanOrEqual(4);
  });
});
