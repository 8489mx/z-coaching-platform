import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ExcelJS from "exceljs";

import {
  ARABIC_INSTRUCTIONS,
  COLUMN_WIDTHS,
  DATA_WORKSHEET_NAMES,
  DROPDOWN_COLUMNS,
  INPUT_ROW_END,
  INPUT_ROW_START,
  INSTRUCTIONS_METADATA,
  LIST_DEFINITIONS,
  NUMERIC_COLUMNS,
  WORKBOOK_PROPERTIES,
  WORKSHEET_HEADERS,
  WORKSHEET_ORDER,
} from "./workbook-schema.js";

const COLOR = Object.freeze({
  navy: "FF17324D",
  teal: "FF0F6B68",
  aqua: "FFD9F0EF",
  lightBlue: "FFEAF1F7",
  white: "FFFFFFFF",
  slate: "FF40566A",
  border: "FFB8C6D1",
  note: "FFFFF4D6",
});

const TAB_COLORS = Object.freeze([
  "FF17324D",
  "FF0F6B68",
  "FF2B7A78",
  "FF3A86A8",
  "FF4D8B66",
  "FF6E7E85",
  "FF8C6D5A",
]);

function columnLetter(columnNumber) {
  let current = columnNumber;
  let result = "";
  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }
  return result;
}

function headerIndex(sheetName, header) {
  return WORKSHEET_HEADERS[sheetName].indexOf(header) + 1;
}

function listNameByKey(listKey) {
  const definition = LIST_DEFINITIONS.find(({ key }) => key === listKey);
  if (!definition) {
    throw new Error(`Unknown workbook list key: ${listKey}`);
  }
  return definition.rangeName;
}

function styleHeaderRow(worksheet) {
  const headerRow = worksheet.getRow(1);
  headerRow.height = 34;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: "Aptos Display",
      size: 11,
      bold: true,
      color: { argb: COLOR.white },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLOR.navy },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: COLOR.border } },
      left: { style: "thin", color: { argb: COLOR.border } },
      bottom: { style: "medium", color: { argb: COLOR.teal } },
      right: { style: "thin", color: { argb: COLOR.border } },
    };
  });
}

function addListValidation(worksheet, columnNumber, listKey) {
  const column = columnLetter(columnNumber);
  worksheet.dataValidations.add(
    `${column}${INPUT_ROW_START}:${column}${INPUT_ROW_END}`,
    {
      type: "list",
      allowBlank: true,
      formulae: [`=${listNameByKey(listKey)}`],
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "قيمة غير مسموحة",
      error: "اختر قيمة من القائمة الرسمية.",
      showInputMessage: true,
      promptTitle: "قائمة رسمية",
      prompt: "اختر قيمة من القائمة المنسدلة.",
    },
  );
}

function addNumericValidation(worksheet, columnNumber, definition) {
  const column = columnLetter(columnNumber);
  const hasMaximum = Number.isFinite(definition.maximum);
  worksheet.dataValidations.add(
    `${column}${INPUT_ROW_START}:${column}${INPUT_ROW_END}`,
    {
      type: definition.type,
      operator: hasMaximum ? "between" : "greaterThanOrEqual",
      allowBlank: true,
      formulae: hasMaximum
        ? [definition.minimum, definition.maximum]
        : [definition.minimum],
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "قيمة رقمية غير صالحة",
      error: hasMaximum
        ? `أدخل رقمًا من ${definition.minimum} إلى ${definition.maximum}.`
        : `أدخل عددًا صحيحًا لا يقل عن ${definition.minimum}.`,
    },
  );
}

