import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

// These two endpoints could write a corrupt or fabricated plan for a real client:
// one fed the still-encrypted intake wrapper to the first-generation engine, the other fell back to
// the test fixture when a client had no intake. Nothing called them. They must not come back.
test("the unreachable legacy program-generation endpoints stay removed", () => {
  const routes = read("src/api/routes/program.routes.js");
  const controller = read("src/api/controllers/program.controller.js");
  for (const name of ["generate-from-submission", "generate-for-client", "generateProgramFromSubmission", "generateProgramForClient"]) {
    assert.ok(!routes.includes(name), `routes still reference ${name}`);
    assert.ok(!controller.includes(name), `controller still defines ${name}`);
  }
  assert.ok(!controller.includes("master-engine/build-master-engine.js"), "the first-generation engine is not reachable from the API");
  assert.ok(!controller.includes("complete-intake.js"), "no server path builds a client plan from test fixture data");
});
