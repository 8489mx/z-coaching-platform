import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import test from "node:test";

import ExcelJS from "exceljs";

import * as workbookToolApi from "../tools/nutrition-food-catalog-excel/index.js";
import {
  NUTRITION_FOOD_CATALOG_VERSION,
  NutritionFoodCatalogValidationError,
} from "z-coaching-intake-decision-engine/nutrition-food-catalog";

const execFileAsync = promisify(execFile);
const {
  NUTRITION_FOOD_CATALOG_WORKBOOK_VERSION,
  NutritionFoodCatalogWorkbookValidationError,
  createNutritionFoodCatalogWorkbook,
  importNutritionFoodCatalogWorkbook,
} = workbookToolApi;
const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(TEST_DIRECTORY, "..");
const TOOL_DIRECTORY = path.join(
  PROJECT_ROOT,
  "tools",
  "nutrition-food-catalog-excel",
);
const CLI_PATH = path.join(TOOL_DIRECTORY, "cli.js");
const OFFICIAL_TEMPLATE_PATH = path.join(
  PROJECT_ROOT,
  "data-templates",
  "nutrition-food-catalog-v1.xlsx",
);
const PACKAGE_PATH = path.join(PROJECT_ROOT, "package.json");

const SHEET_NAMES = Object.freeze([
  "Instructions",
  "Foods",
  "Nutrition",
  "Portions",
  "Patterns",
  "Markets",
  "Tags",
  "Swap_Groups",
  "_Lists",
]);

const HEADERS = Object.freeze({
  Foods: Object.freeze([
    "food_code",
    "name_ar",
    "name_en",
    "food_class",
    "food_state",
    "is_active",
    "selection_priority",
    "budget_level",
    "requires_storage",
    "requires_reheating",
    "source_type",
    "source_name",
    "source_reference",
    "source_checked_date",
  ]),
  Nutrition: Object.freeze([
    "food_code",
    "calories_kcal",
    "protein_g",
    "fat_g",
    "carbohydrate_g",
    "fiber_g",
  ]),
  Portions: Object.freeze([
    "food_code",
    "minimum_g",
    "maximum_g",
    "step_g",
    "default_g",
  ]),
  Patterns: Object.freeze(["food_code", "pattern_order", "pattern_code"]),
  Markets: Object.freeze(["food_code", "market_order", "market_code"]),
  Tags: Object.freeze(["food_code", "tag_type", "tag_order", "tag_code"]),
  Swap_Groups: Object.freeze(["food_code", "is_swappable", "group_code"]),
});

const DATA_SHEET_NAMES = Object.freeze(Object.keys(HEADERS));

function makeFoodRows(foodCode = "SYNTH_FOOD_A") {
  return {
    Foods: [[
      foodCode,
      `اسم ${foodCode}`,
      `Name ${foodCode}`,
      "STARCH",
      "COOKED",
      true,
      10,
      "MEDIUM",
      true,
      false,
      "COACH_VERIFIED",
      "Synthetic source",
      `REF-${foodCode}`,
      "2026-07-17",
    ]],
    Nutrition: [[foodCode, 130, 3, 1, 28, 2]],
    Portions: [[foodCode, 50, 250, 10, 150]],
    Patterns: [[foodCode, 1, "MAIN_CLASSIC"]],
    Markets: [[foodCode, 1, "EG"]],
    Tags: [[foodCode, "IDENTITY", 1, "SYNTHETIC_STARCH"]],
    Swap_Groups: [[foodCode, false, null]],
  };
}

function mergeFoodRows(...foodRowSets) {
  return Object.fromEntries(
    DATA_SHEET_NAMES.map((sheetName) => [
      sheetName,
      foodRowSets.flatMap((rows) => rows[sheetName]),
    ]),
  );
}

function setSheetRows(worksheet, rows, { startRow = 2 } = {}) {
  rows.forEach((values, index) => {
    worksheet.getRow(startRow + index).values = values;
  });
}

function applyRows(workbook, rowsBySheet) {
  for (const [sheetName, rows] of Object.entries(rowsBySheet)) {
    setSheetRows(workbook.getWorksheet(sheetName), rows);
  }
}

function isBlankCell(value) {
  return value === null || value === undefined || value === "";
}

