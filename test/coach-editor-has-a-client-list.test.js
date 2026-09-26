import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

/**
 * Owner (2026-09-26): "flipping Next to reach the next client is not practical". The editor already
 * had a client queue, but it was hidden behind a button and scrolled sideways, so the coach used the
 * Next arrow instead. It is a list beside the editor now - always open, searchable, one click per
 * client - the way the coaching platforms lay it out, and the Previous/Next arrows are gone.
 */
const QUEUE = fs.readFileSync("frontend/src/pages/CoachEditor/components/CoachClientsQueue.jsx", "utf8");
const PAGE = fs.readFileSync("frontend/src/pages/CoachEditor.jsx", "utf8");
const HEADER = fs.readFileSync("frontend/src/pages/CoachEditor/components/CoachHeaderBar.jsx", "utf8");

test("the client list is always open, never behind a show button", () => {
  assert.doesNotMatch(QUEUE, /showQueueSlider/);
  assert.doesNotMatch(QUEUE, /إظهار المشتركين|إخفاء الشريط/);
  assert.doesNotMatch(PAGE, /showQueueSlider/);
  assert.doesNotMatch(fs.readFileSync("frontend/src/pages/CoachEditor/hooks/useCoachEditorData.js", "utf8"), /showQueueSlider/);
});

test("the list runs down the side of the editor, not sideways across the top", () => {
  assert.match(QUEUE, /overflowY: 'auto'/);
  assert.doesNotMatch(QUEUE, /overflowX: 'auto'/);
  assert.match(PAGE, /<aside/);
});

test("the search and the filters stay in front of the coach", () => {
  assert.match(QUEUE, /TableSearch/);
  for (const filter of ["ACTION_NEEDED", "PENDING_PLAN", "NEEDS_UPDATE", "ALL"]) assert.ok(QUEUE.includes(filter), filter);
});

test("the Previous / Next arrows are gone from the header", () => {
  assert.doesNotMatch(HEADER, /التالي|السابق/);
  assert.doesNotMatch(HEADER, /nextClient|prevClient/);
});
