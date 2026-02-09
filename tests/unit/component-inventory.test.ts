import { describe, it, expect } from "vitest";
import path from "node:path";
import { inventoryComponents } from "../../src/ast/analyzers/component-inventory.js";

const FIXTURES = path.resolve("tests/fixtures/input/components");

describe("inventoryComponents", () => {
  it("detects client-only components with hooks and events", () => {
    const result = inventoryComponents(FIXTURES);
    const header = result.components.find((c) => c.name === "Header");
    expect(header).toBeDefined();
    expect(header!.classification).toBe("client");
    expect(header!.clientIndicators).toContain("useState");
    expect(header!.clientIndicators).toContain("useEffect");
    expect(header!.clientIndicators).toContain("useRouter");
    expect(header!.clientIndicators).toContain("onClick");
  });

  it("detects server-compatible components", () => {
    const result = inventoryComponents(FIXTURES);
    const footer = result.components.find((c) => c.name === "Footer");
    expect(footer).toBeDefined();
    expect(footer!.classification).toBe("server");
    expect(footer!.clientIndicators).toHaveLength(0);
  });

  it("provides accurate summary counts", () => {
    const result = inventoryComponents(FIXTURES);
    expect(result.summary.total).toBe(2);
    expect(result.summary.client).toBe(1);
    expect(result.summary.server).toBe(1);
  });

  it("detects use client directive", () => {
    const result = inventoryComponents(FIXTURES);
    const header = result.components.find((c) => c.name === "Header");
    expect(header!.hasClientDirective).toBe(true);
    expect(header!.clientIndicators).toContain("use client");
  });

  it("reports withClientDirective in summary", () => {
    const result = inventoryComponents(FIXTURES);
    expect(result.summary.withClientDirective).toBe(1);
  });
});