function rowHasData(row, columnCount) {
  for (let column = 1; column <= columnCount; column += 1) {
    if (!isBlankCell(row.getCell(column).value)) {
      return true;
    }
  }
  return false;
}

function dataRows(worksheet, columnCount) {
  const rows = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    if (rowHasData(row, columnCount)) {
      rows.push(row);
    }
  }
  return rows;
}

async function withTempDirectory(callback) {
  const directory = await mkdtemp(path.join(tmpdir(), "zcc-food-excel-"));
  try {
    return await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function createWorkbookFixture(
  directory,
  {
    fileName = "fixture.xlsx",
    rows = makeFoodRows(),
    mutate,
  } = {},
) {
  const workbookPath = path.join(directory, fileName);
  await createNutritionFoodCatalogWorkbook(workbookPath);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);
  if (rows !== null) {
    applyRows(workbook, rows);
  }
  if (mutate) {
    await mutate(workbook);
  }
  await workbook.xlsx.writeFile(workbookPath);
  return workbookPath;
}

async function expectWorkbookIssue(workbookPath, code, predicate = () => true) {
  await assert.rejects(
    importNutritionFoodCatalogWorkbook(workbookPath),
    (error) => {
      assert.ok(error instanceof NutritionFoodCatalogWorkbookValidationError);
      assert.equal(error.name, "NutritionFoodCatalogWorkbookValidationError");
      assert.ok(Array.isArray(error.issues));
      assert.ok(
        error.issues.some((issue) => issue.code === code && predicate(issue)),
        `Expected ${code}; received ${JSON.stringify(error.issues)}`,
      );
      return true;
    },
  );
}

function getHeaderValues(worksheet, expectedLength) {
  return Array.from(
    { length: expectedLength },
    (_, index) => worksheet.getRow(1).getCell(index + 1).value,
  );
}

test("exports exactly the four internal workbook-tool interfaces", () => {
  assert.deepEqual(Object.keys(workbookToolApi).sort(), [
    "NUTRITION_FOOD_CATALOG_WORKBOOK_VERSION",
    "NutritionFoodCatalogWorkbookValidationError",
    "createNutritionFoodCatalogWorkbook",
    "importNutritionFoodCatalogWorkbook",
  ]);
  assert.equal(
    NUTRITION_FOOD_CATALOG_WORKBOOK_VERSION,
    "nutrition-food-catalog-workbook-v1",
  );
});

test("declares exceljs as a devDependency only and does not export the tool", async () => {
  const packageJson = JSON.parse(await readFile(PACKAGE_PATH, "utf8"));

  assert.equal(typeof packageJson.devDependencies.exceljs, "string");
  assert.equal(packageJson.dependencies?.exceljs, undefined);
  assert.equal(packageJson.exports["./nutrition-food-catalog-excel"], undefined);
});

test("generator creates an XLSX file that ExcelJS can open", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = path.join(directory, "generated.xlsx");
    await createNutritionFoodCatalogWorkbook(workbookPath);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(workbookPath);
    assert.equal(workbook.worksheets.length, 9);
  });
});

test("official generated template exists and is readable", async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(OFFICIAL_TEMPLATE_PATH);
  assert.equal(workbook.worksheets.length, 9);
});

test("creates the nine worksheets in the required exact order", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, { rows: null });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(workbookPath);
    assert.deepEqual(workbook.worksheets.map(({ name }) => name), SHEET_NAMES);
  });
});

test("hides the _Lists worksheet", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, { rows: null });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(workbookPath);
    assert.equal(workbook.getWorksheet("_Lists").state, "hidden");
  });
});

test("writes exact Instructions metadata", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, { rows: null });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(workbookPath);
    const instructions = workbook.getWorksheet("Instructions");

    assert.deepEqual(
      [2, 3, 4, 5].map((row) => instructions.getCell(`A${row}`).value),
      [
        "Workbook Version",
        "Target Catalog Version",
        "Nutrition Basis",
        "Supported Markets",
      ],
    );
    assert.deepEqual(
      [2, 3, 4, 5].map((row) => instructions.getCell(`B${row}`).value),
      [
        NUTRITION_FOOD_CATALOG_WORKBOOK_VERSION,
        NUTRITION_FOOD_CATALOG_VERSION,
        "PER_100G",
        "EG,SA,KW,BH,QA,AE",
      ],
    );
    assert.match(instructions.getCell("A8").value, /القيم الغذائية/u);
    assert.match(instructions.getCell("A15").value, /لا يحتوي مكتبة أطعمة إنتاجية/u);
  });
});

