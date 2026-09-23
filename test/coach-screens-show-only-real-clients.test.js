import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The coach's screens show real subscribers only. The check-in review used to open on fifteen demo
 * clients (STRESS_TEST_CLIENTS) the coach could review and approve, the editor opened on a demo
 * plan and filled a real client's missing meals and sessions from it, and the queue merged every
 * real client with a demo one by position - so a real person carried another's injuries and package.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

const COACH_SCREENS = [
  "frontend/src/pages/CheckinReviewDashboard.jsx",
  "frontend/src/pages/CoachEditor/hooks/useCoachEditorData.js",
];

test("no coach screen reads the demo clients", () => {
  for (const file of COACH_SCREENS) {
    const code = read(file).split("\n")
      .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
      .join("\n");
    assert.doesNotMatch(code, /STRESS_TEST_CLIENTS|CLINICAL_MASTER_BLUEPRINTS|CLIENT_BLUEPRINTS/, `${file} still reads demo clients`);
  }
});

test("the check-in review and the editor start empty", () => {
  assert.match(read(COACH_SCREENS[0]), /const \[checkinList, setCheckinList\] = useState\(\[\]\)/);
  const editor = read(COACH_SCREENS[1]);
  assert.match(editor, /const \[program, setProgram\] = useState\(EMPTY_PROGRAM\)/);
  assert.match(editor, /const \[clientsList, setClientsList\] = useState\(\[\]\)/);
});

test("a plan with no meals or sessions stays empty instead of borrowing another client's", () => {
  const editor = read(COACH_SCREENS[1]);
  assert.match(editor, /sessions: mappedSessions\b/);
  assert.match(editor, /meals: mappedMeals\b/);
  assert.doesNotMatch(editor, /mappedSessions\.length > 0 \?/);
  assert.doesNotMatch(editor, /mappedMeals\.length > 0 \?/);
});

test("the empty program carries nothing of anyone's plan", () => {
  const constants = read("frontend/src/pages/CoachEditor/constants/coachEditorConstants.js");
  assert.ok(constants.includes("export const EMPTY_PROGRAM"), "EMPTY_PROGRAM must exist");
  const block = constants.slice(constants.indexOf("export const EMPTY_PROGRAM"));
  assert.match(block, /meals: Object\.freeze\(\[\]\)/);
  assert.match(block, /sessions: Object\.freeze\(\[\]\)/);
  assert.match(block, /calories: 0, protein: 0, carbs: 0, fats: 0/);
});

test("the sidebar badge counts only what is waiting on the coach", () => {
  const sidebar = read("frontend/src/components/layout/Sidebar.jsx");
  assert.match(sidebar, /AWAITING_COACH = \['PENDING_COACH_REVIEW', 'PAYMENT_CONFIRMED', 'DRAFT_GENERATED'\]/);
  assert.doesNotMatch(sidebar, /intakes: Array\.isArray\(inData\?\.submissions\) \? inData\.submissions\.length/);
  // A failed request keeps the number it had; it does not silently become zero.
  assert.match(sidebar, /: prev\.intakes/);
  assert.match(sidebar, /: prev\.checkins/);
  assert.match(sidebar, /setInterval\(fetchBadges, 60000\)/);
});
