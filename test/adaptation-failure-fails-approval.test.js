/* S3-6 source guard: if buildAdaptedPlan throws during approveCheckin,
   the approval must FAIL (HTTP 500, check-in stays unapproved, program
   untouched) instead of silently merging the raw analysis_output as if
   it were an adaptation result. The raw output carries suggested deltas
   with no adapted_nutrition, no week discipline, and no
   requires_coach_approval — merging it pairs an adaptive-TDEE calorie
   delta with the decision tree's carb delta. This guard is a source
   guard because approveCheckin needs the DB layer (sequelize), which
   the dependency-free clone does not have; the behavioral proof must
   come from the user's DB-backed run before merging. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(root, "src/api/controllers/checkin.controller.js"), "utf8");

test("S3-6: a failed adaptation engine fails the approval instead of falling back to raw analysis output", () => {
  const catchIdx = src.indexOf('console.warn("buildAdaptedPlan fallback in checkin.controller:"');
  assert.ok(catchIdx > 0, "adaptation catch block must exist");
  const afterCatch = src.slice(catchIdx, catchIdx + 1500);
  // The failure must surface as a 500 before any merge/program write.
  assert.ok(
    afterCatch.includes("ADAPTATION_ENGINE_FAILED") || afterCatch.includes("فشل حساب التكييف"),
    "adaptation failure must return a 500 error response",
  );
  assert.ok(afterCatch.includes("status(500)"), "adaptation failure must be HTTP 500");
  // And the merge must never run with a null adaptation on a fresh
  // (not already-adapted) check-in: the early return sits before the merge.
  const mergeIdx = src.indexOf("mergeAdaptedPlanIntoProgram(", catchIdx);
  const returnIdx = afterCatch.indexOf("return res.status(500)");
  assert.ok(returnIdx > 0 && returnIdx < mergeIdx - catchIdx, "500 return must precede the merge call");
});
