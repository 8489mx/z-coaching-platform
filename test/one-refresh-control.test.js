import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The two screens that can be refreshed by hand did it differently: the daily dashboard had
 * "تحديث البيانات" in the page header with one icon, the intake screen had "تحديث" down in the
 * table toolbar with another icon. Same job, two names, two corners. One control now, in the header
 * beside the page's main action, on both.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const SCREENS_WITH_A_REFRESH = [
  "frontend/src/pages/CoachCommandCenter.jsx",
  "frontend/src/pages/IntakeSubmissions.jsx",
];

test("both screens refresh from the one shared control", () => {
  for (const file of SCREENS_WITH_A_REFRESH) {
    const code = read(file);
    assert.match(code, /import \{ RefreshButton \} from '@\/shared\/components\/refresh-button'/, `${file} draws its own refresh button`);
    const rendered = (code.match(/<RefreshButton[\s>]/g) || []).length;
    assert.equal(rendered, 1, `${file} renders ${rendered} refresh controls`);
  }
});

test("the control sits in the page header on both", () => {
  for (const file of SCREENS_WITH_A_REFRESH) {
    const code = read(file);
    const header = code.indexOf("<PageHeader");
    const button = code.indexOf("<RefreshButton");
    const section = code.indexOf("<FormSection");
    assert.ok(header >= 0 && button > header, `${file} does not put the control in the header`);
    if (section >= 0) assert.ok(button < section, `${file} still keeps the control down in the table toolbar`);
  }
});

test("the intake screen keeps its R shortcut and says so", () => {
  const intakes = read("frontend/src/pages/IntakeSubmissions.jsx");
  assert.match(intakes, /shortcut="R"/);
  assert.match(intakes, /e\.key === 'r' \|\| e\.key === 'R'/);
});
