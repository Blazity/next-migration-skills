import path from "node:path";
import { createProject, parseDirectory } from "../utils/parser.js";
import type { SourceFile } from "ts-morph";

export interface RouteInfo {
  filePath: string;
  routePath: string;
  type: "static" | "dynamic" | "catch-all" | "api";
  dataFetching: string[];
  hasDefaultExport: boolean;
  apiMethods?: string[];
}

export interface RouteAnalysis {
  routes: RouteInfo[];
  summary: {
    total: number;
    static: number;
    dynamic: number;
    api: number;
    catchAll: number;
    withGetStaticProps: number;
    withGetServerSideProps: number;
    withGetStaticPaths: number;
  };
}

const DATA_FETCHING_NAMES = [
  "getStaticProps",
  "getServerSideProps",
  "getStaticPaths",
] as const;

function filePathToRoute(relativePath: string): string {
  let route = relativePath
    .replace(/\.(tsx?|jsx?)$/, "")
    .split(path.sep)
    .join("/");

  if (route === "index") {
    route = "/";
  } else if (route.endsWith("/index")) {
    route = route.slice(0, -"/index".length);
  }

  route = route
    .replace(/\[\.\.\.(\w+)\]/g, "*$1")
    .replace(/\[(\w+)\]/g, ":$1");

  return route.startsWith("/") ? route : `/${route}`;
}

function classifyRoute(routePath: string, relativePath: string): RouteInfo["type"] {
  if (routePath.startsWith("/api") || routePath === "/api") return "api";
  if (relativePath.includes("[...")) return "catch-all";
  if (relativePath.includes("[")) return "dynamic";
  return "static";
}

function detectDataFetching(sourceFile: SourceFile): string[] {
  const found: string[] = [];

  for (const name of DATA_FETCHING_NAMES) {
    const fn = sourceFile.getFunction(name);
    if (fn && fn.isExported()) {
      found.push(name);
      continue;
    }

    const varDecl = sourceFile.getVariableDeclaration(name);
    if (varDecl) {
      const stmt = varDecl.getVariableStatement();
      if (stmt?.isExported()) {
        found.push(name);
      }
    }
  }

  return found;
}

function detectApiMethods(sourceFile: SourceFile): string[] {
  const text = sourceFile.getFullText();
  const methods: string[] = [];
  const methodPattern = /req\.method\s*===\s*['"](\w+)['"]/g;
  let match: RegExpExecArray | null;

  while ((match = methodPattern.exec(text)) !== null) {
    const method = match[1];
    if (!methods.includes(method)) {
      methods.push(method);
    }
  }

  return methods;
}

function hasDefaultExport(sourceFile: SourceFile): boolean {
  return sourceFile.getDefaultExportSymbol() !== undefined;
}

export function extractRoutes(pagesDir: string): RouteAnalysis {
  const resolvedDir = path.resolve(pagesDir);
  const project = createProject();
  const sourceFiles = parseDirectory(project, resolvedDir);

  const routes: RouteInfo[] = sourceFiles.map((sf) => {
    const filePath = sf.getFilePath();
    const relativePath = path.relative(resolvedDir, filePath);
    const routePath = filePathToRoute(relativePath);
    const type = classifyRoute(routePath, relativePath);
    const dataFetching = detectDataFetching(sf);
    const defaultExport = hasDefaultExport(sf);

    const info: RouteInfo = {
      filePath,
      routePath,
      type,
      dataFetching,
      hasDefaultExport: defaultExport,
    };

    if (type === "api") {
      info.apiMethods = detectApiMethods(sf);
    }

    return info;
  });

  routes.sort((a, b) => a.routePath.localeCompare(b.routePath));

  const summary = {
    total: routes.length,
    static: routes.filter((r) => r.type === "static").length,
    dynamic: routes.filter((r) => r.type === "dynamic").length,
    api: routes.filter((r) => r.type === "api").length,
    catchAll: routes.filter((r) => r.type === "catch-all").length,
    withGetStaticProps: routes.filter((r) => r.dataFetching.includes("getStaticProps")).length,
    withGetServerSideProps: routes.filter((r) => r.dataFetching.includes("getServerSideProps")).length,
    withGetStaticPaths: routes.filter((r) => r.dataFetching.includes("getStaticPaths")).length,
  };

  return { routes, summary };
}
