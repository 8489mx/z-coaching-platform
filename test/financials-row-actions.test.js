import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * A row on the financials screen carried six buttons, one of them a second way to open the retention
 * radar - which the score in its own column already opens. The money actions keep their words; going
 * to the plan or to the client's file is navigation and shows as an icon with its name in the tooltip.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const financials = fs.readFileSync(path.join(ROOT, "frontend/src/pages/FinancialsRenewalsDashboard.jsx"), "utf8");

test("the retention radar opens from one place in the row", () => {
  const triggers = (financials.match(/setSelectedRadarClient\(client\)/g) || []).length;
  assert.equal(triggers, 1, `the row opens the radar from ${triggers} controls`);
});

test("the money actions keep their words", () => {
  for (const label of ["تجديد", "تذكير"]) {
    assert.ok(financials.includes(`<span>${label}</span>`), `${label} lost its label`);
  }
  // The freeze button says what it will do next, so its label is written in place.
  assert.ok(
    financials.includes("{client.status === 'FROZEN' ? 'استئناف' : 'تجميد'}"),
    "the freeze button lost its label"
  );
});

test("navigation out of the row is an icon with a name", () => {
  assert.match(financials, /aria-label="فتح خطة المشترك"/);
  assert.match(financials, /aria-label="عرض ملف المشترك"/);
  assert.doesNotMatch(financials, /<span>الخطة<\/span>/);
  assert.doesNotMatch(financials, /<span>الملف<\/span>/);
});
