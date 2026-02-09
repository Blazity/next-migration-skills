import fs from "node:fs";

interface ConfigIssue {
  property: string;
  line: number;
  severity: "error" | "warning" | "info";
  message: string;
  suggestedAction: string;
}

interface ConfigAnalysis {
  issues: ConfigIssue[];
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
}

const CONFIG_CHECKS: {
  pattern: RegExp;
  property: string;
  severity: "error" | "warning" | "info";
  message: string;
  suggestedAction: string;
}[] = [
  {
    pattern: /\bi18n\s*[:{]/,
    property: "i18n",
    severity: "error",
    message: "Built-in i18n routing is not supported in App Router",
    suggestedAction: "Use middleware-based i18n (next-intl) or implement i18n via route groups [locale]/",
  },
  {
    pattern: /\brewrites\s*[:(]/,
    property: "rewrites",
    severity: "warning",
    message: "Rewrites still work but consider using route groups and middleware",
    suggestedAction: "Review rewrites — many can be replaced with route structure or middleware",
  },
  {
    pattern: /\bredirects\s*[:(]/,
    property: "redirects",
    severity: "info",
    message: "Redirects are still supported in next.config.js",
    suggestedAction: "No change required. Can also use redirect() in middleware or route handlers.",
  },
  {
    pattern: /\bwebpack\s*[:(]/,
    property: "webpack",
    severity: "warning",
    message: "Custom webpack config still works but Turbopack does not support it",
    suggestedAction: "Review webpack customizations for Turbopack compatibility",
  },
  {
    pattern: /\bpageExtensions\s*[:{]/,
    property: "pageExtensions",
    severity: "warning",
    message: "pageExtensions affects both pages/ and app/ directories",
    suggestedAction: "Verify pageExtensions are compatible with App Router file conventions",
  },
  {
    pattern: /\bexperimental\s*[:{]/,
    property: "experimental",
    severity: "info",
    message: "Experimental features detected — some may now be stable in App Router",
    suggestedAction: "Review experimental flags; appDir, serverActions are now stable",
  },
  {
    pattern: /\bimages\s*[:{]/,
    property: "images",
    severity: "info",
    message: "Image configuration is still supported",
    suggestedAction: "No change required. Verify remotePatterns config is up to date.",
  },
  {
    pattern: /\bheaders\s*[:(]/,
    property: "headers",
    severity: "info",
    message: "Custom headers are still supported in next.config.js",
    suggestedAction: "No change required. Can also set headers in middleware or route handlers.",
  },
];

export function analyzeConfig(configPath: string): ConfigAnalysis {
  const content = fs.readFileSync(configPath, "utf-8");
  const lines = content.split("\n");
  const issues: ConfigIssue[] = [];

  for (const check of CONFIG_CHECKS) {
    for (let i = 0; i < lines.length; i++) {
      if (check.pattern.test(lines[i])) {
        issues.push({
          property: check.property,
          line: i + 1,
          severity: check.severity,
          message: check.message,
          suggestedAction: check.suggestedAction,
        });
        break;
      }
    }
  }

  return {
    issues,
    summary: {
      total: issues.length,
      errors: issues.filter((i) => i.severity === "error").length,
      warnings: issues.filter((i) => i.severity === "warning").length,
      info: issues.filter((i) => i.severity === "info").length,
    },
  };
}
