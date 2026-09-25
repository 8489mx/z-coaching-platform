import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { assessServiceScope, outsideScopeResponse } from "../src/api/services/serviceScope.js";

/**
 * The server answers a case outside the service with the reason and a hint for the coach ("apologise
 * kindly and refer"), but the coach's screen showed the one-line error only, so he never learned why
 * or what to tell the client.
 */
test("the refusal carries a reason and a hint", () => {
  const scope = assessServiceScope({
    gender: "female", age: "30", height_cm: "165", weight_kg: "62", female_pregnancy: "PREGNANT",
    medical_conditions: { has_conditions: false, selected: ["none"] },
  });
  const body = outsideScopeResponse(scope);
  assert.equal(body.code, "OUTSIDE_SERVICE_SCOPE");
  assert.ok(body.reasons_ar.length > 0 && body.hint_ar);
});

test("the coach's screen shows the reason and the hint, not only the headline", () => {
  const src = fs.readFileSync("frontend/src/pages/IntakeSubmissions.jsx", "utf8");
  assert.match(src, /reasons_ar/);
  assert.match(src, /hint_ar/);
  assert.doesNotMatch(src, /alert\(data\.error \|\| 'فشل توليد مسودة الخطة'\)/);
});
