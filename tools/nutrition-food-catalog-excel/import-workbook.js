import ExcelJS from "exceljs";
import {
  NUTRITION_FOOD_CATALOG_VERSION,
  buildNutritionFoodCatalog,
} from "z-coaching-intake-decision-engine/nutrition-food-catalog";
import {
  DATA_WORKSHEET_NAMES,
  INSTRUCTIONS_METADATA,
  TAG_TYPE_VALUES,
  WORKSHEET_HEADERS,
  WORKSHEET_ORDER,
} from "./workbook-schema.js";
import { NutritionFoodCatalogWorkbookValidationError } from "./validation-error.js";

const FIELD_TYPES = Object.freeze({
  Foods: Object.freeze({
    food_code: "text",
    name_ar: "text",
    name_en: "text",
    food_class: "text",
    food_state: "text",
    is_active: "boolean",
    selection_priority: "number",
    budget_level: "text",
    requires_storage: "boolean",
    requires_reheating: "boolean",
    source_type: "text",
    source_name: "text",
    source_reference: "text",
    source_checked_date: "date",
  }),
  Nutrition: Object.freeze({
    food_code: "text",
    calories_kcal: "number",
    protein_g: "number",
    fat_g: "number",
    carbohydrate_g: "number",
    fiber_g: "number",
  }),
  Portions: Object.freeze({
    food_code: "text",
    minimum_g: "number",
    maximum_g: "number",
    step_g: "number",
    default_g: "number",
  }),
  Patterns: Object.freeze({
    food_code: "text",
    pattern_order: "positive_integer",
    pattern_code: "text",
  }),
  Markets: Object.freeze({
    food_code: "text",
    market_order: "positive_integer",
    market_code: "text",
  }),
  Tags: Object.freeze({
    food_code: "text",
    tag_type: "tag_type",
    tag_order: "positive_integer",
    tag_code: "text",
  }),
  Swap_Groups: Object.freeze({
    food_code: "text",
    is_swappable: "boolean",
    group_code: "nullable_text",
  }),
});

const DUPLICATE_ROW_CODES = Object.freeze({
  Foods: "DUPLICATE_FOOD_ROW",
  Nutrition: "DUPLICATE_NUTRITION_ROW",
  Portions: "DUPLICATE_PORTION_ROW",
  Swap_Groups: "DUPLICATE_SWAP_ROW",
});

const MISSING_RELATION_CODES = Object.freeze({
  Nutrition: "MISSING_NUTRITION_ROW",
  Portions: "MISSING_PORTION_ROW",
  Swap_Groups: "MISSING_SWAP_ROW",
  Patterns: "MISSING_PATTERN_ROW",
  Markets: "MISSING_MARKET_ROW",
});

function issue(sheet, row, column, code, message) {
  return { sheet, row, column, code, message };
}

function columnPosition(sheet, column) {
  if (column === null) {
    return -1;
  }
  return (WORKSHEET_HEADERS[sheet] ?? []).indexOf(column);
}

function sortIssues(issues) {
  const sheetPositions = new Map(
    WORKSHEET_ORDER.map((sheetName, index) => [sheetName, index]),
  );
  return issues.sort((left, right) => {
    const leftSheet = left.sheet === null
      ? -1
      : (sheetPositions.get(left.sheet) ?? Number.MAX_SAFE_INTEGER);
    const rightSheet = right.sheet === null
      ? -1
      : (sheetPositions.get(right.sheet) ?? Number.MAX_SAFE_INTEGER);
    if (leftSheet !== rightSheet) {
      return leftSheet - rightSheet;
    }

    const leftRow = left.row ?? -1;
    const rightRow = right.row ?? -1;
    if (leftRow !== rightRow) {
      return leftRow - rightRow;
    }

    const leftColumn = columnPosition(left.sheet, left.column);
    const rightColumn = columnPosition(right.sheet, right.column);
    if (leftColumn !== rightColumn) {
      return leftColumn - rightColumn;
    }

    if (left.code !== right.code) {
      return left.code < right.code ? -1 : 1;
    }
    if (left.message !== right.message) {
      return left.message < right.message ? -1 : 1;
    }
    return 0;
  });
}

function throwIssues(issues) {
  throw new NutritionFoodCatalogWorkbookValidationError(sortIssues(issues));
}

