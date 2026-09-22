import test from "node:test";
import assert from "node:assert/strict";

import { getSwapCandidatesHandler } from "../src/api/controllers/program.controller.js";
import { IntakeSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * The mobile swap list had no milk: skim and lactose-free milk were read as laban, so laban and both
 * milks had no swap at all. They are one kind of food (a dairy drink) of close value (laban 250 g
 * ~106 kcal, skim milk ~84, lactose-free ~91), so each now swaps for the ones within the value rule.
 */
const call = async (body, answers = null) => {
  const original = IntakeSubmission.findOne;
  IntakeSubmission.findOne = async () => (answers ? { answers } : null);
  try {
    const out = {};
    await getSwapCandidatesHandler({ user: {}, body }, { status() { return this; }, json(b) { out.b = b; return this; } });
    return out.b.candidates.map((c) => c.food_code);
  } finally {
    IntakeSubmission.findOne = original;
  }
};
test.after(async () => { await sequelize.close().catch(() => {}); });

test("laban, skim milk and lactose-free milk swap for each other", async () => {
  assert.ok((await call({ food_code: "LABAN_RAYEB_LOWFAT", source_grams: 250 })).includes("SKIM_MILK"));
  // Laban is 27% more energy than skim milk for the same protein (its fat), past the 25% rule: skim
  // milk swaps for lactose-free milk, and laban for either milk.
  assert.ok((await call({ food_code: "SKIM_MILK", source_grams: 250 })).includes("LACTOSE_FREE_MILK"));
  assert.ok((await call({ food_code: "LACTOSE_FREE_MILK", source_grams: 250 })).includes("SKIM_MILK"));
});
