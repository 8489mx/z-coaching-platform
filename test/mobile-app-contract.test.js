import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getMyActiveProgram } from "../src/api/controllers/program.controller.js";
import { submitCheckin } from "../src/api/controllers/checkin.controller.js";
import { User, Program, CheckinSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

// Contract between the Flutter app (mobile_app/) and the API. Dart cannot be compiled here, so the
// server side is exercised with the exact requests the Dart code builds.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const CODE = "TEST_MOBILE_919";

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

test("mobile app: token-only active program and the mobile check-in payload", async (t) => {
  let user = await User.findOne({ where: { client_code: CODE } });
  if (user) {
    await CheckinSubmission.destroy({ where: { user_id: user.id } });
    await Program.destroy({ where: { user_id: user.id } });
    await user.destroy();
  }
  user = await User.create({ client_code: CODE, phone_number: "+966501234919", full_name: "Mobile", role: "CLIENT" });
  await Program.create({
    user_id: user.id,
    status: "ACTIVE",
    program_data: { nutrition: { targets: { calories: 2100, protein: 160, carbs: 210, fats: 70 }, meals: [] }, training_program: { weeks: [{ sessions: [{ session_name: "Push", exercises: [] }] }] } },
  });
  try {
    await t.test("GET /api/v1/programs/active returns the signed-in client's own program", async () => {
      const r = mockRes();
      await getMyActiveProgram({ user: { id: user.id }, params: {} }, r.res);
      assert.equal(r.out.status, 200, JSON.stringify(r.out.body));
      assert.equal(r.out.body.master_program.nutrition.targets.calories, 2100);
      assert.equal(r.out.body.heat_advisory.country_code, "SA");
    });

    await t.test("no signed-in user -> 401", async () => {
      const r = mockRes();
      await getMyActiveProgram({ params: {} }, r.res);
      assert.equal(r.out.status, 401);
    });

    await t.test("the Dart check-in payload is accepted, twice in a row (weeks 1 and 2)", async () => {
      for (const [weight, expectedWeek] of [[84.5, 1], [84.1, 2]]) {
        const r = mockRes();
        // Same keys as mobile_app/lib/features/checkin/services/checkin_service.dart
        await submitCheckin({ body: {
          user_id: CODE, weight_kg: weight, waist_circumference_cm: 92, nutrition_adherence_percent: 85,
          sleep_hours: 7, client_notes: "متوسط النوم: 7 ساعات", photos: [],
        } }, r.res);
        assert.equal(r.out.status, 201, JSON.stringify(r.out.body));
        assert.equal(r.out.body.checkin.week_number, expectedWeek);
      }
    });
  } finally {
    await CheckinSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
    await Program.destroy({ where: { user_id: user.id } }).catch(() => {});
    await user.destroy().catch(() => {});
    await sequelize.close().catch(() => {});
  }
});

test("mobile_app Dart code points at the routes and fields the server serves", () => {
  const constants = read("mobile_app/lib/core/constants/api_constants.dart");
  assert.match(constants, /activeProgram = '\/api\/v1\/programs\/active';/);
  assert.match(constants, /submitCheckin = '\/api\/v1\/checkin';/);
  assert.match(read("src/api/routes/program.routes.js"), /router\.get\("\/active", requireAuth, getMyActiveProgram\)/);

  const hub = read("mobile_app/lib/features/home/screens/today_hub_screen.dart");
  assert.match(hub, /ApiClient\(widget\.storage\)\.get\(ApiConstants\.activeProgram\)/);
  assert.match(hub, /widget\.storage\.cacheActiveProgram\(program\)/);
  assert.match(hub, /nutrition\['targets'\]/);
  assert.match(hub, /'training_program', 'training'/);

  const checkin = read("mobile_app/lib/features/checkin/services/checkin_service.dart");
  for (const key of ["'user_id'", "'weight_kg'", "'waist_circumference_cm'", "'nutrition_adherence_percent'", "'photo_url'"]) {
    assert.ok(checkin.includes(key), key);
  }
  assert.match(checkin, /if \(response\.statusCode == 0\) \{/, "only network failures are queued");
});

// Only one Flutter app exists (mobile_app/). The older mobile/ stub was deleted so nobody edits it by mistake.
test("there is exactly one Flutter app folder", () => {
  assert.ok(fs.existsSync(path.join(ROOT, "mobile_app/pubspec.yaml")), "mobile_app is the app");
  assert.ok(!fs.existsSync(path.join(ROOT, "mobile")), "the legacy mobile/ stub must stay deleted");
});

// The offline queue used to fill up and never empty: nothing in the app uploaded it.
test("the mobile offline check-in queue is uploaded when the app opens", () => {
  const service = read("mobile_app/lib/features/checkin/services/checkin_service.dart");
  assert.match(service, /Future<Map<String, int>> flushPendingCheckins\(\)/);
  assert.match(service, /replacePendingCheckins\(remaining\)/, "what could not be sent stays queued");
  const storage = read("mobile_app/lib/core/storage/local_storage.dart");
  assert.match(storage, /Future<void> replacePendingCheckins\(/);
  const nav = read("mobile_app/lib/features/home/screens/main_navigation_screen.dart");
  assert.match(nav, /_uploadPendingCheckins\(\);/);
  assert.match(nav, /flushPendingCheckins\(\)/);
});
