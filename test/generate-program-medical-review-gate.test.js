/* Guard for audit finding R1: a plan that requires medical review must
   never reach ACTIVE through the direct generation endpoints. The gate is
   computed on the adapted (canonical) intake — the same intake the master
   engine builds from, as in generateProgramPreview — and a
   MEDICAL_REVIEW_REQUIRED result saves the program as DRAFT, never by the
   ACTIVE model default and never by overwriting an existing program while
   keeping its ACTIVE status. READY_FOR_DRAFT results keep today's explicit
   ACTIVE creation. The Program model default is intentionally NOT changed:
   every other Program.create in the codebase already passes an explicit
   status, and flipping the global default would silently change next-cycle
   publishing. B5-3 (gap #7): the two handlers no longer call
   Program.create directly — every save goes through the shared helper
   createProgramRow, which passes the same explicit status and archives
   any superseded ACTIVE program. The guard below follows that
   indirection: its invariant is unchanged (no save may rely on the
   model's ACTIVE default; a review case saves DRAFT), and it additionally
   asserts the single choke point — exactly one Program.create in the
   controller, inside the helper. Source guard in the style of
   test/engine-copy-drift-guard.test.js: the controllers cannot be imported
   here without the database dependencies. A live HTTP/database test is
   still needed before the fix is trusted end to end. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const controller = fs.readFileSync(
  path.join(root, "src/api/controllers/program.controller.js"),
  "utf8"
);

function handlerBody(startMarker, endMarker) {
  const start = controller.indexOf(startMarker);
  const end = controller.indexOf(endMarker, start);
  assert.ok(start >= 0, `${startMarker} not found`);
  assert.ok(end > start, `${endMarker} not found after ${startMarker}`);
  return controller.slice(start, end);
}

for (const [name, start, end] of [
  ["generateProgram", "export const generateProgram =", "export const generateProgramPreview ="],
  ["generateAndSaveProgram", "export const generateAndSaveProgram =", "export const getUserPrograms ="],
]) {
  test(`${name} gates on MEDICAL_REVIEW_REQUIRED from the adapted intake`, () => {
    const body = handlerBody(start, end);
    assert.ok(
      body.includes("MEDICAL_REVIEW_REQUIRED"),
      `${name} must check for medical review, not only BLOCKED`
    );
    assert.ok(
      body.includes("adaptIntakePayloadToCanonicalEngine"),
      `${name} must evaluate the adapted intake, like the preview handler`
    );
  });

  test(`${name} saves only through the shared helper, with an explicit status (never the ACTIVE default)`, () => {
    const body = handlerBody(start, end);
    // B5-3 (gap #7): the handler no longer calls Program.create directly —
    // every save goes through createProgramRow, which passes an explicit
    // status and archives any superseded ACTIVE program. The invariant is
    // unchanged: no save may rely on the model's ACTIVE default, and a
    // review case must save DRAFT.
    assert.ok(
      !body.includes("Program.create("),
      `${name} must not create a program directly — save through createProgramRow`
    );
    const callAt = body.indexOf("createProgramRow(");
    assert.ok(callAt >= 0, `${name} must save through createProgramRow`);
    const call = body.slice(callAt, body.indexOf(");", callAt) + 2);
    assert.ok(
      call.includes("DRAFT"),
      `${name} must pass a status that saves a medical-review program as DRAFT`
    );
  });
}

test("createProgramRow passes an explicit status to Program.create and archives the superseded ACTIVE program", () => {
  const helper = handlerBody("async function createProgramRow(", "export const prepareNextCycle =");
  const createAt = helper.indexOf("Program.create(");
  assert.ok(createAt >= 0, "the shared helper must create the program");
  const createCall = helper.slice(createAt, helper.indexOf("});", createAt) + 3);
  assert.ok(
    createCall.includes("status"),
    "the shared helper must pass an explicit status, never the model default"
  );
  assert.ok(
    helper.includes("archiveSupersededActivePrograms"),
    "an ACTIVE create must archive the superseded ACTIVE program"
  );
});

test("Program.create appears exactly once in the controller — inside the shared helper", () => {
  const creates = [...controller.matchAll(/Program\.create\(/g)];
  assert.equal(
    creates.length,
    1,
    "every save path must go through the single choke point, not a second create"
  );
});

test("generateAndSaveProgram demotes an overwritten program to DRAFT when medical review is required", () => {
  const body = handlerBody(
    "export const generateAndSaveProgram =",
    "export const getUserPrograms ="
  );
  assert.ok(
    /program\.status\s*=\s*"DRAFT"/.test(body),
    "overwriting an existing program must set status DRAFT for medical-review cases instead of keeping ACTIVE"
  );
});
