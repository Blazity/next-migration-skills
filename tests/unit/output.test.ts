import { describe, it, expect } from "vitest";
import { formatJson, formatDiff } from "../../skills/nextjs-migration-toolkit/src/ast/utils/output.js";

describe("formatJson", () => {
  it("serializes data as pretty JSON", () => {
    const result = formatJson({ count: 1, items: ["a"] });
    expect(JSON.parse(result)).toEqual({ count: 1, items: ["a"] });
  });
});

describe("formatDiff", () => {
  it("produces a unified diff between two strings", () => {
    const diff = formatDiff("const x = 1;", "const x = 2;", "test.ts");
    expect(diff).toContain("-const x = 1;");
    expect(diff).toContain("+const x = 2;");
  });

  it("returns empty string for identical content", () => {
    const diff = formatDiff("const x = 1;", "const x = 1;", "test.ts");
    expect(diff).toBe("");
  });
});
