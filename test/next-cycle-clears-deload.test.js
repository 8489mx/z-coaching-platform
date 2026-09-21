import test from "node:test";
import assert from "node:assert/strict";

import { buildNextCycle } from "../src/api/services/nextCycleService.js";

/** A deload flagged in the last cycle used to be copied into every cycle after it. */
test("the next cycle starts without the previous cycle's deload flag", () => {
  const program = { program_data: { cycle_number: 3, training_program: { is_deload: true, deload_note: "x", weeks: [{ week_number: 1, sessions: [] }] } } };
  const { program_data } = buildNextCycle({ program });
  assert.equal(program_data.training_program.is_deload, false);
  assert.equal(program_data.training_program.deload_note, undefined);
  assert.equal(program.program_data.training_program.is_deload, true, "the finished cycle keeps its own record");
});
