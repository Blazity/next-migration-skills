import { describe, it, expect } from "vitest";
import { transformImports } from "../../../src/ast/transforms/imports.js";

describe("transformImports", () => {
  it("rewrites next/router to next/navigation", () => {
    const code = `import { useRouter } from 'next/router';\nconst router = useRouter();`;
    const result = transformImports(code, "test.ts");
    expect(result.code).toContain("next/navigation");
    expect(result.code).not.toContain("next/router");
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].action).toBe("rewrite");
  });

  it("removes next/head imports", () => {
    const code = `import Head from 'next/head';\nimport Link from 'next/link';\nconst x = 1;`;
    const result = transformImports(code, "test.ts");
    expect(result.code).not.toContain("next/head");
    expect(result.code).toContain("next/link");
    const headChange = result.changes.find(c => c.original === "next/head");
    expect(headChange?.action).toBe("remove");
  });

  it("leaves non-next imports unchanged", () => {
    const code = `import React from 'react';\nimport axios from 'axios';`;
    const result = transformImports(code, "test.ts");
    expect(result.code).toContain("react");
    expect(result.code).toContain("axios");
    expect(result.summary.unchanged).toBe(2);
  });

  it("supports dry run mode", () => {
    const code = `import { useRouter } from 'next/router';`;
    const result = transformImports(code, "test.ts", { dryRun: true });
    expect(result.code).toContain("next/router");
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].action).toBe("rewrite");
  });

  it("provides accurate summary counts", () => {
    const code = `import Head from 'next/head';\nimport { useRouter } from 'next/router';\nimport Link from 'next/link';\nimport React from 'react';`;
    const result = transformImports(code, "test.ts");
    expect(result.summary.removed).toBe(1);
    expect(result.summary.rewritten).toBe(1);
    expect(result.summary.unchanged).toBeGreaterThanOrEqual(2);
  });
});