function configureDataSheet(workbook, sheetName, tabColor) {
  const headers = WORKSHEET_HEADERS[sheetName];
  const worksheet = workbook.addWorksheet(sheetName, {
    properties: {
      defaultRowHeight: 22,
      tabColor: { argb: tabColor },
    },
    views: [{ state: "frozen", ySplit: 1, activeCell: "A2" }],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  worksheet.addRow(headers);
  worksheet.autoFilter = `A1:${columnLetter(headers.length)}1`;
  worksheet.pageSetup.printTitlesRow = "1:1";
  worksheet.headerFooter.oddFooter =
    "&LZ Coaching&CNutrition Food Catalog&RPage &P of &N";

  for (const [index, header] of headers.entries()) {
    const column = worksheet.getColumn(index + 1);
    column.key = header;
    column.width = COLUMN_WIDTHS[sheetName][index];
    column.alignment = {
      vertical: "top",
      wrapText: true,
    };
  }

  styleHeaderRow(worksheet);

  for (const [header, listKey] of Object.entries(
    DROPDOWN_COLUMNS[sheetName] ?? {},
  )) {
    addListValidation(worksheet, headerIndex(sheetName, header), listKey);
  }

  for (const [header, definition] of Object.entries(
    NUMERIC_COLUMNS[sheetName] ?? {},
  )) {
    const columnNumber = headerIndex(sheetName, header);
    const column = worksheet.getColumn(columnNumber);
    column.numFmt = definition.type === "whole" ? "0" : "0.00";
    column.alignment = {
      horizontal: "center",
      vertical: "top",
      wrapText: true,
    };
    addNumericValidation(worksheet, columnNumber, definition);
  }

  const dateColumn = headers.indexOf("source_checked_date") + 1;
  if (dateColumn > 0) {
    worksheet.getColumn(dateColumn).numFmt = "yyyy-mm-dd";
  }

  return worksheet;
}

function addInstructionsSheet(workbook) {
  const worksheet = workbook.addWorksheet("Instructions", {
    properties: {
      defaultRowHeight: 23,
      tabColor: { argb: COLOR.navy },
    },
    views: [{ state: "frozen", ySplit: 1, rightToLeft: true }],
  });

  worksheet.columns = [
    { width: 28 },
    { width: 44 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
  ];

  worksheet.mergeCells("A1:F1");
  const title = worksheet.getCell("A1");
  title.value = "قالب إدخال كتالوج الأغذية — Z Coaching";
  title.font = {
    name: "Aptos Display",
    size: 18,
    bold: true,
    color: { argb: COLOR.white },
  };
  title.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLOR.navy },
  };
  title.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 42;

  INSTRUCTIONS_METADATA.forEach(({ label, value }, index) => {
    const rowNumber = index + 2;
    const labelCell = worksheet.getCell(rowNumber, 1);
    const valueCell = worksheet.getCell(rowNumber, 2);
    labelCell.value = label;
    valueCell.value = value;
    labelCell.font = {
      name: "Aptos",
      size: 11,
      bold: true,
      color: { argb: COLOR.slate },
    };
    valueCell.font = { name: "Aptos", size: 11, bold: true };
    labelCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLOR.aqua },
    };
    valueCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLOR.lightBlue },
    };
    for (const cell of [labelCell, valueCell]) {
      cell.alignment = {
        horizontal: "left",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin", color: { argb: COLOR.border } },
        left: { style: "thin", color: { argb: COLOR.border } },
        bottom: { style: "thin", color: { argb: COLOR.border } },
        right: { style: "thin", color: { argb: COLOR.border } },
      };
    }
  });

  worksheet.mergeCells("A7:F7");
  const sectionTitle = worksheet.getCell("A7");
  sectionTitle.value = "تعليمات الاستخدام";
  sectionTitle.font = {
    name: "Aptos Display",
    size: 14,
    bold: true,
    color: { argb: COLOR.white },
  };
  sectionTitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLOR.teal },
  };
  sectionTitle.alignment = { horizontal: "right", vertical: "middle" };
  worksheet.getRow(7).height = 31;

  ARABIC_INSTRUCTIONS.forEach((instruction, index) => {
    const rowNumber = index + 8;
    worksheet.mergeCells(rowNumber, 1, rowNumber, 6);
    const cell = worksheet.getCell(rowNumber, 1);
    cell.value = `${index + 1}. ${instruction}`;
    cell.font = { name: "Aptos", size: 11, color: { argb: COLOR.slate } };
    cell.alignment = {
      horizontal: "right",
      vertical: "middle",
      wrapText: true,
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: index % 2 === 0 ? "FFFFFFFF" : COLOR.lightBlue },
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: COLOR.border } },
    };
    worksheet.getRow(rowNumber).height = 34;
  });

  worksheet.mergeCells("A17:F18");
  const note = worksheet.getCell("A17");
  note.value =
    "تنبيه: Excel أداة تجهيز واستيراد فقط. لا تعتمد عليها وحدات Runtime، ويظل Domain Validator مصدر القرار النهائي.";
  note.font = { name: "Aptos", size: 11, bold: true, color: { argb: COLOR.slate } };
  note.alignment = {
    horizontal: "right",
    vertical: "middle",
    wrapText: true,
  };
  note.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLOR.note },
  };
  note.border = {
    top: { style: "thin", color: { argb: COLOR.border } },
    left: { style: "thin", color: { argb: COLOR.border } },
    bottom: { style: "thin", color: { argb: COLOR.border } },
    right: { style: "thin", color: { argb: COLOR.border } },
  };
}