test("writes deterministic workbook properties", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, { rows: null });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(workbookPath);

    assert.equal(workbook.creator, "Z Coaching");
    assert.equal(workbook.company, "Z System's");
    assert.equal(workbook.title, "Nutrition Food Catalog V1");
    assert.equal(workbook.subject, "Food catalog data-entry template");
    assert.ok(workbook.created instanceof Date);
    assert.ok(workbook.modified instanceof Date);
  });
});

test("writes every data-sheet header in the exact order", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, { rows: null });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(workbookPath);

    for (const [sheetName, headers] of Object.entries(HEADERS)) {
      assert.deepEqual(getHeaderValues(workbook.getWorksheet(sheetName), headers.length), headers);
    }
  });
});

test("official template has headers only and no food data rows", async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(OFFICIAL_TEMPLATE_PATH);

  for (const [sheetName, headers] of Object.entries(HEADERS)) {
    assert.equal(dataRows(workbook.getWorksheet(sheetName), headers.length).length, 0);
  }
});

test("adds list validation to every required enum and boolean column", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, { rows: null });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(workbookPath);
    const cells = [
      ["Foods", "D2"], ["Foods", "E2"], ["Foods", "F2"],
      ["Foods", "H2"], ["Foods", "I2"], ["Foods", "J2"],
      ["Foods", "K2"], ["Patterns", "C2"], ["Markets", "C2"],
      ["Tags", "B2"], ["Swap_Groups", "B2"],
    ];

    for (const [sheetName, address] of cells) {
      const validation = workbook.getWorksheet(sheetName).getCell(address).dataValidation;
      assert.equal(validation.type, "list", `${sheetName}!${address}`);
      assert.ok(validation.formulae.length > 0, `${sheetName}!${address}`);
    }
  });
});

test("adds numeric validation to priorities nutrients portions and relation orders", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, { rows: null });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(workbookPath);
    const cells = [
      ["Foods", "G2"],
      ...["B2", "C2", "D2", "E2", "F2"].map((address) => ["Nutrition", address]),
      ...["B2", "C2", "D2", "E2"].map((address) => ["Portions", address]),
      ["Patterns", "B2"], ["Markets", "B2"], ["Tags", "C2"],
    ];

    for (const [sheetName, address] of cells) {
      const { type } = workbook.getWorksheet(sheetName).getCell(address).dataValidation;
      assert.ok(["whole", "decimal"].includes(type), `${sheetName}!${address}`);
    }
  });
});

test("freezes row one and enables AutoFilter on every data sheet", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, { rows: null });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(workbookPath);

    for (const sheetName of DATA_SHEET_NAMES) {
      const worksheet = workbook.getWorksheet(sheetName);
      assert.equal(worksheet.views[0].state, "frozen", sheetName);
      assert.equal(worksheet.views[0].ySplit, 1, sheetName);
      assert.ok(worksheet.autoFilter, sheetName);
    }
  });
});

test("keeps official enum lists in independent _Lists columns", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, { rows: null });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(workbookPath);
    const lists = workbook.getWorksheet("_Lists");
    const headings = lists.getRow(1).values.slice(1).filter(Boolean);

    assert.deepEqual(headings, [
      "NutritionFoodClass",
      "NutritionFoodState",
      "NutritionFoodSourceType",
      "NutritionMarketCode",
      "NutritionMealPatternCode",
      "BudgetLevel",
      "Boolean",
      "TagType",
    ]);
  });
});

test("imports the empty official template as a valid empty catalog", async () => {
  const catalog = await importNutritionFoodCatalogWorkbook(OFFICIAL_TEMPLATE_PATH);
  assert.equal(catalog.items_count, 0);
  assert.equal(catalog.active_items_count, 0);
  assert.deepEqual(catalog.items, []);
  assert.deepEqual(catalog.swap_groups, []);
});

