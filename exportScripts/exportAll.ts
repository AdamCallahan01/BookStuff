import { runBookExport } from "./bookExportScript.ts";
import { runInventoryExport } from "./inventoryExportScript.ts";
import { runListExport } from "./listExportScript.ts";
import { runWordExport } from "./wordExportScript.ts";
import { runTriviaExport } from "./triviaExportScript.ts";

async function run(): Promise<void> {
  console.log("Running book export...");
  await runBookExport();

  console.log("Running inventory export...");
  await runInventoryExport();

  console.log("Running list export...");
  await runListExport();

  console.log("Running word export...");
  await runWordExport();

  console.log("Running trivia export...");
  await runTriviaExport();

  console.log("All exports complete.");
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
