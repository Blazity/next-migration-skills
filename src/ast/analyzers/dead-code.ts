import path from "node:path";
import fs from "node:fs";
import { SourceFile, Node, SyntaxKind } from "ts-morph";
import { createProject, parseDirectory } from "../utils/parser.js";

interface DeadExport {
  filePath: string;
  exportName: string;
  type: "function" | "variable" | "class" | "interface" | "type" | "unknown";
  line: number;
}

interface DeadCodeAnalysis {
  deadExports: DeadExport[];
  summary: {
    totalExports: number;
    deadExports: number;
    filesWithDeadCode: number;
  };
}

const FRAMEWORK_FILE_NAMES = new Set([
  "page",
  "layout",
  "route",
  "loading",
  "error",
  "not-found",
  "template",
  "default",
  "middleware",
]);

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function getExportType(declarations: Node[]): DeadExport["type"] {
  for (const decl of declarations) {
    if (Node.isFunctionDeclaration(decl)) return "function";
    if (Node.isVariableDeclaration(decl)) return "variable";
    if (Node.isClassDeclaration(decl)) return "class";
    if (Node.isInterfaceDeclaration(decl)) return "interface";
    if (Node.isTypeAliasDeclaration(decl)) return "type";
  }
  return "unknown";
}

function getExportLine(declarations: Node[]): number {
  if (declarations.length === 0) return 0;
  return declarations[0].getStartLineNumber();
}

function stripExtension(filePath: string): string {
  const ext = path.extname(filePath);
  if (SOURCE_EXTENSIONS.includes(ext)) {
    return filePath.slice(0, -ext.length);
  }
  return filePath;
}

function resolveModuleSpecifier(importingFile: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) return null;

  const dir = path.dirname(importingFile);
  const raw = path.resolve(dir, specifier);
  const stripped = stripExtension(raw);

  for (const ext of SOURCE_EXTENSIONS) {
    if (fs.existsSync(stripped + ext)) return stripped + ext;
  }

  for (const ext of SOURCE_EXTENSIONS) {
    const indexPath = path.join(stripped, "index" + ext);
    if (fs.existsSync(indexPath)) return indexPath;
  }

  if (fs.existsSync(raw)) return raw;

  return stripped;
}

function isFrameworkFile(filePath: string): boolean {
  const base = path.basename(filePath);
  const name = base.slice(0, base.lastIndexOf("."));
  return FRAMEWORK_FILE_NAMES.has(name);
}

function isIndexFile(filePath: string): boolean {
  const base = path.basename(filePath);
  const name = base.slice(0, base.lastIndexOf("."));
  return name === "index";
}

function collectExports(sourceFiles: SourceFile[]): DeadExport[] {
  const exports: DeadExport[] = [];

  for (const sf of sourceFiles) {
    const filePath = sf.getFilePath();
    const exportedDeclarations = sf.getExportedDeclarations();

    for (const [name, declarations] of exportedDeclarations) {
      if (name === "default") continue;

      exports.push({
        filePath,
        exportName: name,
        type: getExportType(declarations.map((d) => d as Node)),
        line: getExportLine(declarations.map((d) => d as Node)),
      });
    }
  }

  return exports;
}

function collectImportedSymbols(sourceFiles: SourceFile[]): Set<string> {
  const imported = new Set<string>();

  for (const sf of sourceFiles) {
    const importingFilePath = sf.getFilePath();

    for (const decl of sf.getImportDeclarations()) {
      const specifier = decl.getModuleSpecifierValue();
      const resolvedPath = resolveModuleSpecifier(importingFilePath, specifier);
      if (!resolvedPath) continue;

      const normalizedPath = stripExtension(path.resolve(resolvedPath));

      for (const named of decl.getNamedImports()) {
        const importName = named.getAliasNode()
          ? named.getName()
          : named.getName();
        imported.add(`${normalizedPath}::${importName}`);
      }
    }
  }

  return imported;
}

export function detectDeadExports(srcDir: string): DeadCodeAnalysis {
  const project = createProject();
  const sourceFiles = parseDirectory(project, srcDir);

  const allExports = collectExports(sourceFiles);
  const importedSymbols = collectImportedSymbols(sourceFiles);

  const deadExports: DeadExport[] = [];

  for (const exp of allExports) {
    if (isFrameworkFile(exp.filePath)) continue;
    if (isIndexFile(exp.filePath)) continue;

    const normalizedKey = `${stripExtension(exp.filePath)}::${exp.exportName}`;

    if (!importedSymbols.has(normalizedKey)) {
      deadExports.push(exp);
    }
  }

  deadExports.sort((a, b) =>
    a.filePath === b.filePath
      ? a.line - b.line
      : a.filePath.localeCompare(b.filePath),
  );

  const filesWithDeadCode = new Set(deadExports.map((d) => d.filePath)).size;

  return {
    deadExports,
    summary: {
      totalExports: allExports.length,
      deadExports: deadExports.length,
      filesWithDeadCode,
    },
  };
}
