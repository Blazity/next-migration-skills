import { Command } from "commander";
import { analyzeDependencies } from "../ast/analyzers/dependency-graph.js";
import { printOutput } from "../ast/utils/output.js";

const program = new Command()
  .name("dependency-analyzer")
  .description("Analyze project dependencies for App Router compatibility")
  .argument("<packageJson>", "Path to package.json")
  .action((packageJson) => {
    const result = analyzeDependencies(packageJson);
    printOutput(result);
  });

program.parse();
