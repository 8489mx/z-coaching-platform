import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * One package filter, drawn one way. The same filter used to live in four places with four shapes
 * and four wordings: two big cards on the subscribers page, pills on the daily dashboard, and twice
 * on the financials page - once as clickable revenue lines, once as pills - so the coach could set
 * the same filter from two controls on one screen and see them disagree.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const SCREENS_WITH_A_PACKAGE_FILTER = [
  "frontend/src/pages/Customers.jsx",
  "frontend/src/pages/FinancialsRenewalsDashboard.jsx",
  "frontend/src/pages/CoachCommandCenter.jsx",
];

test("every screen takes its package filter from the one shared control", () => {
  for (const file of SCREENS_WITH_A_PACKAGE_FILTER) {
    const code = read(file);
    assert.match(code, /import \{ TierFilter \} from '@\/shared\/components\/tier-filter'/, `${file} does not use the shared filter`);
    assert.match(code, /<TierFilter /, `${file} imports the shared filter but does not render it`);
  }
});

test("no screen draws its own package filter next to the shared one", () => {
  for (const file of SCREENS_WITH_A_PACKAGE_FILTER) {
    const code = read(file);
    const rendered = (code.match(/<TierFilter /g) || []).length;
    assert.equal(rendered, 1, `${file} renders the package filter ${rendered} times`);
    // A second control setting the same filter is what made the two disagree.
    const setters = (code.match(/setTierFilter\(/g) || []).length;
    assert.ok(setters <= 4, `${file} sets the package filter from ${setters} places`);
  }
});

test("the financials revenue lines report revenue and no longer filter", () => {
  const financials = read(SCREENS_WITH_A_PACKAGE_FILTER[1]);
  assert.doesNotMatch(financials, /انقر لفلترة باقة/);
  assert.doesNotMatch(financials, /setTierFilter\(tierFilter === 'MAX'/);
  assert.doesNotMatch(financials, /setTierFilter\(tierFilter === 'ELITE'/);
});

test("the shared control names the two packages the same way everywhere", () => {
  const control = read("frontend/src/shared/components/tier-filter.jsx");
  assert.match(control, /\{ id: 'ALL', label: 'كل الباقات' \}/);
  assert.match(control, /\{ id: 'MAX', label: 'باقة ماكس' \}/);
  assert.match(control, /\{ id: 'ELITE', label: 'باقة إيليت' \}/);
});
