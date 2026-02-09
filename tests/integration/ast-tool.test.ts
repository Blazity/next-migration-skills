import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import path from "node:path";

const BIN = "npx tsx src/bin/ast-tool.ts";
const FIXTURES = path.resolve("tests/fixtures/input");

function run(cmd: string): unknown {
  const output = execSync(`${BIN} ${cmd}`, { encoding: "utf-8", cwd: path.resolve(".") });
  return JSON.parse(output);
}

describe("ast-tool CLI", () => {
  it("analyze routes outputs valid JSON", () => {
    const result = run(`analyze routes ${FIXTURES}/pages`) as { routes: unknown[]; summary: { total: number } };
    expect(result.summary.total).toBeGreaterThanOrEqual(3);
    expect(result.routes).toBeInstanceOf(Array);
  });

  it("analyze dependencies outputs valid JSON", () => {
    const result = run(`analyze dependencies ${FIXTURES}/package.json`) as { summary: { total: number } };
    expect(result.summary.total).toBeGreaterThan(0);
  });

  it("analyze dead-code outputs valid JSON", () => {
    const result = run(`analyze dead-code ${FIXTURES}/lib`) as { summary: { deadExports: number } };
    expect(result.summary.deadExports).toBeGreaterThanOrEqual(2);
  });

  it("validate outputs valid JSON", () => {
    const result = run(`validate ${FIXTURES}/app`) as { summary: { total: number; passed: boolean } };
    expect(result.summary.passed).toBe(false);
    expect(result.summary.total).toBeGreaterThanOrEqual(1);
  });
});