test("round-trips a structurally valid workbook into the Food Item contract", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory);
    const catalog = await importNutritionFoodCatalogWorkbook(workbookPath);

    assert.equal(catalog.items_count, 1);
    assert.deepEqual(catalog.items[0], {
      food_code: "SYNTH_FOOD_A",
      name_ar: "اسم SYNTH_FOOD_A",
      name_en: "Name SYNTH_FOOD_A",
      food_class: "STARCH",
      food_state: "COOKED",
      is_active: true,
      selection_priority: 10,
      compatible_pattern_codes: ["MAIN_CLASSIC"],
      available_markets: ["EG"],
      budget_level: "MEDIUM",
      logistics: { requires_storage: true, requires_reheating: false },
      nutrition_per_100g: {
        calories_kcal: 130,
        protein_g: 3,
        fat_g: 1,
        carbohydrate_g: 28,
        fiber_g: 2,
      },
      portion_rule_g: { minimum_g: 50, maximum_g: 250, step_g: 10, default_g: 150 },
      tags: {
        identity_tags: ["SYNTHETIC_STARCH"],
        allergen_tags: [],
        intolerance_tags: [],
      },
      swap: { is_swappable: false, group_code: null },
      source: {
        type: "COACH_VERIFIED",
        name: "Synthetic source",
        reference: "REF-SYNTH_FOOD_A",
        checked_date: "2026-07-17",
      },
    });
    assert.ok(Object.isFrozen(catalog));
    assert.ok(Object.isFrozen(catalog.items[0]));
  });
});

test("preserves Food Item order from the Foods sheet", async () => {
  await withTempDirectory(async (directory) => {
    const rows = mergeFoodRows(makeFoodRows("SYNTH_FOOD_Z"), makeFoodRows("SYNTH_FOOD_A"));
    const workbookPath = await createWorkbookFixture(directory, { rows });
    const catalog = await importNutritionFoodCatalogWorkbook(workbookPath);
    assert.deepEqual(catalog.items.map(({ food_code }) => food_code), [
      "SYNTH_FOOD_Z",
      "SYNTH_FOOD_A",
    ]);
  });
});

test("sorts compatible patterns by pattern_order", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Patterns = [
      ["SYNTH_FOOD_A", 2, "MAIN_LEGUME"],
      ["SYNTH_FOOD_A", 1, "MAIN_CLASSIC"],
    ];
    const workbookPath = await createWorkbookFixture(directory, { rows });
    const catalog = await importNutritionFoodCatalogWorkbook(workbookPath);
    assert.deepEqual(catalog.items[0].compatible_pattern_codes, ["MAIN_CLASSIC", "MAIN_LEGUME"]);
  });
});

test("sorts available markets by market_order", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Markets = [["SYNTH_FOOD_A", 2, "SA"], ["SYNTH_FOOD_A", 1, "EG"]];
    const workbookPath = await createWorkbookFixture(directory, { rows });
    const catalog = await importNutritionFoodCatalogWorkbook(workbookPath);
    assert.deepEqual(catalog.items[0].available_markets, ["EG", "SA"]);
  });
});

test("keeps tag types separate and sorts each by tag_order", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Tags = [
      ["SYNTH_FOOD_A", "IDENTITY", 2, "SECOND_IDENTITY"],
      ["SYNTH_FOOD_A", "ALLERGEN", 1, "MILK"],
      ["SYNTH_FOOD_A", "IDENTITY", 1, "FIRST_IDENTITY"],
      ["SYNTH_FOOD_A", "INTOLERANCE", 1, "LACTOSE"],
    ];
    const workbookPath = await createWorkbookFixture(directory, { rows });
    const { tags } = (await importNutritionFoodCatalogWorkbook(workbookPath)).items[0];
    assert.deepEqual(tags, {
      identity_tags: ["FIRST_IDENTITY", "SECOND_IDENTITY"],
      allergen_tags: ["MILK"],
      intolerance_tags: ["LACTOSE"],
    });
  });
});

test("accepts native Excel boolean cells", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory);
    const item = (await importNutritionFoodCatalogWorkbook(workbookPath)).items[0];
    assert.equal(item.is_active, true);
    assert.equal(item.logistics.requires_storage, true);
    assert.equal(item.logistics.requires_reheating, false);
    assert.equal(item.swap.is_swappable, false);
  });
});

