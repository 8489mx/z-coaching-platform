/* Guard for audit findings S3-4 + S4-5: the duplicated check-in logic is
   retired. The second submit path (POST /api/v1/programs/checkin/submit)
   accepted submissions for any client from any authenticated account, with
   no schedule guard, no duplicate-week guard, and no prior-lockout /
   adaptive-TDEE context — and no live caller (web and Flutter both submit
   to POST /api/v1/checkin). The parallel weekly-audit calculator
   (POST /api/v1/checkin/evaluate) likewise had no UI caller, used
   divergent plateau/floor/cut rules, performed no cardiac screening, and
   its WhatsApp text falsely claimed the report was approved. Both are
   removed; the canonical submitCheckin / evaluateCheckin path is the only
   check-in logic. If a calculator is ever needed again, it must be a thin
   wrapper over evaluateCheckin + buildAdaptedPlan, not a second rule set. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("the second check-in submit path is gone", () => {
  const routes = read("src/api/routes/program.routes.js");
  const controller = read("src/api/controllers/program.controller.js");
  assert.ok(!routes.includes("checkin/submit"), "programs route still registers checkin/submit");
  assert.ok(!routes.includes("submitWeeklyCheckin"), "programs route still references submitWeeklyCheckin");
  assert.ok(!controller.includes("export const submitWeeklyCheckin"), "submitWeeklyCheckin handler still defined");
  assert.ok(!routes.includes("checkin/evaluate"), "programs route still registers checkin/evaluate");
  assert.ok(!controller.includes("export const evaluateCheckinHandler"), "evaluateCheckinHandler still defined");
});

test("the parallel weekly-audit calculator is gone", () => {
  const server = read("src/api/server.js");
  assert.ok(!server.includes("/api/v1/checkin/evaluate"), "public calculator endpoint still registered");
  assert.ok(!server.includes("evaluateWeeklyProgress"), "server still imports the weekly-audit calculator");
  assert.ok(!fs.existsSync(path.join(root, "src/execution-engines/weekly-audit-engine.js")), "weekly-audit-engine.js still exists");
  assert.ok(!fs.existsSync(path.join(root, "src/execution-engines/weekly-checkin-engine.js")), "weekly-checkin-engine shim still exists");
  const index = read("src/execution-engines/index.js");
  assert.ok(!index.includes("weekly-audit-engine"), "execution-engines index still re-exports the weekly-audit engine");
  assert.ok(!index.includes("weekly-checkin-engine"), "execution-engines index still re-exports the weekly-audit shim");
});

test("the canonical check-in path is intact", () => {
  const routes = read("src/api/routes/checkin.routes.js");
  assert.ok(routes.includes("submitCheckin"), "canonical checkin route must still register submitCheckin");
  const controller = read("src/api/controllers/checkin.controller.js");
  assert.ok(controller.includes("export async function submitCheckin"), "canonical submitCheckin must still exist");
  assert.ok(controller.includes("evaluateClientCheckinSchedule"), "canonical schedule guard must still exist");
});
