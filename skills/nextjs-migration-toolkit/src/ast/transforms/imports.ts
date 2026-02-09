import fs from "node:fs";
import { parseCode } from "../utils/parser.js";

interface TransformRule {
  replacement: string | null;
  action?: "remove";
  namedExports?: Record<string, string>;
  note?: string;
}

interface TransformRules {
  imports: Record<string, TransformRule>;
}

export interface ImportChange {
  original: string;
  replacement: string | null;
  line: number;
  action: "rewrite" | "remove" | "unchanged";
}

export interface TransformResult {
  code: string;
  changes: ImportChange[];
  summary: {
    total: number;
    rewritten: number;
    removed: number;
    unchanged: number;
  };
}

function loadRules(): TransformRules {
  const rulesPath = new URL("../../data/transform-rules.json", import.meta.url);
  const raw = fs.readFileSync(rulesPath, "utf-8");
  return JSON.parse(raw) as TransformRules;
}

export function transformImports(
  code: string,
  filename: string,
  options?: { dryRun?: boolean },
): TransformResult {
  const rules = loadRules();
  const sf = parseCode(code, filename);
  const imports = sf.getImportDeclarations();
  const changes: ImportChange[] = [];

  for (const importDecl of imports) {
    const specifier = importDecl.getModuleSpecifierValue();
    const rule = rules.imports[specifier];
    const line = importDecl.getStartLineNumber();

    if (!rule) {
      changes.push({ original: specifier, replacement: specifier, line, action: "unchanged" });
      continue;
    }

    if (rule.action === "remove") {
      changes.push({ original: specifier, replacement: null, line, action: "remove" });
      if (!options?.dryRun) {
        importDecl.remove();
      }
      continue;
    }

    const replacement = rule.replacement ?? specifier;
    const needsRewrite = replacement !== specifier;

    if (rule.namedExports && !options?.dryRun) {
      for (const namedImport of importDecl.getNamedImports()) {
        const name = namedImport.getName();
        const mapped = rule.namedExports[name];
        if (mapped && mapped !== name) {
          namedImport.setName(mapped);
        }
      }
    }

    if (needsRewrite) {
      changes.push({ original: specifier, replacement, line, action: "rewrite" });
      if (!options?.dryRun) {
        importDecl.setModuleSpecifier(replacement);
      }
    } else {
      changes.push({ original: specifier, replacement, line, action: "unchanged" });
    }
  }

  const summary = {
    total: changes.length,
    rewritten: changes.filter((c) => c.action === "rewrite").length,
    removed: changes.filter((c) => c.action === "remove").length,
    unchanged: changes.filter((c) => c.action === "unchanged").length,
  };

  return { code: sf.getFullText(), changes, summary };
}