test("accepts exact TRUE and FALSE dropdown strings and converts them to booleans", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Foods[0][5] = "TRUE";
    rows.Foods[0][8] = "FALSE";
    rows.Foods[0][9] = "TRUE";
    rows.Swap_Groups[0][1] = "FALSE";
    const workbookPath = await createWorkbookFixture(directory, { rows });
    const item = (await importNutritionFoodCatalogWorkbook(workbookPath)).items[0];
    assert.equal(item.is_active, true);
    assert.equal(item.logistics.requires_storage, false);
    assert.equal(item.logistics.requires_reheating, true);
    assert.equal(item.swap.is_swappable, false);
  });
});

test("rejects unsupported boolean representations", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Foods[0][5] = "true";
    const workbookPath = await createWorkbookFixture(directory, { rows });
    await expectWorkbookIssue(
      workbookPath,
      "INVALID_CELL_VALUE",
      (issue) => issue.sheet === "Foods" && issue.column === "is_active",
    );
  });
});

test("converts an Excel Date cell deterministically to YYYY-MM-DD", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Foods[0][13] = new Date(Date.UTC(2025, 2, 4));
    const workbookPath = await createWorkbookFixture(directory, { rows });
    const item = (await importNutritionFoodCatalogWorkbook(workbookPath)).items[0];
    assert.equal(item.source.checked_date, "2025-03-04");
  });
});

test("preserves a YYYY-MM-DD source date string without modification", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Foods[0][13] = "2024-11-09";
    const workbookPath = await createWorkbookFixture(directory, { rows });
    const item = (await importNutritionFoodCatalogWorkbook(workbookPath)).items[0];
    assert.equal(item.source.checked_date, "2024-11-09");
  });
});

test("rejects numeric strings in nutrient columns instead of coercing them", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Nutrition[0][2] = "3";
    const workbookPath = await createWorkbookFixture(directory, { rows });
    await expectWorkbookIssue(
      workbookPath,
      "INVALID_CELL_VALUE",
      (issue) => issue.sheet === "Nutrition" && issue.column === "protein_g",
    );
  });
});

test("ignores fully blank rows between populated rows", async () => {
  await withTempDirectory(async (directory) => {
    const rows = mergeFoodRows(makeFoodRows("SYNTH_FOOD_A"), makeFoodRows("SYNTH_FOOD_B"));
    const workbookPath = await createWorkbookFixture(directory, {
      rows: null,
      mutate(workbook) {
        for (const sheetName of DATA_SHEET_NAMES) {
          const worksheet = workbook.getWorksheet(sheetName);
          worksheet.getRow(2).values = rows[sheetName][0];
          worksheet.getRow(4).values = rows[sheetName][1];
        }
      },
    });
    const catalog = await importNutritionFoodCatalogWorkbook(workbookPath);
    assert.deepEqual(catalog.items.map(({ food_code }) => food_code), ["SYNTH_FOOD_A", "SYNTH_FOOD_B"]);
  });
});

test("rejects a missing required worksheet", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, {
      mutate(workbook) {
        workbook.removeWorksheet(workbook.getWorksheet("Nutrition").id);
      },
    });
    await expectWorkbookIssue(workbookPath, "MISSING_WORKSHEET", ({ sheet }) => sheet === "Nutrition");
  });
});

test("rejects an unexpected extra worksheet", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, {
      mutate(workbook) {
        workbook.addWorksheet("Notes");
      },
    });
    await expectWorkbookIssue(workbookPath, "UNEXPECTED_WORKSHEET", ({ sheet }) => sheet === "Notes");
  });
});

test("rejects an invalid workbook version", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, {
      mutate(workbook) {
        workbook.getWorksheet("Instructions").getCell("B2").value = "wrong-workbook-version";
      },
    });
    await expectWorkbookIssue(workbookPath, "INVALID_WORKBOOK_VERSION");
  });
});

test("rejects an invalid target catalog version", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, {
      mutate(workbook) {
        workbook.getWorksheet("Instructions").getCell("B3").value = "wrong-catalog-version";
      },
    });
    await expectWorkbookIssue(workbookPath, "INVALID_TARGET_CATALOG_VERSION");
  });
});

