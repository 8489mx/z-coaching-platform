import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Every screen opened with a row of cards shouting zeros in the same weight as the cards that
 * carried real work, and the financials card kept saying "تحتاج متابعة هاتفية" while the number
 * under it was zero. A count of nothing now steps back, and says nothing is there.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

test("a card with nothing in it fades instead of shouting zero", () => {
  const dashboard = read("frontend/src/pages/CoachCommandCenter.jsx");
  assert.match(dashboard, /const isEmpty = Number\(st\.value\) === 0 && !isActive;/);
  assert.match(dashboard, /color: isEmpty \? '#CBD5E1' : '#0F172A'/);

  const intakes = read("frontend/src/pages/IntakeSubmissions.jsx");
  assert.match(intakes, /const isEmpty = Number\(st\.value\) === 0 && !isSel;/);
  assert.match(intakes, /color: isEmpty \? '#CBD5E1' : '#0F172A'/);
});

test("the card a coach is filtering by keeps its weight", () => {
  // isEmpty is false while the card is the active filter, so the selected card never fades.
  const dashboard = read("frontend/src/pages/CoachCommandCenter.jsx");
  assert.match(dashboard, /=== 0 && !isActive/);
  const intakes = read("frontend/src/pages/IntakeSubmissions.jsx");
  assert.match(intakes, /=== 0 && !isSel/);
});

test("the financials cards stop claiming work that is not there", () => {
  const financials = read("frontend/src/pages/FinancialsRenewalsDashboard.jsx");
  assert.match(financials, /overdueCount === 0 \? 'لا توجد اشتراكات منتهية' : 'تحتاج متابعة هاتفية \(انقر للفلترة\)'/);
  assert.match(financials, /color: overdueCount === 0 \? '#CBD5E1' : '#DC2626'/);
  assert.match(financials, /color: urgentRenewals\.length === 0 \? '#CBD5E1' : '#B45309'/);
  assert.match(financials, /color: totalMRR === 0 \? '#CBD5E1' : '#0F172A'/);
});
