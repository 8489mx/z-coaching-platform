import test from "node:test";
import assert from "node:assert/strict";

import { loadProgressionState } from "../src/api/services/progressionService.js";
import { WorkoutLog, CheckinSubmission } from "../src/api/models/index.js";

test("workout logs replay in a stable order: logs saved in the same second fall back to insertion order (id)", async () => {
  const originals = { logs: WorkoutLog.findAll, checkins: CheckinSubmission.findAll };
  let options = null;
  WorkoutLog.findAll = async (opts) => { options = opts; return []; };
  CheckinSubmission.findAll = async () => [];
  try {
    await loadProgressionState(1);
    assert.deepEqual(options.order, [["createdAt", "ASC"], ["id", "ASC"]]);
  } finally {
    WorkoutLog.findAll = originals.logs;
    CheckinSubmission.findAll = originals.checkins;
  }
});