test("rejects an invalid nutrition basis", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, {
      mutate(workbook) {
        workbook.getWorksheet("Instructions").getCell("B4").value = "PER_SERVING";
      },
    });
    await expectWorkbookIssue(workbookPath, "INVALID_NUTRITION_BASIS");
  });
});

test("rejects a missing header", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, {
      mutate(workbook) {
        workbook.getWorksheet("Nutrition").getCell("F1").value = null;
      },
    });
    await expectWorkbookIssue(workbookPath, "INVALID_HEADER_ROW", ({ sheet }) => sheet === "Nutrition");
  });
});

test("rejects an extra unknown header", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, {
      mutate(workbook) {
        workbook.getWorksheet("Nutrition").getCell("G1").value = "serving_size";
      },
    });
    await expectWorkbookIssue(workbookPath, "UNKNOWN_COLUMN", ({ sheet }) => sheet === "Nutrition");
  });
});

test("rejects a reordered header row", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, {
      mutate(workbook) {
        const sheet = workbook.getWorksheet("Nutrition");
        [sheet.getCell("B1").value, sheet.getCell("C1").value] = [
          sheet.getCell("C1").value,
          sheet.getCell("B1").value,
        ];
      },
    });
    await expectWorkbookIssue(workbookPath, "INVALID_HEADER_ROW", ({ sheet }) => sheet === "Nutrition");
  });
});

test("rejects duplicate headers", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, {
      mutate(workbook) {
        workbook.getWorksheet("Nutrition").getCell("C1").value = "calories_kcal";
      },
    });
    await expectWorkbookIssue(workbookPath, "DUPLICATE_HEADER", ({ sheet }) => sheet === "Nutrition");
  });
});

test("rejects duplicate Foods rows for one food_code", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Foods.push([...rows.Foods[0]]);
    const workbookPath = await createWorkbookFixture(directory, { rows });
    await expectWorkbookIssue(workbookPath, "DUPLICATE_FOOD_ROW");
  });
});

test("rejects duplicate Nutrition rows for one food_code", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Nutrition.push([...rows.Nutrition[0]]);
    const workbookPath = await createWorkbookFixture(directory, { rows });
    await expectWorkbookIssue(workbookPath, "DUPLICATE_NUTRITION_ROW");
  });
});

test("rejects duplicate Portions rows for one food_code", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Portions.push([...rows.Portions[0]]);
    const workbookPath = await createWorkbookFixture(directory, { rows });
    await expectWorkbookIssue(workbookPath, "DUPLICATE_PORTION_ROW");
  });
});

test("rejects duplicate Swap_Groups rows for one food_code", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Swap_Groups.push([...rows.Swap_Groups[0]]);
    const workbookPath = await createWorkbookFixture(directory, { rows });
    await expectWorkbookIssue(workbookPath, "DUPLICATE_SWAP_ROW");
  });
});

test("rejects orphan food references in every relation sheet", async () => {
  for (const sheetName of ["Nutrition", "Portions", "Patterns", "Markets", "Tags", "Swap_Groups"]) {
    await withTempDirectory(async (directory) => {
      const rows = makeFoodRows();
      rows[sheetName].push(["ORPHAN_FOOD", ...rows[sheetName][0].slice(1)]);
      const workbookPath = await createWorkbookFixture(directory, { rows });
      await expectWorkbookIssue(
        workbookPath,
        "ORPHAN_FOOD_REFERENCE",
        ({ sheet }) => sheet === sheetName,
      );
    });
  }
});

test("rejects a Food without its Nutrition row", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Nutrition = [];
    const workbookPath = await createWorkbookFixture(directory, { rows });
    await expectWorkbookIssue(workbookPath, "MISSING_NUTRITION_ROW");
  });
});

test("rejects a Food without its Portions row", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Portions = [];
    const workbookPath = await createWorkbookFixture(directory, { rows });
    await expectWorkbookIssue(workbookPath, "MISSING_PORTION_ROW");
  });
});

test("rejects a Food without its Swap_Groups row", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Swap_Groups = [];
    const workbookPath = await createWorkbookFixture(directory, { rows });
    await expectWorkbookIssue(workbookPath, "MISSING_SWAP_ROW");
  });
});