function isBlankCell(value) {
  return value === null || value === undefined;
}

function formatExcelDate(value) {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    return null;
  }
  const year = String(value.getUTCFullYear()).padStart(4, "0");
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function convertCellValue(value, type) {
  if (type === "nullable_text" && (isBlankCell(value) || value === "")) {
    return { valid: true, value: null };
  }
  if (type === "text") {
    return { valid: typeof value === "string" && value.length > 0, value };
  }
  if (type === "number") {
    return { valid: typeof value === "number" && Number.isFinite(value), value };
  }
  if (type === "positive_integer") {
    return {
      valid: typeof value === "number" && Number.isInteger(value) && value > 0,
      value,
    };
  }
  if (type === "boolean") {
    if (typeof value === "boolean") {
      return { valid: true, value };
    }
    if (value === "TRUE") {
      return { valid: true, value: true };
    }
    if (value === "FALSE") {
      return { valid: true, value: false };
    }
    return { valid: false, value };
  }
  if (type === "date") {
    if (typeof value === "string" && value.length > 0) {
      return { valid: true, value };
    }
    const formatted = formatExcelDate(value);
    return { valid: formatted !== null, value: formatted ?? value };
  }
  if (type === "tag_type") {
  return { valid: TAG_TYPE_VALUES.includes(value), value };
  }
  if (type === "nullable_text") {
    return { valid: typeof value === "string", value };
  }
  return { valid: false, value };
}

function expectedCellDescription(type) {
  if (type === "number") {
    return "a numeric cell";
  }
  if (type === "positive_integer") {
    return "a positive integer numeric cell";
  }
  if (type === "boolean") {
    return "an Excel boolean or the exact text TRUE/FALSE";
  }
  if (type === "date") {
    return "a YYYY-MM-DD string or an Excel date cell";
  }
  if (type === "tag_type") {
    return "one of IDENTITY, ALLERGEN, or INTOLERANCE";
  }
  return "a non-empty string cell";
}

function validateWorksheetSet(workbook, issues) {
  const actualNames = workbook.worksheets.map((worksheet) => worksheet.name);
  const actualSet = new Set(actualNames);

  for (const sheetName of WORKSHEET_ORDER) {
    if (!actualSet.has(sheetName)) {
      issues.push(issue(
        sheetName,
        null,
        null,
        "MISSING_WORKSHEET",
        `Required worksheet ${sheetName} is missing.`,
      ));
    }
  }

  for (const sheetName of actualNames) {
    if (!WORKSHEET_ORDER.includes(sheetName)) {
      issues.push(issue(
        sheetName,
        null,
        null,
        "UNEXPECTED_WORKSHEET",
        `Worksheet ${sheetName} is not allowed in workbook V1.`,
      ));
    }
  }

  if (
    actualNames.length === WORKSHEET_ORDER.length
    && actualNames.every((name) => WORKSHEET_ORDER.includes(name))
    && actualNames.some((name, index) => name !== WORKSHEET_ORDER[index])
  ) {
    issues.push(issue(
      null,
      null,
      null,
      "INVALID_WORKSHEET_ORDER",
      `Worksheets must appear in this order: ${WORKSHEET_ORDER.join(", ")}.`,
    ));
  }
}

function validateMetadata(workbook, issues) {
  const instructions = workbook.getWorksheet("Instructions");
  if (!instructions) {
    return;
  }
  const valueIssueCodes = [
    "INVALID_WORKBOOK_VERSION",
    "INVALID_TARGET_CATALOG_VERSION",
    "INVALID_NUTRITION_BASIS",
    "INVALID_SUPPORTED_MARKETS",
  ];
  INSTRUCTIONS_METADATA.forEach((metadata, index) => {
    const rowNumber = index + 2;
    const expectedValue = index === 1
      ? NUTRITION_FOOD_CATALOG_VERSION
      : metadata.value;
    if (instructions.getCell(`A${rowNumber}`).value !== metadata.label) {
      issues.push(issue(
        "Instructions",
        rowNumber,
        "A",
        "INVALID_INSTRUCTIONS_METADATA",
        `Instructions A${rowNumber} must be ${metadata.label}.`,
      ));
    }
    if (instructions.getCell(`B${rowNumber}`).value !== expectedValue) {
      issues.push(issue(
        "Instructions",
        rowNumber,
        "B",
        valueIssueCodes[index],
        `${metadata.label} must be ${expectedValue}.`,
      ));
    }
  });
}

