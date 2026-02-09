import { Command } from "commander";
import { extractRoutes } from "../ast/analyzers/route-extractor.js";
import { inventoryComponents } from "../ast/analyzers/component-inventory.js";
import { analyzeDependencies } from "../ast/analyzers/dependency-graph.js";
import { detectDeadExports } from "../ast/analyzers/dead-code.js";
import { extractProps } from "../ast/analyzers/prop-extractor.js";
import { validateMigration } from "../ast/analyzers/migration-validator.js";
import { transformImports } from "../ast/transforms/imports.js";
import { transformDataFetching } from "../ast/transforms/data-fetching.js";
import { transformRouter } from "../ast/transforms/router.js";
import { transformImage } from "../ast/transforms/image.js";
import { analyzeConfig } from "../ast/transforms/config.js";
import { printOutput } from "../ast/utils/output.js";
import fs from "node:fs";

const program = new Command()
  .name("ast-tool")
  .description("Unified AST analysis and transform tool for Next.js migration")
  .version("0.1.0");

const analyze = program.command("analyze").description("Run analysis on source files");

analyze
  .command("routes")
  .description("Extract and analyze Next.js page routes")
  .argument("<pagesDir>", "Path to pages directory")
  .action((pagesDir: string) => {
    printOutput(extractRoutes(pagesDir));
  });

analyze
  .command("components")
  .description("Inventory components and classify client vs server")
  .argument("<srcDir>", "Path to components directory")
  .action((srcDir: string) => {
    printOutput(inventoryComponents(srcDir));
  });

analyze
  .command("dependencies")
  .description("Analyze dependencies for App Router compatibility")
  .argument("<packageJson>", "Path to package.json")
  .action((packageJson: string) => {
    printOutput(analyzeDependencies(packageJson));
  });

analyze
  .command("dead-code")
  .description("Detect unused exports across the codebase")
  .argument("<srcDir>", "Path to source directory")
  .action((srcDir: string) => {
    printOutput(detectDeadExports(srcDir));
  });

analyze
  .command("props")
  .description("Extract prop types from component files")
  .argument("<file>", "Path to component file")
  .action((file: string) => {
    const code = fs.readFileSync(file, "utf-8");
    printOutput(extractProps(code, file));
  });

analyze
  .command("config")
  .description("Analyze next.config.js for App Router compatibility")
  .argument("<configPath>", "Path to next.config.js")
  .action((configPath: string) => {
    printOutput(analyzeConfig(configPath));
  });

const transform = program.command("transform").description("Run transforms on source files");

transform
  .command("imports")
  .description("Rewrite Next.js imports for App Router")
  .argument("<file>", "Path to source file")
  .option("--dry-run", "Preview changes without modifying")
  .action((file: string, opts: { dryRun?: boolean }) => {
    const code = fs.readFileSync(file, "utf-8");
    printOutput(transformImports(code, file, { dryRun: opts.dryRun }));
  });

transform
  .command("data-fetching")
  .description("Analyze data-fetching patterns for migration")
  .argument("<file>", "Path to source file")
  .action((file: string) => {
    const code = fs.readFileSync(file, "utf-8");
    printOutput(transformDataFetching(code, file));
  });

transform
  .command("router")
  .description("Analyze router usage patterns for migration")
  .argument("<file>", "Path to source file")
  .action((file: string) => {
    const code = fs.readFileSync(file, "utf-8");
    printOutput(transformRouter(code, file));
  });

transform
  .command("image")
  .description("Analyze image usage for migration")
  .argument("<file>", "Path to source file")
  .action((file: string) => {
    const code = fs.readFileSync(file, "utf-8");
    printOutput(transformImage(code, file));
  });

program
  .command("validate")
  .description("Validate migrated App Router files")
  .argument("<appDir>", "Path to app/ directory")
  .action((appDir: string) => {
    printOutput(validateMigration(appDir));
  });

program.parse();
