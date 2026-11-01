import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_FALLBACK_WEEKS } from "../frontend/src/pages/ClientInteractiveApp/hooks/useClientInteractiveData.js";
import { resolveMesocycleWeekConfigs } from "../src/training-engine-v2/build-training-mesocycle.js";

test("S2-4: DEFAULT_FALLBACK_WEEKS in client interactive app never forces RIR 0 and matches server volume modifiers", () => {
  assert.ok(Array.isArray(DEFAULT_FALLBACK_WEEKS), "DEFAULT_FALLBACK_WEEKS must be an array");
  assert.equal(DEFAULT_FALLBACK_WEEKS.length, 5, "Fallback must define 5 weeks");

  // Server volume modifier standards for progressive mesocycle: [1.0, 1.0, 1.15, 1.25, 0.6]
  const expectedVolumeModifiers = [1.0, 1.0, 1.15, 1.25, 0.6];

  DEFAULT_FALLBACK_WEEKS.forEach((week, idx) => {
    assert.ok(
      week.target_rir > 0,
      `Week ${week.week_number} target_rir (${week.target_rir}) must be strictly greater than 0; forced RIR 0 is banned`
    );
    assert.equal(
      week.volume_modifier,
      expectedVolumeModifiers[idx],
      `Week ${week.week_number} volume_modifier (${week.volume_modifier}) must match server standard (${expectedVolumeModifiers[idx]})`
    );
  });

  const week4 = DEFAULT_FALLBACK_WEEKS[3];
  assert.ok(week4.target_rir === 1 || week4.target_rir === 2, "Week 4 target_rir must be 1 or 2");
});

test("S2-4: server mesocycle engine never outputs target_rir 0 in default mesocycle configurations", () => {
  for (const exp of ["BEGINNER", "INTERMEDIATE", "ADVANCED"]) {
    const weeks = resolveMesocycleWeekConfigs({ experience: exp, weeksCount: 5 });
    assert.equal(weeks.length, 5, `Must have 5 weeks for ${exp}`);
    weeks.forEach((w) => {
      assert.ok(
        w.target_rir > 0,
        `Server mesocycle for ${exp} week ${w.week_number} target_rir (${w.target_rir}) must be > 0`
      );
    });
    // Week 4 specifically must be 1 or 2
    assert.ok(
      weeks[3].target_rir === 1 || weeks[3].target_rir === 2,
      `Week 4 target_rir for ${exp} must be 1 or 2, got ${weeks[3].target_rir}`
    );
  }
});
