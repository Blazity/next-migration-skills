import { SyntaxKind, type FunctionDeclaration, type VariableDeclaration } from "ts-morph";
import { parseCode } from "../utils/parser.js";

const DATA_FETCHING_NAMES = [
  "getStaticProps",
  "getServerSideProps",
  "getStaticPaths",
  "getInitialProps",
] as const;

type DataFetchingType = (typeof DATA_FETCHING_NAMES)[number];

interface DataFetchingPattern {
  name: string;
  line: number;
  type: DataFetchingType;
  hasRevalidate: boolean;
  revalidateValue?: number;
  suggestedReplacement: string;
  complexity: "simple" | "moderate" | "complex";
}

interface DataFetchingAnalysis {
  patterns: DataFetchingPattern[];
  summary: {
    total: number;
    getStaticProps: number;
    getServerSideProps: number;
    getStaticPaths: number;
    getInitialProps: number;
  };
}

function isDataFetchingName(name: string): name is DataFetchingType {
  return DATA_FETCHING_NAMES.includes(name as DataFetchingType);
}

function extractRevalidateValue(bodyText: string): number | undefined {
  const match = bodyText.match(/revalidate\s*:\s*(\d+)/);
  return match ? Number(match[1]) : undefined;
}

function hasRevalidate(bodyText: string): boolean {
  return /revalidate\s*:/.test(bodyText);
}

function buildSuggestion(type: DataFetchingType, revalidateVal?: number): string {
  switch (type) {
    case "getStaticProps":
      if (revalidateVal !== undefined) {
        return `// Fetch data with ISR\nconst data = await fetch('...', { next: { revalidate: ${revalidateVal} } });`;
      }
      return "// Fetch data in Server Component\nconst data = await fetch('...', { cache: 'force-cache' });";
    case "getServerSideProps":
      return "// Fetch data on every request\nconst data = await fetch('...', { cache: 'no-store' });";
    case "getStaticPaths":
      return "export async function generateStaticParams() {\n  // Return array of params\n  return [{ slug: '...' }];\n}";
    case "getInitialProps":
      return "// MANUAL MIGRATION: Move data fetching to Server Component or Route Handler";
  }
}

function determineComplexity(
  type: DataFetchingType,
  bodyText: string,
  revalidateFound: boolean,
): "simple" | "moderate" | "complex" {
  switch (type) {
    case "getStaticProps":
      if (revalidateFound) return "moderate";
      return isBodyComplex(bodyText) ? "complex" : "simple";
    case "getServerSideProps": {
      const usesAdvancedContext = /cookies|headers|redirect/.test(bodyText);
      return usesAdvancedContext ? "complex" : "simple";
    }
    case "getStaticPaths": {
      const fetchesData = /fetch|axios|prisma|query|request|api/i.test(bodyText);
      return fetchesData ? "moderate" : "simple";
    }
    case "getInitialProps":
      return "complex";
  }
}

function isBodyComplex(bodyText: string): boolean {
  const indicators = [/try\s*\{/, /catch\s*\(/, /if\s*\(/, /switch\s*\(/, /\.then\s*\(/];
  return indicators.some((re) => re.test(bodyText));
}

function analyzeFunction(name: string, bodyText: string, line: number): DataFetchingPattern {
  const type = name as DataFetchingType;
  const revalidateFound = hasRevalidate(bodyText);
  const revalidateVal = revalidateFound ? extractRevalidateValue(bodyText) : undefined;

  return {
    name,
    line,
    type,
    hasRevalidate: revalidateFound,
    ...(revalidateVal !== undefined && { revalidateValue: revalidateVal }),
    suggestedReplacement: buildSuggestion(type, revalidateVal),
    complexity: determineComplexity(type, bodyText, revalidateFound),
  };
}

export function transformDataFetching(code: string, filename: string): DataFetchingAnalysis {
  const sf = parseCode(code, filename);
  const patterns: DataFetchingPattern[] = [];

  for (const fn of sf.getFunctions()) {
    const name = fn.getName();
    if (!name || !isDataFetchingName(name)) continue;
    if (!fn.isExported()) continue;

    const bodyText = fn.getBodyText() ?? "";
    const line = fn.getStartLineNumber();
    patterns.push(analyzeFunction(name, bodyText, line));
  }

  for (const varStmt of sf.getVariableStatements()) {
    if (!varStmt.isExported()) continue;
    for (const decl of varStmt.getDeclarations()) {
      const name = decl.getName();
      if (!isDataFetchingName(name)) continue;

      const initializer = decl.getInitializer();
      if (!initializer) continue;

      const bodyText = initializer.getText();
      const line = varStmt.getStartLineNumber();
      patterns.push(analyzeFunction(name, bodyText, line));
    }
  }

  const summary = {
    total: patterns.length,
    getStaticProps: patterns.filter((p) => p.type === "getStaticProps").length,
    getServerSideProps: patterns.filter((p) => p.type === "getServerSideProps").length,
    getStaticPaths: patterns.filter((p) => p.type === "getStaticPaths").length,
    getInitialProps: patterns.filter((p) => p.type === "getInitialProps").length,
  };

  return { patterns, summary };
}
