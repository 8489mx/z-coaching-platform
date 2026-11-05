import test from "node:test";
import assert from "node:assert/strict";

import { resolveMesocycleWeekConfigs } from "../src/training-engine-v2/build-training-mesocycle.js";

// Decision 8 (confirmed 2026-11-05): DEFAULT_FALLBACK_WEEKS was deleted
// intentionally in P0-A14 (commit 0f9fd37) — the client never fabricates a
// demo week plan; the server mesocycle engine is the only source of weeks.
// This file used to assert the fallback's shape; it now asserts the same
// properties against the server engine, plus that no fallback export exists.

test("S2-4: no client fallback weeks exist — the server mesocycle engine is the only source of weeks", async () => {
  const hookMod = await import("../frontend/src/pages/ClientInteractiveApp/hooks/useClientInteractiveData.js");
  assert.equal(
    "DEFAULT_FALLBACK_WEEKS" in hookMod,
    false,
    "The client hook must not export DEFAULT_FALLBACK_WEEKS (deleted intentionally in P0-A14; weeks come from the server only)"
  );

  // Server volume modifier standards for the progressive mesocycle, per
  // experience level (measured from the engine with default options).
  // The deleted fallback carried the ADVANCED ladder [1.0, 1.0, 1.15, 1.25, 0.6];
  // that ladder now lives only in the server engine.
  const expectedVolumeModifiers = {
    BEGINNER: [1.0, 1.0, 1.0, 1.0, 1.0],
    INTERMEDIATE: [1.0, 1.0, 1.15, 1.25, 0.7],
    ADVANCED: [1.0, 1.0, 1.15, 1.25, 0.6],
  };

  for (const exp of ["BEGINNER", "INTERMEDIATE", "ADVANCED"]) {
    const weeks = resolveMesocycleWeekConfigs({ experience: exp, weeksCount: 5 });
    assert.equal(weeks.length, 5, `Server must define 5 weeks for ${exp}`);
    assert.deepEqual(
      weeks.map((w) => w.volume_modifier),
      expectedVolumeModifiers[exp],
      `Server volume modifiers for ${exp} must match the standard ladder`
    );

    weeks.forEach((week) => {
      assert.ok(
        week.target_rir > 0,
        `Server mesocycle for ${exp} week ${week.week_number} target_rir (${week.target_rir}) must be strictly greater than 0; forced RIR 0 is banned`
      );
    });

    const week4 = weeks[3];
    assert.ok(week4.target_rir === 1 || week4.target_rir === 2, `Week 4 target_rir for ${exp} must be 1 or 2`);
  }
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