test("rejects a Food without any Pattern row", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Patterns = [];
    const workbookPath = await createWorkbookFixture(directory, { rows });
    await expectWorkbookIssue(workbookPath, "MISSING_PATTERN_ROW");
  });
});

test("rejects a Food without any Market row", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Markets = [];
    const workbookPath = await createWorkbookFixture(directory, { rows });
    await expectWorkbookIssue(workbookPath, "MISSING_MARKET_ROW");
  });
});

test("rejects a Food without an IDENTITY Tag row", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Tags = [["SYNTH_FOOD_A", "ALLERGEN", 1, "MILK"]];
    const workbookPath = await createWorkbookFixture(directory, { rows });
    await expectWorkbookIssue(workbookPath, "MISSING_IDENTITY_TAG_ROW");
  });
});

test("rejects duplicate or gapped Pattern order sequences", async () => {
  for (const patternRows of [
    [["SYNTH_FOOD_A", 1, "MAIN_CLASSIC"], ["SYNTH_FOOD_A", 1, "MAIN_LEGUME"]],
    [["SYNTH_FOOD_A", 1, "MAIN_CLASSIC"], ["SYNTH_FOOD_A", 3, "MAIN_LEGUME"]],
  ]) {
    await withTempDirectory(async (directory) => {
      const rows = makeFoodRows();
      rows.Patterns = patternRows;
      const workbookPath = await createWorkbookFixture(directory, { rows });
      await assert.rejects(
        importNutritionFoodCatalogWorkbook(workbookPath),
        (error) => error.issues.some(({ code }) => [
          "DUPLICATE_RELATION_ORDER",
          "INVALID_RELATION_ORDER",
        ].includes(code)),
      );
    });
  }
});

test("rejects duplicate or gapped Market order sequences", async () => {
  for (const marketRows of [
    [["SYNTH_FOOD_A", 1, "EG"], ["SYNTH_FOOD_A", 1, "SA"]],
    [["SYNTH_FOOD_A", 2, "EG"]],
  ]) {
    await withTempDirectory(async (directory) => {
      const rows = makeFoodRows();
      rows.Markets = marketRows;
      const workbookPath = await createWorkbookFixture(directory, { rows });
      await assert.rejects(
        importNutritionFoodCatalogWorkbook(workbookPath),
        (error) => error.issues.some(({ code }) => [
          "DUPLICATE_RELATION_ORDER",
          "INVALID_RELATION_ORDER",
        ].includes(code)),
      );
    });
  }
});

test("rejects duplicate or gapped Tag order within food_code and tag_type", async () => {
  for (const tagRows of [
    [["SYNTH_FOOD_A", "IDENTITY", 1, "TAG_A"], ["SYNTH_FOOD_A", "IDENTITY", 1, "TAG_B"]],
    [["SYNTH_FOOD_A", "IDENTITY", 2, "TAG_A"]],
  ]) {
    await withTempDirectory(async (directory) => {
      const rows = makeFoodRows();
      rows.Tags = tagRows;
      const workbookPath = await createWorkbookFixture(directory, { rows });
      await assert.rejects(
        importNutritionFoodCatalogWorkbook(workbookPath),
        (error) => error.issues.some(({ code }) => [
          "DUPLICATE_RELATION_ORDER",
          "INVALID_RELATION_ORDER",
        ].includes(code)),
      );
    });
  }
});

test("sorts workbook issues deterministically by sheet row and header column", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Foods[0][5] = "Yes";
    rows.Nutrition[0][2] = "3";
    rows.Portions[0][1] = "50";
    const workbookPath = await createWorkbookFixture(directory, { rows });

    await assert.rejects(importNutritionFoodCatalogWorkbook(workbookPath), (error) => {
      const sheetOrder = new Map(SHEET_NAMES.map((name, index) => [name, index]));
      const positions = error.issues.map((issue) => [
        sheetOrder.get(issue.sheet) ?? -1,
        issue.row ?? -1,
        issue.column === null ? -1 : (HEADERS[issue.sheet]?.indexOf(issue.column) ?? -1),
      ]);
      const sorted = structuredClone(positions).sort((left, right) => (
        left[0] - right[0] || left[1] - right[1] || left[2] - right[2]
      ));
      assert.deepEqual(positions, sorted);
      return true;
    });
  });
});

