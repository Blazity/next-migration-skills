import fs from "node:fs";

export interface DependencyInfo {
  name: string;
  version: string;
  source: "dependencies" | "devDependencies";
  classification: "core" | "replaceable" | "devTool" | "unknown";
  replacement?: string | null;
  note?: string;
}

export interface DependencyAnalysis {
  dependencies: DependencyInfo[];
  summary: {
    total: number;
    core: number;
    replaceable: number;
    devTool: number;
    unknown: number;
  };
}

interface ReplacementEntry {
  replacement: string | null;
  note: string;
}

const CORE_PACKAGES = ["next", "react", "react-dom"];

const DEV_TOOL_NAMES = new Set([
  "typescript",
  "eslint",
  "prettier",
  "vitest",
  "jest",
  "ts-node",
  "tsx",
  "webpack",
  "turbopack",
  "postcss",
  "tailwindcss",
  "autoprefixer",
]);

function loadKnownReplacements(): Record<string, ReplacementEntry> {
  const dataPath = new URL("../../data/known-replacements.json", import.meta.url);
  return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
}

function classify(
  name: string,
  knownReplacements: Record<string, ReplacementEntry>,
): "core" | "replaceable" | "devTool" | "unknown" {
  if (CORE_PACKAGES.includes(name)) return "core";
  if (name in knownReplacements) return "replaceable";
  if (name.startsWith("@types/") || DEV_TOOL_NAMES.has(name)) return "devTool";
  return "unknown";
}

export function analyzeDependencies(packageJsonPath: string): DependencyAnalysis {
  const raw = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const knownReplacements = loadKnownReplacements();

  const deps: DependencyInfo[] = [];

  for (const source of ["dependencies", "devDependencies"] as const) {
    const section: Record<string, string> | undefined = raw[source];
    if (!section) continue;

    for (const [name, version] of Object.entries(section)) {
      const classification = classify(name, knownReplacements);
      const info: DependencyInfo = { name, version, source, classification };

      if (classification === "replaceable") {
        const entry = knownReplacements[name];
        info.replacement = entry.replacement;
        info.note = entry.note;
      }

      deps.push(info);
    }
  }

  const summary = {
    total: deps.length,
    core: deps.filter((d) => d.classification === "core").length,
    replaceable: deps.filter((d) => d.classification === "replaceable").length,
    devTool: deps.filter((d) => d.classification === "devTool").length,
    unknown: deps.filter((d) => d.classification === "unknown").length,
  };

  return { dependencies: deps, summary };
}
