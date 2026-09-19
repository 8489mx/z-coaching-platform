import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { submitCheckin } from "../src/api/controllers/checkin.controller.js";
import { User, CheckinSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CODE = "TEST_PAIN_915";

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

test("joint pain from the check-in form flags the injury and recommends a deload at 7/10+", async () => {
  let user = await User.findOne({ where: { client_code: CODE } });
  if (user) { await CheckinSubmission.destroy({ where: { user_id: user.id } }); await user.destroy(); }
  user = await User.create({ client_code: CODE, phone_number: "01099000915", full_name: "Pain", role: "CLIENT" });
  try {
    const r = mockRes();
    await submitCheckin({ body: { user_id: CODE, week_number: 1, weight_kg: 80, nutrition_adherence_percent: 90, pain_reports: [{ area: "KNEE", body_part: "الركبة", pain_level: 8 }] } }, r.res);
    assert.equal(r.out.status, 201, JSON.stringify(r.out.body));
    assert.equal(r.out.body.analysis.analysis_status, "INJURY_FLAGGED");
    assert.equal(r.out.body.analysis.deload_recommendation.recommended, true);
    assert.equal(r.out.body.analysis.deload_recommendation.reason, "JOINT_PAIN");
  } finally {
    await CheckinSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
    await user.destroy().catch(() => {});
    await sequelize.close().catch(() => {});
  }
});

test("the web check-in form sends pain_reports with a 1-10 level", () => {
  const src = fs.readFileSync(path.join(ROOT, "frontend/src/pages/WeeklyCheckinForm.jsx"), "utf8");
  assert.match(src, /pain_reports: formData\.has_joint_pain && formData\.pain_area/);
  assert.match(src, /pain_level: Number\(formData\.pain_level\)/);
});

test("a failed check-in approval stays visible and keeps the check-in in the queue", () => {
  const src = fs.readFileSync(path.join(ROOT, "frontend/src/pages/CheckinReviewDashboard.jsx"), "utf8");
  const handler = src.slice(src.indexOf("const handleApprove = async"), src.indexOf("const handleResetDemo"));
  assert.match(handler, /if \(!res\.ok\) \{[\s\S]*?setApproveError[\s\S]*?return;/);
  assert.ok(handler.indexOf("return;") < handler.indexOf("checkinList.filter"), "queue removal happens only after a confirmed save");
});
