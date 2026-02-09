import { describe, it, expect } from "vitest";
import { transformDataFetching } from "../../../skills/nextjs-migration-toolkit/src/ast/transforms/data-fetching.js";

describe("transformDataFetching", () => {
  it("detects getStaticProps and suggests force-cache fetch", () => {
    const code = `
      export async function getStaticProps() {
        const res = await fetch('https://api.example.com/data');
        return { props: { data: await res.json() } };
      }
      export default function Page({ data }: { data: any }) {
        return <div>{JSON.stringify(data)}</div>;
      }
    `;
    const result = transformDataFetching(code, "page.tsx");
    expect(result.patterns).toHaveLength(1);
    expect(result.patterns[0].type).toBe("getStaticProps");
    expect(result.patterns[0].hasRevalidate).toBe(false);
    expect(result.patterns[0].suggestedReplacement).toContain("force-cache");
  });

  it("detects getStaticProps with revalidate (ISR)", () => {
    const code = `
      export async function getStaticProps() {
        return { props: { data: [] }, revalidate: 60 };
      }
      export default function Page({ data }: { data: any[] }) {
        return <div>{data.length}</div>;
      }
    `;
    const result = transformDataFetching(code, "page.tsx");
    expect(result.patterns[0].hasRevalidate).toBe(true);
    expect(result.patterns[0].revalidateValue).toBe(60);
    expect(result.patterns[0].suggestedReplacement).toContain("revalidate");
    expect(result.patterns[0].suggestedReplacement).toContain("60");
  });

  it("detects getServerSideProps and suggests no-store fetch", () => {
    const code = `
      export async function getServerSideProps(context: any) {
        return { props: { user: null } };
      }
      export default function Page({ user }: { user: any }) {
        return <div>{user}</div>;
      }
    `;
    const result = transformDataFetching(code, "page.tsx");
    expect(result.patterns).toHaveLength(1);
    expect(result.patterns[0].type).toBe("getServerSideProps");
    expect(result.patterns[0].suggestedReplacement).toContain("no-store");
  });

  it("detects getStaticPaths and suggests generateStaticParams", () => {
    const code = `
      export async function getStaticPaths() {
        return { paths: [{ params: { slug: 'hello' } }], fallback: false };
      }
      export async function getStaticProps({ params }: { params: { slug: string } }) {
        return { props: { slug: params.slug } };
      }
      export default function Post({ slug }: { slug: string }) {
        return <div>{slug}</div>;
      }
    `;
    const result = transformDataFetching(code, "page.tsx");
    expect(result.patterns).toHaveLength(2);
    const paths = result.patterns.find((p) => p.type === "getStaticPaths");
    expect(paths).toBeDefined();
    expect(paths!.suggestedReplacement).toContain("generateStaticParams");
  });

  it("provides accurate summary counts", () => {
    const code = `
      export async function getStaticPaths() { return { paths: [], fallback: false }; }
      export async function getStaticProps() { return { props: {} }; }
      export default function Page() { return <div/>; }
    `;
    const result = transformDataFetching(code, "page.tsx");
    expect(result.summary.total).toBe(2);
    expect(result.summary.getStaticPaths).toBe(1);
    expect(result.summary.getStaticProps).toBe(1);
    expect(result.summary.getServerSideProps).toBe(0);
  });
});
