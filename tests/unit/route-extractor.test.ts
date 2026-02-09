import path from "node:path";
import { describe, it, expect } from "vitest";
import { extractRoutes } from "../../skills/nextjs-migration-toolkit/src/ast/analyzers/route-extractor.js";

const PAGES_DIR = path.resolve(__dirname, "../fixtures/input/pages");

describe("extractRoutes", () => {
  const result = extractRoutes(PAGES_DIR);

  it("extracts static routes", () => {
    const index = result.routes.find((r) => r.routePath === "/");
    expect(index).toBeDefined();
    expect(index!.type).toBe("static");
    expect(index!.dataFetching).toContain("getStaticProps");
    expect(index!.hasDefaultExport).toBe(true);
  });

  it("extracts dynamic routes", () => {
    const blogSlug = result.routes.find((r) => r.routePath === "/blog/:slug");
    expect(blogSlug).toBeDefined();
    expect(blogSlug!.type).toBe("dynamic");
    expect(blogSlug!.dataFetching).toContain("getStaticProps");
    expect(blogSlug!.dataFetching).toContain("getStaticPaths");
    expect(blogSlug!.hasDefaultExport).toBe(true);
  });

  it("extracts API routes with methods", () => {
    const apiPosts = result.routes.find((r) => r.routePath === "/api/posts");
    expect(apiPosts).toBeDefined();
    expect(apiPosts!.type).toBe("api");
    expect(apiPosts!.apiMethods).toContain("GET");
    expect(apiPosts!.apiMethods).toContain("POST");
    expect(apiPosts!.hasDefaultExport).toBe(true);
  });

  it("provides accurate summary counts", () => {
    expect(result.summary.total).toBe(3);
    expect(result.summary.static).toBe(1);
    expect(result.summary.dynamic).toBe(1);
    expect(result.summary.api).toBe(1);
    expect(result.summary.catchAll).toBe(0);
    expect(result.summary.withGetStaticProps).toBe(2);
    expect(result.summary.withGetServerSideProps).toBe(0);
    expect(result.summary.withGetStaticPaths).toBe(1);
  });
});
