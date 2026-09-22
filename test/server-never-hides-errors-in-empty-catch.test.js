import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * House rule (AI_RULES.md section 5): no empty catch hiding a fault. The exercise catalog read and
 * the admin catalog files swallowed a corrupt JSON file silently (swaps lost their catalog
 * alternatives with nothing in the server log). They now log it.
 * Allowed: csrfProtection.js - a malformed entry in the allowed-origins list just does not match.
 */
const ALLOWED = new Set(["src/api/middlewares/csrfProtection.js"]);
const EMPTY_CATCH = /catch\s*(\([^)]*\))?\s*\{\s*\}/;

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" ? [] : files(p);
    return /\.(js|mjs)$/.test(e.name) ? [p] : [];
  });
}

test("no empty catch in the server code", () => {
  const found = [];
  for (const file of files("src")) {
    const rel = file.split(path.sep).join("/");
    if (ALLOWED.has(rel)) continue;
    fs.readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      if (EMPTY_CATCH.test(line)) found.push(`${rel}:${i + 1}`);
    });
  }
  assert.deepEqual(found, []);
});
