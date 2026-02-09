import { describe, it, expect } from "vitest";
import { renderLayout, renderPage, renderRoute, renderLoading, renderError } from "../../skills/nextjs-migration-toolkit/src/templates/render.js";

describe("templates", () => {
  it("renders a root layout with metadata", () => {
    const result = renderLayout({
      name: "Root",
      isRoot: true,
      metadata: { title: "My App", description: "A great app" },
    });
    expect(result).toContain("RootLayout");
    expect(result).toContain("<html");
    expect(result).toContain("My App");
    expect(result).toContain("Metadata");
  });

  it("renders a nested layout without html wrapper", () => {
    const result = renderLayout({ name: "Dashboard", isRoot: false });
    expect(result).toContain("DashboardLayout");
    expect(result).not.toContain("<html");
    expect(result).toContain("{children}");
  });

  it("renders a server page", () => {
    const result = renderPage({ name: "Home", isAsync: true });
    expect(result).toContain("async");
    expect(result).toContain("HomePage");
    expect(result).not.toContain("use client");
  });

  it("renders a client page", () => {
    const result = renderPage({ name: "Dashboard", isClient: true });
    expect(result).toContain("use client");
    expect(result).toContain("DashboardPage");
  });

  it("renders an API route handler", () => {
    const result = renderRoute({ methods: ["GET", "POST"] });
    expect(result).toContain("export async function GET");
    expect(result).toContain("export async function POST");
    expect(result).toContain("NextRequest");
  });

  it("renders a loading component", () => {
    const result = renderLoading({ name: "Blog" });
    expect(result).toContain("BlogLoading");
    expect(result).toContain("Loading...");
  });

  it("renders an error component", () => {
    const result = renderError({ name: "Blog" });
    expect(result).toContain("use client");
    expect(result).toContain("BlogError");
    expect(result).toContain("reset");
  });
});