function validateHeaders(workbook, issues) {
  for (const sheetName of DATA_WORKSHEET_NAMES) {
    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
      continue;
    }
    const expected = WORKSHEET_HEADERS[sheetName];
    const headerRow = worksheet.getRow(1);
    const cellCount = Math.max(expected.length, headerRow.cellCount);
    const firstPosition = new Map();

    for (let index = 1; index <= cellCount; index += 1) {
      const value = headerRow.getCell(index).value;
      const expectedValue = expected[index - 1];
      if (typeof value === "string" && value.length > 0) {
        if (firstPosition.has(value)) {
          issues.push(issue(
            sheetName,
            1,
            value,
            "DUPLICATE_HEADER",
            `Header ${value} is duplicated.`,
          ));
          continue;
        }
        firstPosition.set(value, index);
      }

      if (expectedValue === undefined && !isBlankCell(value)) {
        issues.push(issue(
          sheetName,
          1,
          typeof value === "string" ? value : null,
          "UNKNOWN_COLUMN",
          `Column ${String(value)} is not allowed in ${sheetName}.`,
        ));
      } else if (
        !isBlankCell(value)
        && typeof value === "string"
        && !expected.includes(value)
      ) {
        issues.push(issue(
          sheetName,
          1,
          value,
          "UNKNOWN_COLUMN",
          `Column ${value} is not allowed in ${sheetName}.`,
        ));
      } else if (value !== expectedValue) {
        issues.push(issue(
          sheetName,
          1,
          expectedValue ?? null,
          "INVALID_HEADER_ROW",
          `Column ${index} in ${sheetName} must be ${expectedValue ?? "absent"}.`,
        ));
      }
    }
  }
}

function parseWorksheetRows(worksheet, issues) {
  const sheetName = worksheet.name;
  const headers = WORKSHEET_HEADERS[sheetName];
  const rows = [];

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const rawValues = headers.map((_, index) => row.getCell(index + 1).value);
    if (rawValues.every(isBlankCell)) {
      continue;
    }

    const record = { _row: rowNumber };
    headers.forEach((column, index) => {
      const type = FIELD_TYPES[sheetName][column];
      const converted = convertCellValue(rawValues[index], type);
      record[column] = converted.value;
      if (!converted.valid) {
        issues.push(issue(
          sheetName,
          rowNumber,
          column,
          "INVALID_CELL_VALUE",
          `${column} must be ${expectedCellDescription(type)}.`,
        ));
      }
    });
    rows.push(record);
  }
  return rows;
}

function isUsableFoodCode(value) {
  return typeof value === "string" && value.length > 0;
}

function validateDuplicateRows(records, sheetName, issues) {
  const firstRows = new Map();
  for (const record of records) {
    if (!isUsableFoodCode(record.food_code)) {
      continue;
    }
    if (firstRows.has(record.food_code)) {
      issues.push(issue(
        sheetName,
        record._row,
        "food_code",
        DUPLICATE_ROW_CODES[sheetName],
        `${record.food_code} has more than one row in ${sheetName}.`,
      ));
    } else {
      firstRows.set(record.food_code, record._row);
    }
  }
}

function validateOrphans(recordsBySheet, foodCodes, issues) {
  for (const sheetName of DATA_WORKSHEET_NAMES.slice(1)) {
    for (const record of recordsBySheet[sheetName]) {
      if (isUsableFoodCode(record.food_code) && !foodCodes.has(record.food_code)) {
        issues.push(issue(
          sheetName,
          record._row,
          "food_code",
          "ORPHAN_FOOD_REFERENCE",
          `${record.food_code} does not exist in Foods.`,
        ));
      }
    }
  }
}

function recordsByFoodCode(records) {
  const map = new Map();
  for (const record of records) {
    if (!isUsableFoodCode(record.food_code)) {
      continue;
    }
    const group = map.get(record.food_code) ?? [];
    group.push(record);
    map.set(record.food_code, group);
  }
  return map;
}

