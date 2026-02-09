import { parseCode } from "../utils/parser.js";

interface RouterUsage {
  pattern: string;
  line: number;
  column: number;
  replacement: string;
  breaking: boolean;
  note: string;
}

interface RouterAnalysis {
  usages: RouterUsage[];
  hasRouterImport: boolean;
  suggestedImports: string[];
  summary: {
    total: number;
    breaking: number;
    compatible: number;
  };
}

const ROUTER_PATTERNS: {
  regex: RegExp;
  pattern: string;
  replacement: string;
  breaking: boolean;
  note: string;
  suggestsImport?: string;
}[] = [
  {
    regex: /router\.push\(/g,
    pattern: "router.push",
    replacement: "router.push() (from next/navigation — same API)",
    breaking: false,
    note: "Compatible with App Router's useRouter",
  },
  {
    regex: /router\.replace\(/g,
    pattern: "router.replace",
    replacement: "router.replace() (from next/navigation — same API)",
    breaking: false,
    note: "Compatible with App Router's useRouter",
  },
  {
    regex: /router\.back\(/g,
    pattern: "router.back",
    replacement: "router.back() (from next/navigation — same API)",
    breaking: false,
    note: "Compatible with App Router's useRouter",
  },
  {
    regex: /router\.query(?!\w)/g,
    pattern: "router.query",
    replacement: "useSearchParams() for query string, useParams() for dynamic route params",
    breaking: true,
    note: "router.query is removed in App Router",
    suggestsImport: "useSearchParams",
  },
  {
    regex: /router\.pathname(?!\w)/g,
    pattern: "router.pathname",
    replacement: "usePathname() from next/navigation",
    breaking: true,
    note: "router.pathname is removed in App Router",
    suggestsImport: "usePathname",
  },
  {
    regex: /router\.asPath(?!\w)/g,
    pattern: "router.asPath",
    replacement: "usePathname() from next/navigation",
    breaking: true,
    note: "router.asPath is removed in App Router",
    suggestsImport: "usePathname",
  },
  {
    regex: /router\.isReady(?!\w)/g,
    pattern: "router.isReady",
    replacement: "Removed — App Router components are always ready",
    breaking: true,
    note: "isReady is not needed in App Router",
  },
  {
    regex: /router\.events(?!\w)/g,
    pattern: "router.events",
    replacement: "Use usePathname() + useSearchParams() in useEffect",
    breaking: true,
    note: "Router events are removed in App Router",
    suggestsImport: "usePathname",
  },
  {
    regex: /router\.locale(?!\w)/g,
    pattern: "router.locale",
    replacement: "Use middleware or next-intl for i18n",
    breaking: true,
    note: "Built-in i18n routing is removed in App Router",
  },
  {
    regex: /router\.isFallback(?!\w)/g,
    pattern: "router.isFallback",
    replacement: "Use loading.tsx for fallback states",
    breaking: true,
    note: "isFallback is removed — use loading.tsx or Suspense",
  },
  {
    regex: /withRouter(?!\w)/g,
    pattern: "withRouter",
    replacement: "Use useRouter(), usePathname(), useSearchParams() hooks directly",
    breaking: true,
    note: "withRouter HOC is removed — use hooks instead",
    suggestsImport: "useRouter",
  },
];

export function transformRouter(code: string, filename: string): RouterAnalysis {
  const sf = parseCode(code, filename);
  const text = sf.getFullText();
  const lines = text.split("\n");

  let hasRouterImport = false;
  for (const decl of sf.getImportDeclarations()) {
    const specifier = decl.getModuleSpecifierValue();
    if (specifier === "next/router") {
      hasRouterImport = true;
      break;
    }
  }

  const usages: RouterUsage[] = [];
  const suggestedImportsSet = new Set<string>();

  for (const entry of ROUTER_PATTERNS) {
    const regex = new RegExp(entry.regex.source, entry.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const offset = match.index;
      let line = 1;
      let col = 1;
      let pos = 0;
      for (let i = 0; i < lines.length; i++) {
        if (pos + lines[i].length >= offset) {
          line = i + 1;
          col = offset - pos + 1;
          break;
        }
        pos += lines[i].length + 1;
      }

      usages.push({
        pattern: entry.pattern,
        line,
        column: col,
        replacement: entry.replacement,
        breaking: entry.breaking,
        note: entry.note,
      });

      if (entry.suggestsImport) {
        suggestedImportsSet.add(entry.suggestsImport);
      }
    }
  }

  if (hasRouterImport) {
    suggestedImportsSet.add("useRouter");
  }

  const breaking = usages.filter((u) => u.breaking).length;

  return {
    usages,
    hasRouterImport,
    suggestedImports: [...suggestedImportsSet],
    summary: {
      total: usages.length,
      breaking,
      compatible: usages.length - breaking,
    },
  };
}
