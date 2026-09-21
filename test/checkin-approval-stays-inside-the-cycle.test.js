import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { approveCheckin } from "../src/api/controllers/checkin.controller.js";
import { resolveTrainingCycleStatus } from "../src/api/services/trainingCycleService.js";
import { CheckinSubmission, Program } from "../src/api/models/index.js";

/**
 * A check-in's week_number counts weeks of the subscription (week 14 of an eight-month plan); the
 * plan's weeks count weeks of the current five-week cycle. Approving a week-14 check-in used to
 * append "week 15" to the cycle, so on a long subscription the cycle grew by a week with every
 * check-in and never ended, and every appended week was a deload (sets cut 40%, RIR 4).
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const DAY = 86400000;

function freshCycle(startedDaysAgo) {
  const program = buildMasterEngineV2({
    intake: {
      gender: "male", age: "30", height_cm: "178", weight_kg: "85", circumferences: { neck_cm: "40", waist_cm: "90", hips_cm: "100" },
      primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
      medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
      religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
      training_environment: "commercial_gym", training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
    },
    evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
  const data = JSON.parse(JSON.stringify(program)); // stored as JSON, as the database holds it
  data.cycle_number = 3;
  data.cycle_started_at = new Date(Date.now() - startedDaysAgo * DAY).toISOString();
  return data;
}

async function approve(programData, subscriptionWeek) {
  const row = { id: 7, user_id: 1, program_data: programData, createdAt: new Date(), async update(values) { Object.assign(this, values); } };
  const checkin = {
    id: 9, user_id: 1, week_number: subscriptionWeek, biofeedback: {}, pain_reports: [],
    analysis_output: { analysis_status: "ON_TRACK" }, async save() {},
  };
  const originals = [CheckinSubmission.findByPk, Program.findOne];
  CheckinSubmission.findByPk = async () => checkin;
  Program.findOne = async () => row;
  try {
    const out = {};
    await approveCheckin({ params: { checkinId: 9 }, body: {} }, { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } });
    assert.equal(out.status, 200);
    return row;
  } finally {
    [CheckinSubmission.findByPk, Program.findOne] = originals;
  }
}

const weeksOf = (data) => data.training_program.weeks;

for (const [subscriptionWeek, daysIntoCycle] of [[14, 8], [31, 22], [6, 30]]) {
  test(`a subscription-week-${subscriptionWeek} check-in ${daysIntoCycle} days into a cycle keeps the cycle at five weeks`, async () => {
    const data = freshCycle(daysIntoCycle);
    const before = weeksOf(data).map((w) => w.phase);
    assert.equal(before.length, 5, "precondition: a five-week cycle");
    const row = await approve(data, subscriptionWeek);
    const after = weeksOf(row.program_data);
    assert.equal(after.length, 5, `the cycle grew to ${after.length} weeks`);
    const deloads = after.filter((w) => w.phase === "DELOAD").length;
    assert.equal(deloads, 1, `${deloads} deload weeks in one cycle`);
    assert.equal(resolveTrainingCycleStatus(row).total_weeks, 5);
  });
}

test("the cycle still ends on time after a check-in every week", async () => {
  let data = freshCycle(0);
  for (let week = 20; week < 25; week++) data = (await approve(data, week)).program_data;
  const status = resolveTrainingCycleStatus({ program_data: { ...data, cycle_started_at: new Date(Date.now() - 36 * DAY).toISOString() } });
  assert.equal(status.status, "ENDED", "a five-week cycle is over after 36 days");
});
