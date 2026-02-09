import { describe, it, expect } from "vitest";
import path from "node:path";
import { analyzeDependencies } from "../../src/ast/analyzers/dependency-graph.js";

const FIXTURE_PKG = path.resolve("tests/fixtures/input/package.json");

describe("analyzeDependencies", () => {
  it("classifies replaceable packages from known-replacements", () => {
    const result = analyzeDependencies(FIXTURE_PKG);
    const nextSeo = result.dependencies.find((d) => d.name === "next-seo");
    expect(nextSeo).toBeDefined();
    expect(nextSeo!.classification).toBe("replaceable");
    expect(nextSeo!.replacement).toBe("@next/metadata");
  });

  it("classifies core packages", () => {
    const result = analyzeDependencies(FIXTURE_PKG);
    const react = result.dependencies.find((d) => d.name === "react");
    expect(react).toBeDefined();
    expect(react!.classification).toBe("core");
  });

  it("classifies unknown packages for manual review", () => {
    const result = analyzeDependencies(FIXTURE_PKG);
    const axios = result.dependencies.find((d) => d.name === "axios");
    expect(axios).toBeDefined();
    expect(axios!.classification).toBe("unknown");
  });

  it("classifies dev tools", () => {
    const result = analyzeDependencies(FIXTURE_PKG);
    const ts = result.dependencies.find((d) => d.name === "typescript");
    expect(ts).toBeDefined();
    expect(ts!.classification).toBe("devTool");
    const types = result.dependencies.find((d) => d.name === "@types/react");
    expect(types).toBeDefined();
    expect(types!.classification).toBe("devTool");
  });

  it("provides accurate summary counts", () => {
    const result = analyzeDependencies(FIXTURE_PKG);
    expect(result.summary.total).toBeGreaterThan(0);
    expect(result.summary.core).toBe(3);
    expect(result.summary.replaceable).toBeGreaterThanOrEqual(3);
  });
});