test("passes domain violations through as NutritionFoodCatalogValidationError", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows("invalid-lowercase-code");
    const workbookPath = await createWorkbookFixture(directory, { rows });
    await assert.rejects(
      importNutritionFoodCatalogWorkbook(workbookPath),
      (error) => {
        assert.ok(error instanceof NutritionFoodCatalogValidationError);
        assert.equal(error instanceof NutritionFoodCatalogWorkbookValidationError, false);
        return true;
      },
    );
  });
});

test("does not trim user text before domain validation", async () => {
  await withTempDirectory(async (directory) => {
    const rows = makeFoodRows();
    rows.Foods[0][2] = " Padded name ";
    const workbookPath = await createWorkbookFixture(directory, { rows });
    await assert.rejects(
      importNutritionFoodCatalogWorkbook(workbookPath),
      (error) => error instanceof NutritionFoodCatalogValidationError,
    );
  });
});

test("CLI prints catalog JSON to stdout when no output path is supplied", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory);
    const { stdout, stderr } = await execFileAsync(process.execPath, [CLI_PATH, workbookPath], {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
    });
    const catalog = JSON.parse(stdout);
    assert.equal(catalog.items_count, 1);
    assert.equal(stderr, "");
  });
});

test("CLI writes pretty JSON with a trailing newline when output path is supplied", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory);
    const outputPath = path.join(directory, "catalog.json");
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [CLI_PATH, workbookPath, outputPath],
      { cwd: PROJECT_ROOT, encoding: "utf8" },
    );
    const json = await readFile(outputPath, "utf8");
    assert.equal(JSON.parse(json).items_count, 1);
    assert.match(json, /\n  "items_count"/u);
    assert.ok(json.endsWith("\n"));
    assert.match(stdout, /success|written|catalog/iu);
    assert.equal(stderr, "");
  });
});

test("CLI reports validation issues and does not write a partial output file", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory, {
      mutate(workbook) {
        workbook.removeWorksheet(workbook.getWorksheet("Nutrition").id);
      },
    });
    const outputPath = path.join(directory, "must-not-exist.json");

    await assert.rejects(
      execFileAsync(process.execPath, [CLI_PATH, workbookPath, outputPath], {
        cwd: PROJECT_ROOT,
        encoding: "utf8",
      }),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /MISSING_WORKSHEET/u);
        return true;
      },
    );
    await assert.rejects(readFile(outputPath), { code: "ENOENT" });
  });
});

test("reports WORKBOOK_PATH_REQUIRED for a missing importer path", async () => {
  await assert.rejects(importNutritionFoodCatalogWorkbook(), (error) => {
    assert.ok(error instanceof NutritionFoodCatalogWorkbookValidationError);
    assert.equal(error.issues[0].code, "WORKBOOK_PATH_REQUIRED");
    assert.equal(error.issues[0].row, null);
    assert.equal(error.issues[0].column, null);
    return true;
  });
});

test("reports WORKBOOK_READ_FAILED for an unreadable workbook", async () => {
  await withTempDirectory(async (directory) => {
    await expectWorkbookIssue(path.join(directory, "missing.xlsx"), "WORKBOOK_READ_FAILED");
  });
});

test("import leaves the XLSX input bytes unchanged", async () => {
  await withTempDirectory(async (directory) => {
    const workbookPath = await createWorkbookFixture(directory);
    const before = await readFile(workbookPath);
    await importNutritionFoodCatalogWorkbook(workbookPath);
    const after = await readFile(workbookPath);
    assert.deepEqual(after, before);
  });
});

test("ships one empty final XLSX template and no food-data seed files", async () => {
  const templateFiles = (await readdir(path.dirname(OFFICIAL_TEMPLATE_PATH)))
    .filter((name) => name.toLowerCase().endsWith(".xlsx"));
  assert.deepEqual(templateFiles, ["nutrition-food-catalog-v1.xlsx"]);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(OFFICIAL_TEMPLATE_PATH);
  assert.equal(dataRows(workbook.getWorksheet("Foods"), HEADERS.Foods.length).length, 0);
});
