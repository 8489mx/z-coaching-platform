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

// Every screen that reads its data from the server can ask for it again, from the same control in
// the same place. Four of them had none at all: the coach reloaded the whole page.
const SCREENS_WITH_A_REFRESH = [
  "frontend/src/pages/CoachCommandCenter.jsx",
  "frontend/src/pages/IntakeSubmissions.jsx",
  "frontend/src/pages/Customers.jsx",
  "frontend/src/pages/FinancialsRenewalsDashboard.jsx",
  "frontend/src/pages/CheckinReviewDashboard.jsx",
  "frontend/src/pages/WhatsAppRemindersHub.jsx",
];

test("both screens refresh from the one shared control", () => {
  for (const file of SCREENS_WITH_A_REFRESH) {
    const code = read(file);
    assert.match(code, /import \{ RefreshButton \} from '@\/shared\/components\/refresh-button'/, `${file} draws its own refresh button`);
    const rendered = (code.match(/<RefreshButton[\s>]/g) || []).length;
    assert.equal(rendered, 1, `${file} renders ${rendered} refresh controls`);
  }
});

test("the control sits at the top of the screen, not down in a table toolbar", () => {
  for (const file of SCREENS_WITH_A_REFRESH) {
    const code = read(file);
    const button = code.indexOf("<RefreshButton");
    // The screen headers differ (three use PageHeader, two draw their own banner), so what is checked
    // is that the control comes before the screen starts listing anything.
    const list = code.indexOf(".map(", code.indexOf("<AdminLayout"));
    assert.ok(button > 0, `${file} has no refresh control`);
    assert.ok(list < 0 || button < list, `${file} puts the control below its list`);
  }
});

test("the intake screen keeps its R shortcut and says so", () => {
  const intakes = read("frontend/src/pages/IntakeSubmissions.jsx");
  assert.match(intakes, /shortcut="R"/);
  assert.match(intakes, /e\.key === 'r' \|\| e\.key === 'R'/);
});
