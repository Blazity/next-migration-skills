import { describe, it, expect } from "vitest";
import path from "node:path";
import { extractRoutes } from "../../src/ast/analyzers/route-extractor.js";
import { inventoryComponents } from "../../src/ast/analyzers/component-inventory.js";
import { analyzeDependencies } from "../../src/ast/analyzers/dependency-graph.js";
import { analyzeConfig } from "../../src/ast/transforms/config.js";
import { validateMigration } from "../../src/ast/analyzers/migration-validator.js";

const FIXTURES = path.resolve("tests/fixtures/input");

describe("full analysis pipeline", () => {
  it("route analysis returns complete summary", () => {
    const result = extractRoutes(`${FIXTURES}/pages`);

    expect(result.summary.total).toBeGreaterThanOrEqual(3);
    expect(result.routes.some((r) => r.type === "static")).toBe(true);
    expect(result.routes.some((r) => r.type === "dynamic")).toBe(true);
    expect(result.routes.some((r) => r.type === "api")).toBe(true);
    expect(result.summary.withGetStaticProps).toBeGreaterThanOrEqual(1);
  });

  it("component inventory classifies client and server", () => {
    const result = inventoryComponents(`${FIXTURES}/components`);

    expect(result.summary.total).toBe(2);
    expect(result.summary.client).toBeGreaterThanOrEqual(1);
    expect(result.summary.server).toBeGreaterThanOrEqual(1);

    const header = result.components.find((c) => c.name === "Header");
    expect(header?.classification).toBe("client");
    expect(header?.clientIndicators.length).toBeGreaterThan(0);

    const footer = result.components.find((c) => c.name === "Footer");
    expect(footer?.classification).toBe("server");
  });

  it("dependency analysis classifies all categories", () => {
    const result = analyzeDependencies(`${FIXTURES}/package.json`);

    expect(result.summary.total).toBeGreaterThan(0);
    expect(result.summary.core).toBeGreaterThanOrEqual(1);
    expect(result.summary.replaceable).toBeGreaterThanOrEqual(1);
    expect(result.summary.unknown).toBeGreaterThanOrEqual(1);
    expect(result.summary.devTool).toBeGreaterThanOrEqual(1);
  });

  it("config analysis detects issues", () => {
    const result = analyzeConfig(`${FIXTURES}/next.config.js`);

    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.some((i) => i.severity === "error")).toBe(true);
    expect(result.issues.some((i) => i.property === "i18n")).toBe(true);
  });

  it("migration validator catches errors in app dir", () => {
    const result = validateMigration(`${FIXTURES}/app`);

    expect(result.summary.passed).toBe(false);
    expect(result.issues.some((i) => i.severity === "error")).toBe(true);
  });

  it("full pipeline produces coherent cross-analysis results", () => {
    const routes = extractRoutes(`${FIXTURES}/pages`);
    const components = inventoryComponents(`${FIXTURES}/components`);
    const deps = analyzeDependencies(`${FIXTURES}/package.json`);
    const config = analyzeConfig(`${FIXTURES}/next.config.js`);
    const validation = validateMigration(`${FIXTURES}/app`);

    // All analyzers return structured data
    expect(routes.routes).toBeInstanceOf(Array);
    expect(components.components).toBeInstanceOf(Array);
    expect(deps.dependencies).toBeInstanceOf(Array);
    expect(config.issues).toBeInstanceOf(Array);
    expect(validation.issues).toBeInstanceOf(Array);

    // Cross-check: routes with data fetching need migration
    const routesWithDataFetching = routes.routes.filter(
      (r) => r.dataFetching.length > 0
    );
    expect(routesWithDataFetching.length).toBeGreaterThan(0);

    // Cross-check: client components should have indicators
    const clientComponents = components.components.filter(
      (c) => c.classification === "client"
    );
    for (const comp of clientComponents) {
      expect(comp.clientIndicators.length).toBeGreaterThan(0);
    }
  });
});
