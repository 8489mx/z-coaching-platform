import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { findInsecureProductionSecrets, assertProductionSecrets } from "../src/api/config/productionSecretsGuard.js";

test("production refuses placeholder or missing secrets", () => {
  const env = { NODE_ENV: "production", JWT_SECRET: "REPLACE_WITH_RANDOM_64_HEX_CHARS", MEDICAL_ENCRYPTION_KEY: "" };
  const problems = findInsecureProductionSecrets(env);
  assert.equal(problems.length, 2);
  assert.throws(() => assertProductionSecrets(env), /insecure production secrets/);
});

test("production with real secrets and non-production environments boot normally", () => {
  assert.deepEqual(findInsecureProductionSecrets({ NODE_ENV: "production", JWT_SECRET: "a".repeat(40), MEDICAL_ENCRYPTION_KEY: "b".repeat(40) }), []);
  assert.deepEqual(findInsecureProductionSecrets({ NODE_ENV: "development" }), []);
});

test(".env.example contains placeholders only, never real-looking secrets", () => {
  const example = fs.readFileSync(new URL("../.env.example", import.meta.url), "utf8");
  for (const name of ["JWT_SECRET", "INTAKE_JWT_SECRET", "CSRF_SECRET", "MEDICAL_ENCRYPTION_KEY"]) {
    const line = example.split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
    assert.ok(line, `${name} missing from .env.example`);
    assert.match(line, /=REPLACE_WITH_/, `${name} in .env.example must be a placeholder`);
  }
});
