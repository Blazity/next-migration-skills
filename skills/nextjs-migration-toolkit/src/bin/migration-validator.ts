import { Command } from "commander";
import { validateMigration } from "../ast/analyzers/migration-validator.js";
import { printOutput } from "../ast/utils/output.js";

const program = new Command()
  .name("migration-validator")
  .description("Validate migrated App Router files for correctness")
  .argument("<appDir>", "Path to app/ directory")
  .action((appDir: string) => {
    const result = validateMigration(appDir);
    printOutput(result);
  });

program.parse();
