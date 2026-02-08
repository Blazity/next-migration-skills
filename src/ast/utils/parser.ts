import { Project, SourceFile, ScriptKind } from "ts-morph";

const extensionToScriptKind: Record<string, ScriptKind> = {
  ".ts": ScriptKind.TS,
  ".tsx": ScriptKind.TSX,
  ".js": ScriptKind.JS,
  ".jsx": ScriptKind.JSX,
};

export function createProject(tsConfigPath?: string): Project {
  if (tsConfigPath) {
    return new Project({ tsConfigFilePath: tsConfigPath, skipAddingFilesFromTsConfig: true });
  }
  return new Project({
    compilerOptions: { target: 99, jsx: 4, module: 99, allowJs: true },
    useInMemoryFileSystem: false,
  });
}

export function parseCode(code: string, filename: string): SourceFile {
  const ext = filename.slice(filename.lastIndexOf("."));
  const project = new Project({
    compilerOptions: { target: 99, jsx: 4, module: 99, allowJs: true },
    useInMemoryFileSystem: true,
  });
  return project.createSourceFile(filename, code, {
    scriptKind: extensionToScriptKind[ext] ?? ScriptKind.TS,
  });
}

export function parseFile(project: Project, filePath: string): SourceFile {
  const existing = project.getSourceFile(filePath);
  if (existing) return existing;
  return project.addSourceFileAtPath(filePath);
}

export function parseDirectory(project: Project, dirPath: string): SourceFile[] {
  project.addSourceFilesAtPaths(`${dirPath}/**/*.{ts,tsx,js,jsx}`);
  return project.getSourceFiles().filter(
    (sf) => !sf.getFilePath().includes("node_modules")
  );
}
