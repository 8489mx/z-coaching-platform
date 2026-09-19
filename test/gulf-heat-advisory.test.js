import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getGulfHeatAdvisory, GULF_COUNTRY_CODES } from "../src/execution-engines/cardio-zones-engine.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Gulf clients get the heat advisory all summer, with the daytime window flagged on the local clock", () => {
  // 2026-07-15 09:00 UTC = 12:00 in Riyadh (inside 10:00-17:00)
  const noon = getGulfHeatAdvisory({ country_code: "SA", date: "2026-07-15T09:00:00Z" });
  assert.equal(noon.active, true);
  assert.equal(noon.blocking_now, true);
  assert.match(noon.message_ar, /ممنوع الكارديو في الهواء الطلق/);
  // 2026-07-15 02:00 UTC = 06:00 in Dubai: summer, but outside the blocked window
  const dawn = getGulfHeatAdvisory({ country_code: "AE", date: "2026-07-15T02:00:00Z" });
  assert.equal(dawn.active, true);
  assert.equal(dawn.blocking_now, false);
  for (const code of GULF_COUNTRY_CODES) assert.equal(getGulfHeatAdvisory({ country_code: code, date: "2026-08-01T10:00:00Z" }).active, true, code);
});

test("no advisory outside summer or outside the Gulf", () => {
  assert.equal(getGulfHeatAdvisory({ country_code: "KW", date: "2026-01-15T09:00:00Z" }).active, false);
  assert.equal(getGulfHeatAdvisory({ country_code: "QA", date: "2026-04-30T09:00:00Z" }).active, false);
  assert.equal(getGulfHeatAdvisory({ country_code: "OM", date: "2026-05-01T09:00:00Z" }).active, true, "May counts as summer");
  assert.equal(getGulfHeatAdvisory({ country_code: "EG", date: "2026-07-15T09:00:00Z" }).active, false);
  assert.equal(getGulfHeatAdvisory({}).active, false);
});

test("wiring: the active program response carries the country and the client cardio card shows the advisory", () => {
  assert.match(fs.readFileSync(path.join(ROOT, "src/api/controllers/program.controller.js"), "utf8"),
    /heat_advisory: getGulfHeatAdvisory\(\{ country_code: resolveCountryFromPhone\(user\.phone_number\) \}\)/);
  const hook = fs.readFileSync(path.join(ROOT, "frontend/src/pages/ClientInteractiveApp/hooks/useClientInteractiveData.js"), "utf8");
  assert.match(hook, /getGulfHeatAdvisory\(\{ country_code: heatCountry \}\)/);
  assert.match(hook, /if \(heat\.active\) notes\.push\(heat\.message_ar\)/);
});
