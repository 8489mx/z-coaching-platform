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
   publishing. Source guard in the style of
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

  test(`${name} never creates a program on the implicit ACTIVE default`, () => {
    const body = handlerBody(start, end);
    const createAt = body.indexOf("Program.create(");
    assert.ok(createAt >= 0, `${name} must create a program`);
    const createCall = body.slice(createAt, body.indexOf("});", createAt) + 3);
    assert.ok(
      createCall.includes("status:"),
      `${name} must pass an explicit status to Program.create`
    );
    assert.ok(
      /status:\s*[^,]*DRAFT/.test(body) || /program\.status\s*=\s*"DRAFT"/.test(body),
      `${name} must save a medical-review program as DRAFT`
    );
  });
}

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
