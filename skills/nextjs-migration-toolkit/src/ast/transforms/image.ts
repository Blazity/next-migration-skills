import { parseCode } from "../utils/parser.js";

interface ImageUsage {
  line: number;
  importSource: string;
  isLegacy: boolean;
  suggestedAction: string;
}

interface ImageAnalysis {
  usages: ImageUsage[];
  summary: {
    total: number;
    legacy: number;
    current: number;
  };
}

export function transformImage(code: string, filename: string): ImageAnalysis {
  const sf = parseCode(code, filename);
  const usages: ImageUsage[] = [];

  for (const decl of sf.getImportDeclarations()) {
    const specifier = decl.getModuleSpecifierValue();
    const line = decl.getStartLineNumber();

    if (specifier === "next/legacy/image") {
      usages.push({
        line,
        importSource: specifier,
        isLegacy: true,
        suggestedAction: "Replace import with 'next/image' and update props (layout → fill/sizes, objectFit → style)",
      });
    } else if (specifier === "next/image") {
      usages.push({
        line,
        importSource: specifier,
        isLegacy: false,
        suggestedAction: "No import change needed. Verify width/height or fill prop is set.",
      });
    }
  }

  return {
    usages,
    summary: {
      total: usages.length,
      legacy: usages.filter((u) => u.isLegacy).length,
      current: usages.filter((u) => !u.isLegacy).length,
    },
  };
}