function validateRequiredRelations(recordsBySheet, foods, issues) {
  for (const sheetName of ["Nutrition", "Portions", "Swap_Groups", "Patterns", "Markets"]) {
    const groups = recordsByFoodCode(recordsBySheet[sheetName]);
    for (const food of foods) {
      if (isUsableFoodCode(food.food_code) && !groups.has(food.food_code)) {
        issues.push(issue(
          sheetName,
          null,
          "food_code",
          MISSING_RELATION_CODES[sheetName],
          `${food.food_code} requires a row in ${sheetName}.`,
        ));
      }
    }
  }

  const identityGroups = recordsByFoodCode(
    recordsBySheet.Tags.filter((record) => record.tag_type === "IDENTITY"),
  );
  for (const food of foods) {
    if (isUsableFoodCode(food.food_code) && !identityGroups.has(food.food_code)) {
      issues.push(issue(
        "Tags",
        null,
        "tag_type",
        "MISSING_IDENTITY_TAG_ROW",
        `${food.food_code} requires at least one IDENTITY tag.`,
      ));
    }
  }
}

function validateOrderedGroups(records, sheetName, orderColumn, groupKey, issues) {
  const groups = new Map();
  for (const record of records) {
    const key = groupKey(record);
    if (key === null) {
      continue;
    }
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }

  for (const group of groups.values()) {
    if (group.some((record) => !Number.isInteger(record[orderColumn]) || record[orderColumn] <= 0)) {
      continue;
    }
    const sorted = [...group].sort(
      (left, right) => left[orderColumn] - right[orderColumn] || left._row - right._row,
    );
    const firstByOrder = new Map();
    let hasDuplicate = false;
    for (const record of sorted) {
      const order = record[orderColumn];
      if (firstByOrder.has(order)) {
        hasDuplicate = true;
        issues.push(issue(
          sheetName,
          record._row,
          orderColumn,
          "DUPLICATE_RELATION_ORDER",
          `${orderColumn} ${order} is duplicated within its relation group.`,
        ));
      } else {
        firstByOrder.set(order, record._row);
      }
    }
    if (hasDuplicate) {
      continue;
    }
    sorted.forEach((record, index) => {
      const expected = index + 1;
      if (record[orderColumn] !== expected) {
        issues.push(issue(
          sheetName,
          record._row,
          orderColumn,
          "INVALID_RELATION_ORDER",
          `${orderColumn} must start at 1 and remain contiguous; expected ${expected}.`,
        ));
      }
    });
  }
}

function validateRelations(recordsBySheet, issues) {
  for (const sheetName of Object.keys(DUPLICATE_ROW_CODES)) {
    validateDuplicateRows(recordsBySheet[sheetName], sheetName, issues);
  }

  const foodCodes = new Set(
    recordsBySheet.Foods
      .map((record) => record.food_code)
      .filter(isUsableFoodCode),
  );
  validateOrphans(recordsBySheet, foodCodes, issues);
  validateRequiredRelations(recordsBySheet, recordsBySheet.Foods, issues);

  validateOrderedGroups(
    recordsBySheet.Patterns,
    "Patterns",
    "pattern_order",
    (record) => isUsableFoodCode(record.food_code) ? record.food_code : null,
    issues,
  );
  validateOrderedGroups(
    recordsBySheet.Markets,
    "Markets",
    "market_order",
    (record) => isUsableFoodCode(record.food_code) ? record.food_code : null,
    issues,
  );
  validateOrderedGroups(
    recordsBySheet.Tags,
    "Tags",
    "tag_order",
    (record) => (
      isUsableFoodCode(record.food_code) && TAG_TYPE_VALUES.includes(record.tag_type)
        ? `${record.food_code}\u0000${record.tag_type}`
        : null
    ),
    issues,
  );
}

function firstRecordMap(records) {
  const map = new Map();
  for (const record of records) {
    if (!map.has(record.food_code)) {
      map.set(record.food_code, record);
    }
  }
  return map;
}

function orderedValues(records, orderColumn, valueColumn) {
  return [...records]
    .sort((left, right) => left[orderColumn] - right[orderColumn] || left._row - right._row)
    .map((record) => record[valueColumn]);
}

