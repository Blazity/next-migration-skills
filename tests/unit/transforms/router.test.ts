import { describe, it, expect } from "vitest";
import { transformRouter } from "../../../skills/nextjs-migration-toolkit/src/ast/transforms/router.js";

describe("transformRouter", () => {
  it("detects router.push as compatible", () => {
    const code = `
      import { useRouter } from 'next/router';
      export default function Page() {
        const router = useRouter();
        return <button onClick={() => router.push('/home')}>Go</button>;
      }
    `;
    const result = transformRouter(code, "page.tsx");
    const push = result.usages.find((u) => u.pattern === "router.push");
    expect(push).toBeDefined();
    expect(push!.breaking).toBe(false);
  });

  it("detects router.query as breaking", () => {
    const code = `
      import { useRouter } from 'next/router';
      export default function Page() {
        const router = useRouter();
        const { id } = router.query;
        return <div>{id}</div>;
      }
    `;
    const result = transformRouter(code, "page.tsx");
    const query = result.usages.find((u) => u.pattern === "router.query");
    expect(query).toBeDefined();
    expect(query!.breaking).toBe(true);
    expect(query!.replacement).toContain("useSearchParams");
  });

  it("detects router.pathname as breaking", () => {
    const code = `
      import { useRouter } from 'next/router';
      export default function Page() {
        const router = useRouter();
        console.log(router.pathname);
        return <div/>;
      }
    `;
    const result = transformRouter(code, "page.tsx");
    const pathname = result.usages.find((u) => u.pattern === "router.pathname");
    expect(pathname).toBeDefined();
    expect(pathname!.breaking).toBe(true);
    expect(result.suggestedImports).toContain("usePathname");
  });

  it("provides accurate summary with breaking vs compatible counts", () => {
    const code = `
      import { useRouter } from 'next/router';
      export default function Page() {
        const router = useRouter();
        router.push('/a');
        const q = router.query;
        const p = router.pathname;
        return <div/>;
      }
    `;
    const result = transformRouter(code, "page.tsx");
    expect(result.hasRouterImport).toBe(true);
    expect(result.summary.total).toBeGreaterThanOrEqual(3);
    expect(result.summary.breaking).toBeGreaterThanOrEqual(2);
    expect(result.summary.compatible).toBeGreaterThanOrEqual(1);
  });
});
