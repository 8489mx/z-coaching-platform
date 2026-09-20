import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FOOD_DATABASE } from "../src/execution-engines/food-swap-engine.js";

/**
 * The Flutter app draws what the server already decided. Any nutrition or training content written
 * into Dart is a second copy of a clinical rule that nobody will remember to update, and that no
 * test here can check. This file keeps the app honest: it may render client_view and post what the
 * client types, and nothing else.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIB = path.join(ROOT, "mobile_app/lib");

function dartFiles(dir = LIB) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return dartFiles(full);
    return entry.name.endsWith(".dart") ? [full] : [];
  });
}

const SOURCES = dartFiles().map((file) => ({ file: path.relative(ROOT, file), text: fs.readFileSync(file, "utf8") }));

test("no food from the nutrition database is named inside Dart", () => {
  const foodNames = [...new Set(Object.values(FOOD_DATABASE).filter((f) => f && f.name_ar).map((f) => f.name_ar))];
  const offenders = [];
  for (const { file, text } of SOURCES) {
    for (const name of foodNames) {
      if (text.includes(name)) offenders.push(`${file}: ${name}`);
    }
  }
  assert.deepEqual(offenders, [], "meals come from client_view.meals; a food name in Dart means a plan was written into the app");
});

test("no fasting, cardio or training rule is expressed in Dart", () => {
  // These words only ever reach the phone as text the server produced (meal titles, advisories).
  const forbidden = ["رمضان", "الإفطار (", "السحور", "صيام", "ديلود", "استشفاء", "HIIT", "LISS", "RIR", "Zone 2",
    // نصوص القواعد التدريبية نفسها: مصدرها المحرك عبر client_view، لا نسخة داخل التطبيق
    "الفشل العضلي", "في الاحتياط", "10-20%", "RPE", "المدى الحركي"];
  const offenders = [];
  for (const { file, text } of SOURCES) {
    for (const word of forbidden) {
      if (text.includes(word)) offenders.push(`${file}: ${word}`);
    }
  }
  assert.deepEqual(offenders, [], "these belong to the engines; the app shows the strings the server sends");
});

test("no sample or fallback plan is shipped with the app", () => {
  const offenders = [];
  for (const { file, text } of SOURCES) {
    for (const marker of ["افتراضية", "نموذجية", "تجريبية", "_smartSwapDatabase", "sampleMeals", "demoProgram"]) {
      if (text.includes(marker)) offenders.push(`${file}: ${marker}`);
    }
  }
  assert.deepEqual(offenders, [], "when data is missing the app says so; it never invents a plan for a real client");
});

test("the screens read the day from client_view and the swaps from the API", () => {
  const all = SOURCES.map((s) => s.text).join("\n");
  assert.match(all, /client_view/, "the app reads the server-computed day view");
  for (const key of ["target_macros", "meals", "cardio", "training_session"]) {
    assert.ok(all.includes(key), `client_view.${key} is never read by the app`);
  }
  assert.match(all, /swapCandidates/, "swap options come from the swap endpoint, not from a list in Dart");
});