function buildItems(recordsBySheet) {
  const nutrition = firstRecordMap(recordsBySheet.Nutrition);
  const portions = firstRecordMap(recordsBySheet.Portions);
  const swaps = firstRecordMap(recordsBySheet.Swap_Groups);
  const patterns = recordsByFoodCode(recordsBySheet.Patterns);
  const markets = recordsByFoodCode(recordsBySheet.Markets);
  const tagsByFoodAndType = new Map();
  for (const tag of recordsBySheet.Tags) {
    const key = `${tag.food_code}\u0000${tag.tag_type}`;
    const group = tagsByFoodAndType.get(key) ?? [];
    group.push(tag);
    tagsByFoodAndType.set(key, group);
  }

  return recordsBySheet.Foods.map((food) => {
    const nutritionRow = nutrition.get(food.food_code);
    const portionRow = portions.get(food.food_code);
    const swapRow = swaps.get(food.food_code);
    const tagValues = (type) => orderedValues(
      tagsByFoodAndType.get(`${food.food_code}\u0000${type}`) ?? [],
      "tag_order",
      "tag_code",
    );
    return {
      food_code: food.food_code,
      name_ar: food.name_ar,
      name_en: food.name_en,
      food_class: food.food_class,
      food_state: food.food_state,
      is_active: food.is_active,
      selection_priority: food.selection_priority,
      compatible_pattern_codes: orderedValues(
        patterns.get(food.food_code) ?? [],
        "pattern_order",
        "pattern_code",
      ),
      available_markets: orderedValues(
        markets.get(food.food_code) ?? [],
        "market_order",
        "market_code",
      ),
      budget_level: food.budget_level,
      logistics: {
        requires_storage: food.requires_storage,
        requires_reheating: food.requires_reheating,
      },
      nutrition_per_100g: {
        calories_kcal: nutritionRow.calories_kcal,
        protein_g: nutritionRow.protein_g,
        fat_g: nutritionRow.fat_g,
        carbohydrate_g: nutritionRow.carbohydrate_g,
        fiber_g: nutritionRow.fiber_g,
      },
      portion_rule_g: {
        minimum_g: portionRow.minimum_g,
        maximum_g: portionRow.maximum_g,
        step_g: portionRow.step_g,
        default_g: portionRow.default_g,
      },
      tags: {
        identity_tags: tagValues("IDENTITY"),
        allergen_tags: tagValues("ALLERGEN"),
        intolerance_tags: tagValues("INTOLERANCE"),
      },
      swap: {
        is_swappable: swapRow.is_swappable,
        group_code: swapRow.group_code,
      },
      source: {
        type: food.source_type,
        name: food.source_name,
        reference: food.source_reference,
        checked_date: food.source_checked_date,
      },
    };
  });
}

/**
 * Imports a workbook, validates its Excel structure, and delegates all food
 * contract validation to the public nutrition food catalog builder.
 *
 * @param {string} inputPath
 * @returns {Promise<import("../../src/nutrition-food-catalog/domain/contracts.js").NutritionFoodCatalog>}
 * @throws {NutritionFoodCatalogWorkbookValidationError}
 */
export async function importNutritionFoodCatalogWorkbook(inputPath) {
  if (typeof inputPath !== "string" || inputPath.trim().length === 0) {
    throwIssues([
      issue(
        null,
        null,
        null,
        "WORKBOOK_PATH_REQUIRED",
        "A workbook path is required.",
      ),
    ]);
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(inputPath);
  } catch {
    throwIssues([
      issue(
        null,
        null,
        null,
        "WORKBOOK_READ_FAILED",
        "The workbook could not be read as an XLSX file.",
      ),
    ]);
  }

  const structureIssues = [];
  validateWorksheetSet(workbook, structureIssues);
  validateMetadata(workbook, structureIssues);
  validateHeaders(workbook, structureIssues);
  if (structureIssues.length > 0) {
    throwIssues(structureIssues);
  }

  const workbookIssues = [];
  const recordsBySheet = Object.fromEntries(
    DATA_WORKSHEET_NAMES.map((sheetName) => [
      sheetName,
      parseWorksheetRows(workbook.getWorksheet(sheetName), workbookIssues),
    ]),
  );
  validateRelations(recordsBySheet, workbookIssues);
  if (workbookIssues.length > 0) {
    throwIssues(workbookIssues);
  }

  return buildNutritionFoodCatalog(buildItems(recordsBySheet));
}
