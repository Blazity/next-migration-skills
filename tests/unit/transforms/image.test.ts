import { describe, it, expect } from "vitest";
import { transformImage } from "../../../src/ast/transforms/image.js";

describe("transformImage", () => {
  it("detects legacy image imports", () => {
    const code = `import Image from 'next/legacy/image';\nexport default function Page() { return <Image src="/photo.jpg" layout="fill" />; }`;
    const result = transformImage(code, "page.tsx");
    expect(result.usages).toHaveLength(1);
    expect(result.usages[0].isLegacy).toBe(true);
    expect(result.usages[0].suggestedAction).toContain("next/image");
  });

  it("detects current image imports", () => {
    const code = `import Image from 'next/image';\nexport default function Page() { return <Image src="/photo.jpg" width={100} height={100} alt="photo" />; }`;
    const result = transformImage(code, "page.tsx");
    expect(result.usages).toHaveLength(1);
    expect(result.usages[0].isLegacy).toBe(false);
  });

  it("handles files with no image imports", () => {
    const code = `import Link from 'next/link';\nexport default function Page() { return <Link href="/">Home</Link>; }`;
    const result = transformImage(code, "page.tsx");
    expect(result.usages).toHaveLength(0);
    expect(result.summary.total).toBe(0);
  });

  it("provides accurate summary counts", () => {
    const code = `import Image from 'next/legacy/image';\nimport Img from 'next/image';\nexport default function Page() { return <div/>; }`;
    const result = transformImage(code, "page.tsx");
    expect(result.summary.total).toBe(2);
    expect(result.summary.legacy).toBe(1);
    expect(result.summary.current).toBe(1);
  });
});
