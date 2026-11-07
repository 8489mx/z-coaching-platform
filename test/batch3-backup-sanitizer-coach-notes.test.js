import test from "node:test";
import assert from "node:assert/strict";

import { sanitizeBackupPayload } from "../src/api/services/backupSanitizer.js";

// B3-3 (#28): published programs carry top-level program_data.coach_notes
// (program.controller.js writes it on approve/publish and preserves it across
// saves), but stripProgramHealth never removed it, so coach notes leaked into
// backups. These tests prove the leak first, then the fix.

function programWithNotes(overrides = {}) {
  return {
    id: 1,
    user_id: 7,
    client_code: "C-001",
    program_data: {
      client: { name: "Test Client", allergies: ["PEANUT"] },
      medical_review_confirmation: { confirmed: true },
      coach_notes: "Client has diabetes, reduce carbs, watch blood sugar.",
      notes: "Free-text note about the client's condition.",
      plan: { weeks: 4, goal: "FAT_LOSS" },
      ...overrides,
    },
  };
}

test("B3-3: backup of a published program must not contain top-level coach_notes", () => {
  const out = sanitizeBackupPayload({ programs: [programWithNotes()] });
  assert.equal(out.programs.length, 1);
  assert.equal("coach_notes" in out.programs[0].program_data, false);
  assert.equal(
    JSON.stringify(out.programs[0]).includes("diabetes"),
    false,
    "clinical coach-note text must not leak into the backup"
  );
});

test("B3-3: backup of a program must not contain top-level notes", () => {
  const out = sanitizeBackupPayload({ programs: [programWithNotes()] });
  assert.equal("notes" in out.programs[0].program_data, false);
  assert.equal(
    JSON.stringify(out.programs[0]).includes("Free-text note"),
    false,
    "free-text program notes must not leak into the backup"
  );
});

test("B3-3: existing program stripping still holds (client health keys + medical review)", () => {
  const out = sanitizeBackupPayload({ programs: [programWithNotes()] });
  const data = out.programs[0].program_data;
  assert.equal("allergies" in data.client, false);
  assert.equal("medical_review_confirmation" in data, false);
  // Non-health shape is kept so a restore tolerates the missing keys.
  assert.equal(data.client.name, "Test Client");
  assert.deepEqual(data.plan, { weeks: 4, goal: "FAT_LOSS" });
});

test("B3-3: program without any notes passes through unchanged in shape", () => {
  const clean = {
    id: 2,
    user_id: 8,
    client_code: "C-002",
    program_data: { client: { name: "Clean Client" }, plan: { weeks: 8 } },
  };
  const out = sanitizeBackupPayload({ programs: [clean] });
  assert.deepEqual(out.programs[0].program_data, {
    client: { name: "Clean Client" },
    plan: { weeks: 8 },
  });
});