function addListsSheet(workbook) {
  const worksheet = workbook.addWorksheet("_Lists", {
    properties: {
      defaultRowHeight: 20,
      tabColor: { argb: COLOR.slate },
    },
    views: [{ state: "frozen", ySplit: 1 }],
  });

  LIST_DEFINITIONS.forEach(({ header, rangeName, values }, index) => {
    const columnNumber = index + 1;
    const column = columnLetter(columnNumber);
    worksheet.getCell(1, columnNumber).value = header;
    worksheet.getColumn(columnNumber).width = Math.max(
      20,
      header.length + 3,
      ...values.map((value) => value.length + 3),
    );
    values.forEach((value, valueIndex) => {
      worksheet.getCell(valueIndex + 2, columnNumber).value = value;
    });
    workbook.definedNames.add(
      `'${worksheet.name}'!$${column}$2:$${column}$${values.length + 1}`,
      rangeName,
    );
  });

  styleHeaderRow(worksheet);
  worksheet.state = "hidden";
}

function setWorkbookProperties(workbook) {
  const fixedDate = new Date(WORKBOOK_PROPERTIES.fixedDate);
  workbook.creator = WORKBOOK_PROPERTIES.creator;
  workbook.lastModifiedBy = WORKBOOK_PROPERTIES.lastModifiedBy;
  workbook.company = WORKBOOK_PROPERTIES.company;
  workbook.title = WORKBOOK_PROPERTIES.title;
  workbook.subject = WORKBOOK_PROPERTIES.subject;
  workbook.created = fixedDate;
  workbook.modified = fixedDate;
  workbook.lastPrinted = fixedDate;
  workbook.calcProperties.fullCalcOnLoad = false;
  workbook.calcProperties.forceFullCalc = false;
}

export async function createNutritionFoodCatalogWorkbook(outputPath) {
  if (typeof outputPath !== "string" || outputPath.trim().length === 0) {
    throw new TypeError("outputPath must be a non-empty string.");
  }

  const workbook = new ExcelJS.Workbook();
  setWorkbookProperties(workbook);

  addInstructionsSheet(workbook);
  DATA_WORKSHEET_NAMES.forEach((sheetName, index) => {
    configureDataSheet(workbook, sheetName, TAB_COLORS[index]);
  });
  addListsSheet(workbook);

  const actualOrder = workbook.worksheets.map(({ name }) => name);
  if (actualOrder.join("\u0000") !== WORKSHEET_ORDER.join("\u0000")) {
    throw new Error("Workbook worksheets were generated in an invalid order.");
  }

  await fs.mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}

async function runCli() {
  const outputPath = process.argv[2];
  if (!outputPath) {
    console.error("Usage: node create-template.js <output.xlsx>");
    process.exitCode = 1;
    return;
  }

  await createNutritionFoodCatalogWorkbook(outputPath);
  console.log(`Nutrition food catalog workbook created: ${outputPath}`);
}

const isDirectRun =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectRun) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
