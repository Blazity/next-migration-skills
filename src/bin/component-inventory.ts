import { Command } from "commander";
import { inventoryComponents } from "../ast/analyzers/component-inventory.js";
import { printOutput } from "../ast/utils/output.js";

const program = new Command()
  .name("component-inventory")
  .description("Inventory React components and classify client vs server")
  .argument("<srcDir>", "Path to components directory")
  .action((srcDir: string) => {
    const result = inventoryComponents(srcDir);
    printOutput(result);
  });

program.parse();
