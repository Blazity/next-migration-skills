import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { logError, readErrors, resolveError } from "../../skills/nextjs-migration-toolkit/src/state/errors.js";

describe("errors", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "errors-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("readErrors returns empty array for non-existent log", () => {
    expect(readErrors(tmpDir)).toEqual([]);
  });

  it("logError creates the file and adds an error with auto-generated id and timestamp", () => {
    logError(tmpDir, {
      phase: "analysis",
      message: "Something went wrong",
      severity: "error",
    });

    const errors = readErrors(tmpDir);
    expect(errors).toHaveLength(1);
    expect(errors[0].id).toBeDefined();
    expect(errors[0].timestamp).toBeDefined();
    expect(errors[0].resolved).toBe(false);
    expect(errors[0].phase).toBe("analysis");
    expect(errors[0].message).toBe("Something went wrong");
    expect(errors[0].severity).toBe("error");
  });

  it("logError appends multiple errors", () => {
    logError(tmpDir, { phase: "analysis", message: "first", severity: "warning" });
    logError(tmpDir, { phase: "transform", message: "second", severity: "info" });
    logError(tmpDir, { phase: "validate", message: "third", severity: "error", file: "app.tsx" });

    const errors = readErrors(tmpDir);
    expect(errors).toHaveLength(3);
    expect(errors[0].message).toBe("first");
    expect(errors[1].message).toBe("second");
    expect(errors[2].message).toBe("third");
    expect(errors[2].file).toBe("app.tsx");
  });

  it("resolveError marks the correct error as resolved", () => {
    logError(tmpDir, { phase: "analysis", message: "fixable", severity: "warning" });
    logError(tmpDir, { phase: "analysis", message: "stays", severity: "error" });

    const before = readErrors(tmpDir);
    const targetId = before[0].id!;

    resolveError(tmpDir, targetId);

    const after = readErrors(tmpDir);
    expect(after[0].resolved).toBe(true);
    expect(after[1].resolved).toBe(false);
  });

  it("resolveError with non-existent id does nothing", () => {
    logError(tmpDir, { phase: "analysis", message: "safe", severity: "info" });

    resolveError(tmpDir, "non-existent-id");

    const errors = readErrors(tmpDir);
    expect(errors).toHaveLength(1);
    expect(errors[0].resolved).toBe(false);
  });
});
