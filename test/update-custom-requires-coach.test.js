/* S4-1: updateCustomProgram must refuse non-coach callers before it touches any
 * client's program. The editor save path is coach-only: the only live callers
 * are CoachEditor and MacroCalculator, and setFastingOverride in the same
 * file already enforces COACH/ADMIN the same way. A source guard is used
 * because the controller cannot be imported without the database layer. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(
  path.join(ROOT, "src/api/controllers/program.controller.js"),
  "utf8"
);
const start = src.indexOf("export const updateCustomProgram");
assert.notEqual(start, -1, "updateCustomProgram not found");
const end = src.indexOf("export const", start + 10);
const body = src.slice(start, end === -1 ? undefined : end);

const guardIndex = body.search(
  /\["COACH",\s*"ADMIN"\]\.includes\(requester\.role\)/
);
const firstLookupIndex = body.search(
  /User\.findOne\(\{\s*where:\s*\{\s*client_code/
);

test("updateCustomProgram requires a COACH/ADMIN requester", () => {
  assert.notEqual(
    guardIndex,
    -1,
    "updateCustomProgram must check the requester role against COACH/ADMIN"
  );
});

test("the role check runs before any client lookup", () => {
  assert.ok(
    guardIndex !== -1 && firstLookupIndex !== -1 && guardIndex < firstLookupIndex,
    "role check must precede the target-client lookup"
  );
});

test("a non-coach requester is refused with 403", () => {
  const guardBlock = body.slice(Math.max(0, guardIndex - 200), guardIndex + 120);
  assert.match(guardBlock, /status\(403\)/, "non-coach refusal must be HTTP 403");
});

test("a CLIENT requester gets 403 before any program lookup", async (t) => {
  let controller;
  let models;
  try {
    controller = await import("../src/api/controllers/program.controller.js");
    models = await import("../src/api/models/index.js");
  } catch {
    t.skip("controller needs the database layer; run with dependencies installed");
    return;
  }
  const orig = models.User.findByPk;
  models.User.findByPk = async () => ({ id: 1, role: "CLIENT" });
  try {
    const out = {};
    const res = {
      status(c) { out.status = c; return res; },
      json(b) { out.body = b; return res; },
    };
    await controller.updateCustomProgram(
      { user: { id: 1 }, body: { client_code: "NOPE", program_data: { nutrition: {} } } },
      res
    );
    assert.equal(out.status, 403);
  } finally {
    models.User.findByPk = orig;
  }
});
