import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PlanStatus } from '../src/intake-decision-engine/domain/enums.js';

// A misspelled status literal ("BLOCK") silently disabled the refusal of blocked intakes.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTROLLERS = path.join(ROOT, 'src/api/controllers');

test('every plan_status comparison in the API controllers uses a real PlanStatus value', () => {
  const valid = new Set(Object.values(PlanStatus));
  const invalid = [];
  let comparisons = 0;
  for (const file of fs.readdirSync(CONTROLLERS).filter((f) => f.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(CONTROLLERS, file), 'utf8');
    for (const m of src.matchAll(/plan_status\s*[!=]==?\s*["']([A-Z_]+)["']/g)) {
      comparisons++;
      if (!valid.has(m[1])) invalid.push(`${file}: ${m[1]}`);
    }
  }
  assert.ok(comparisons > 0);
  assert.deepEqual(invalid, []);
});
