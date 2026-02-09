import { describe, it, expect } from "vitest";
import path from "node:path";
import { analyzeConfig } from "../../../skills/nextjs-migration-toolkit/src/ast/transforms/config.js";

const FIXTURE_CONFIG = path.resolve("tests/fixtures/input/next.config.js");

describe("analyzeConfig", () => {
  it("detects i18n as an error", () => {
    const result = analyzeConfig(FIXTURE_CONFIG);
    const i18n = result.issues.find((i) => i.property === "i18n");
    expect(i18n).toBeDefined();
    expect(i18n!.severity).toBe("error");
  });

  it("detects rewrites as a warning", () => {
    const result = analyzeConfig(FIXTURE_CONFIG);
    const rewrites = result.issues.find((i) => i.property === "rewrites");
    expect(rewrites).toBeDefined();
    expect(rewrites!.severity).toBe("warning");
  });

  it("detects redirects as info", () => {
    const result = analyzeConfig(FIXTURE_CONFIG);
    const redirects = result.issues.find((i) => i.property === "redirects");
    expect(redirects).toBeDefined();
    expect(redirects!.severity).toBe("info");
  });

  it("detects custom webpack config", () => {
    const result = analyzeConfig(FIXTURE_CONFIG);
    const webpack = result.issues.find((i) => i.property === "webpack");
    expect(webpack).toBeDefined();
    expect(webpack!.severity).toBe("warning");
  });

  it("provides accurate summary counts", () => {
    const result = analyzeConfig(FIXTURE_CONFIG);
    expect(result.summary.total).toBeGreaterThanOrEqual(4);
    expect(result.summary.errors).toBeGreaterThanOrEqual(1);
    expect(result.summary.warnings).toBeGreaterThanOrEqual(2);
  });
});
