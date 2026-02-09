import { SourceFile, SyntaxKind, Node } from "ts-morph";
import { createProject, parseDirectory } from "../utils/parser.js";

const REACT_HOOKS = new Set([
  "useState",
  "useEffect",
  "useRef",
  "useReducer",
  "useCallback",
  "useMemo",
  "useContext",
  "useLayoutEffect",
  "useImperativeHandle",
  "useDebugValue",
  "useSyncExternalStore",
  "useTransition",
  "useDeferredValue",
  "useId",
]);

const NEXT_CLIENT_HOOKS = new Set([
  "useRouter",
  "usePathname",
  "useSearchParams",
  "useParams",
]);

const NEXT_CLIENT_MODULES = new Set(["next/router", "next/navigation"]);

const BROWSER_APIS = [
  "document.",
  "window.",
  "localStorage.",
  "sessionStorage.",
  "navigator.",
  "alert(",
  "confirm(",
  "prompt(",
];

const EVENT_HANDLER_PATTERN = /^on[A-Z]/;

const EVENT_HANDLERS = new Set([
  "onClick",
  "onChange",
  "onSubmit",
  "onKeyDown",
  "onKeyUp",
  "onMouseEnter",
  "onMouseLeave",
  "onFocus",
  "onBlur",
  "onScroll",
]);

interface ComponentInfo {
  filePath: string;
  name: string;
  classification: "client" | "server";
  clientIndicators: string[];
  hasClientDirective: boolean;
}

interface ComponentInventory {
  components: ComponentInfo[];
  summary: {
    total: number;
    client: number;
    server: number;
    withClientDirective: number;
  };
}

function getComponentName(sourceFile: SourceFile): string {
  const filePath = sourceFile.getFilePath();
  const base = filePath.slice(filePath.lastIndexOf("/") + 1);
  const name = base.slice(0, base.lastIndexOf("."));
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function hasDefaultExportComponent(sourceFile: SourceFile): boolean {
  const defaultExport = sourceFile.getDefaultExportSymbol();
  if (defaultExport) return true;

  const text = sourceFile.getFullText();
  return text.includes("export default function") || text.includes("export default ");
}

function detectClientDirective(sourceFile: SourceFile): boolean {
  const statements = sourceFile.getStatements();
  if (statements.length === 0) return false;

  const first = statements[0];
  if (Node.isExpressionStatement(first)) {
    const expr = first.getExpression();
    if (Node.isStringLiteral(expr) && expr.getLiteralValue() === "use client") {
      return true;
    }
  }

  return false;
}

function detectReactHooks(sourceFile: SourceFile): string[] {
  const hooks: string[] = [];

  for (const decl of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = decl.getModuleSpecifierValue();
    if (moduleSpecifier !== "react") continue;

    for (const named of decl.getNamedImports()) {
      const name = named.getName();
      if (REACT_HOOKS.has(name)) {
        hooks.push(name);
      }
    }
  }

  return hooks;
}

function detectNextClientHooks(sourceFile: SourceFile): string[] {
  const hooks: string[] = [];

  for (const decl of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = decl.getModuleSpecifierValue();
    if (!NEXT_CLIENT_MODULES.has(moduleSpecifier)) continue;

    for (const named of decl.getNamedImports()) {
      const name = named.getName();
      if (NEXT_CLIENT_HOOKS.has(name)) {
        hooks.push(name);
      }
    }
  }

  return hooks;
}

function detectBrowserApis(sourceFile: SourceFile): string[] {
  const found: string[] = [];
  const text = sourceFile.getFullText();

  for (const api of BROWSER_APIS) {
    if (text.includes(api)) {
      const name = api.replace(/[.(]/g, "");
      if (!found.includes(name)) {
        found.push(name);
      }
    }
  }

  return found;
}

function detectEventHandlers(sourceFile: SourceFile): string[] {
  const handlers: string[] = [];

  sourceFile.forEachDescendant((node) => {
    if (Node.isJsxAttribute(node)) {
      const name = node.getNameNode().getText();
      if (EVENT_HANDLER_PATTERN.test(name) && EVENT_HANDLERS.has(name)) {
        if (!handlers.includes(name)) {
          handlers.push(name);
        }
      }
    }
  });

  return handlers;
}

function analyzeFile(sourceFile: SourceFile): ComponentInfo | null {
  if (!hasDefaultExportComponent(sourceFile)) return null;

  const filePath = sourceFile.getFilePath();
  const name = getComponentName(sourceFile);
  const hasClientDirective = detectClientDirective(sourceFile);

  const indicators: string[] = [];

  for (const hook of detectReactHooks(sourceFile)) {
    indicators.push(hook);
  }

  for (const hook of detectNextClientHooks(sourceFile)) {
    indicators.push(hook);
  }

  for (const handler of detectEventHandlers(sourceFile)) {
    indicators.push(handler);
  }

  for (const api of detectBrowserApis(sourceFile)) {
    indicators.push(api);
  }

  if (hasClientDirective && !indicators.includes("use client")) {
    indicators.unshift("use client");
  }

  const classification = indicators.length > 0 ? "client" : "server";

  return {
    filePath,
    name,
    classification,
    clientIndicators: indicators,
    hasClientDirective,
  };
}

export function inventoryComponents(srcDir: string): ComponentInventory {
  const project = createProject();
  const sourceFiles = parseDirectory(project, srcDir);

  const components: ComponentInfo[] = [];

  for (const sf of sourceFiles) {
    const info = analyzeFile(sf);
    if (info) {
      components.push(info);
    }
  }

  components.sort((a, b) => a.filePath.localeCompare(b.filePath));

  const summary = {
    total: components.length,
    client: components.filter((c) => c.classification === "client").length,
    server: components.filter((c) => c.classification === "server").length,
    withClientDirective: components.filter((c) => c.hasClientDirective).length,
  };

  return { components, summary };
}
