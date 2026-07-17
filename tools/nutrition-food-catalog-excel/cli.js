import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { importNutritionFoodCatalogWorkbook } from "./import-workbook.js";

function formatIssue(issue) {
  if ("sheet" in issue) {
    const location = [
      issue.sheet ?? "Workbook",
      issue.row === null ? null : `row ${issue.row}`,
      issue.column === null ? null : `column ${issue.column}`,
    ].filter(Boolean).join(", ");
    return `[${issue.code}] ${location}: ${issue.message}`;
  }
  const location = typeof issue.path === "string" ? ` ${issue.path}:` : "";
  return `[${issue.code}]${location} ${issue.message}`;
}

function printError(error) {
  if (Array.isArray(error?.issues)) {
    for (const validationIssue of error.issues) {
      process.stderr.write(`${formatIssue(validationIssue)}\n`);
    }
    return;
  }
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
}

/** @param {string[]} args */
async function run(args) {
  const [inputPath, outputPath] = args;
  try {
    const catalog = await importNutritionFoodCatalogWorkbook(inputPath);
    const json = `${JSON.stringify(catalog, null, 2)}\n`;
    if (outputPath === undefined) {
      process.stdout.write(json);
      return;
    }

    await writeFile(outputPath, json, "utf8");
    process.stdout.write(`Nutrition food catalog JSON written to ${outputPath}.\n`);
  } catch (error) {
    printError(error);
    process.exitCode = 1;
  }
}

const entryPoint = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : null;
if (entryPoint === import.meta.url) {
  await run(process.argv.slice(2));
}
