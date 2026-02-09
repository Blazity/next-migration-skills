import { describe, it, expect } from "vitest";
import { parseFile, parseCode } from "../../skills/nextjs-migration-toolkit/src/ast/utils/parser.js";

describe("parseFile", () => {
  it("parses a TypeScript file and returns a SourceFile", () => {
    const sf = parseCode("const x: number = 1;", "test.ts");
    expect(sf.getFullText()).toContain("const x");
  });

  it("parses TSX with JSX", () => {
    const sf = parseCode(
      'export default function Page() { return <div>hi</div>; }',
      "test.tsx"
    );
    const fn = sf.getFunctions();
    expect(fn.length).toBe(1);
    expect(fn[0].getName()).toBe("Page");
  });

  it("parses JavaScript files", () => {
    const sf = parseCode("const x = 1;", "test.js");
    expect(sf.getFullText()).toContain("const x");
  });
});
