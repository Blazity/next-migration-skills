import { Command } from "commander";
import { extractRoutes } from "../ast/analyzers/route-extractor.js";
import { printOutput } from "../ast/utils/output.js";

const program = new Command()
  .name("route-extractor")
  .description("Extract and analyze Next.js page routes")
  .argument("<pagesDir>", "Path to pages directory")
  .option("--json", "Output as JSON", true)
  .action((pagesDir) => {
    const result = extractRoutes(pagesDir);
    printOutput(result);
  });

program.parse();
