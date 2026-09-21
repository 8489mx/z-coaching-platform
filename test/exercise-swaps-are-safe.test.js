import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getSmartExerciseSwaps } from "../src/exercise-swap-engine/index.js";
import { SMART_EXERCISE_SWAP_REGISTRY } from "../src/exercise-swap-engine/smart-exercise-swap-registry.js";

/**
 * Every exercise's swaps, for every injury and every home setup, checked against an independent
 * list of what loads each joint and what equipment each name needs.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = ["data/settings/exercises_catalog.json", "src/data/exercises-catalog.json"].map((p) => path.join(ROOT, p)).find((p) => fs.existsSync(p));
const catalog = catalogPath ? JSON.parse(fs.readFileSync(catalogPath, "utf8")) : [];
const CODES = [...new Set([...Object.keys(SMART_EXERCISE_SWAP_REGISTRY), ...catalog.map((e) => String(e.id || e.code || "").toUpperCase())])].filter(Boolean);

const LOADS = {
  KNEE: /SQUAT|LUNGE|LEG_EXT|LEG_PRESS|HACK|STEP_UP|SPLIT|PISTOL|JUMP|SISSY|WALL_SIT/,
  LOWER_BACK: /DEADLIFT|RDL|ROMANIAN|BENT_OVER|GOOD_MORNING|T_BAR|BARBELL_ROW|PENDLAY|BACK_SQUAT|FRONT_SQUAT|KETTLEBELL_SWING|CLEAN|SNATCH|HYPEREXT|BACK_EXTENSION/,
  SHOULDER: /OVERHEAD|SHOULDER_PRESS|MILITARY|ARNOLD|PUSH_PRESS|PIKE|HANDSTAND|UPRIGHT_ROW|DIP|BEHIND_NECK|SNATCH/,
};
// The injury as the form stores it, in Arabic, and in English.
const SPELLINGS = { KNEE: ["knee", "ركبة", "KNEE"], LOWER_BACK: ["spine_back", "ظهر", "LOWER_BACK"], SHOULDER: ["shoulder", "كتف", "SHOULDER"] };

for (const [joint, spellings] of Object.entries(SPELLINGS)) {
  test(`no swap loads the ${joint} of a client injured there, however the injury is written`, () => {
    const leaks = [];
    for (const spelling of spellings) {
      for (const code of CODES) {
        for (const swap of getSmartExerciseSwaps(code, { environment: "GYM", injuryFlags: [spelling] })) {
          if (LOADS[joint].test(String(swap.exercise_code).toUpperCase())) leaks.push(`${spelling}: ${code} -> ${swap.exercise_code}`);
        }
      }
    }
    assert.deepEqual([...new Set(leaks)], []);
  });
}

test("a home client is never offered barbells, cables or machines", () => {
  const leaks = [];
  for (const code of CODES) {
    for (const swap of getSmartExerciseSwaps(code, { environment: "HOME" })) {
      const name = String(swap.exercise_code).toUpperCase();
      if (!/^BAND_/.test(name) && /BARBELL|CABLE|MACHINE|SMITH|LEG_PRESS|HACK|LAT_PULLDOWN|PEC_DECK|EZ_BAR|T_BAR/.test(name)) leaks.push(`${code} -> ${name}`);
    }
  }
  assert.deepEqual([...new Set(leaks)], []);
});

test("a bands-and-bodyweight client is offered neither dumbbells nor kettlebells", () => {
  const leaks = [];
  for (const code of CODES) {
    for (const swap of getSmartExerciseSwaps(code, { environment: "BANDS" })) {
      const name = String(swap.exercise_code).toUpperCase();
      if (!/^BAND_/.test(name) && /DUMBBELL|KETTLEBELL|BARBELL|CABLE|MACHINE|SMITH|LEG_PRESS|HACK|LAT_PULLDOWN|PEC_DECK|EZ_BAR|T_BAR|GOBLET/.test(name)) leaks.push(`${code} -> ${name}`);
    }
  }
  assert.deepEqual([...new Set(leaks)], []);
});

test("every exercise keeps at least one swap for every setup and injury", () => {
  const empty = [];
  for (const code of Object.keys(SMART_EXERCISE_SWAP_REGISTRY)) {
    for (const [environment, injuryFlags] of [["GYM", []], ["HOME", []], ["BANDS", []], ["GYM", ["knee"]], ["GYM", ["spine_back"]], ["GYM", ["shoulder"]], ["BANDS", ["knee", "spine_back"]]]) {
      if (getSmartExerciseSwaps(code, { environment, injuryFlags }).length === 0) empty.push(`${code} ${environment} ${injuryFlags.join("+")}`);
    }
  }
  assert.deepEqual(empty, []);
});

test("a sore knee on a squat day gets hip-dominant swaps, never a heavy deadlift", () => {
  const codes = getSmartExerciseSwaps("BARBELL_BACK_SQUAT", { environment: "GYM", injuryFlags: ["knee"] }).map((s) => s.exercise_code);
  assert.ok(codes.some((c) => /BRIDGE|HIP_THRUST/.test(c)), codes.join(", "));
  assert.ok(!codes.some((c) => /CONVENTIONAL_DEADLIFT/.test(c)));
});
