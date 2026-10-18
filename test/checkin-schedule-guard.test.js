import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveClientCadenceDays,
  getCairoDateString,
  cairoMidnightToUTC,
  calculateCycleSchedule,
  resolveProgramActivationDate,
  CADENCE_DAYS,
  SUBMISSION_WINDOW_HOURS,
} from "../src/api/services/checkinScheduleService.js";

test("Check-in Cadence: MAX is 7 days, ELITE is 14 days", () => {
  assert.equal(resolveClientCadenceDays({ subscription_tier: "MAX" }), 7);
  assert.equal(resolveClientCadenceDays({ subscription_tier: "MAX_3M" }), 7);
  assert.equal(resolveClientCadenceDays({ subscription_tier: "ELITE" }), 14);
  assert.equal(resolveClientCadenceDays({ subscription_tier: "ELITE_6M" }), 14);
  assert.equal(resolveClientCadenceDays({}), 7, "Default fallback is MAX 7 days");
});

test("Timezone Integrity: Cairo date formatting and midnight calculation", () => {
  // Test a date during Egypt Daylight Saving (UTC+3)
  const summerDate = new Date("2026-07-15T10:00:00Z");
  assert.equal(getCairoDateString(summerDate), "2026-07-15");

  // Cairo midnight to UTC: in UTC+3, Cairo midnight 2026-07-15 00:00 is 2026-07-14 21:00 UTC
  const summerMidnight = cairoMidnightToUTC("2026-07-15");
  assert.equal(summerMidnight.toISOString(), "2026-07-14T21:00:00.000Z");
  assert.equal(getCairoDateString(summerMidnight), "2026-07-15");

  // Window duration is strictly 72 hours
  assert.equal(SUBMISSION_WINDOW_HOURS, 72);
});

test("Schedule Anchor: Due date is anchored to program activation date, never moves when late", () => {
  // Activated on Friday 2026-10-02
  const activationDate = new Date("2026-10-02T12:00:00Z");

  // MAX Plan (7 days cadence)
  // Cycle 1: Due Friday 2026-10-09
  const maxCycle1 = calculateCycleSchedule(activationDate, 1, CADENCE_DAYS.MAX);
  assert.equal(maxCycle1.dueCairoYmd, "2026-10-09");
  assert.equal(maxCycle1.windowOpensAt.toISOString(), "2026-10-08T21:00:00.000Z");
  // Window is 72 hours later -> 2026-10-11T21:00:00.000Z (which is 2026-10-12 00:00:00 Cairo)
  assert.equal(maxCycle1.windowClosesAt.toISOString(), "2026-10-11T21:00:00.000Z");

  // Cycle 2: Due Friday 2026-10-16 (14 days from activation, strictly fixed)
  const maxCycle2 = calculateCycleSchedule(activationDate, 2, CADENCE_DAYS.MAX);
  assert.equal(maxCycle2.dueCairoYmd, "2026-10-16");
  assert.equal(maxCycle2.windowOpensAt.toISOString(), "2026-10-15T21:00:00.000Z");
  assert.equal(maxCycle2.windowClosesAt.toISOString(), "2026-10-18T21:00:00.000Z");

  // Cycle 3: Due Friday 2026-10-23
  const maxCycle3 = calculateCycleSchedule(activationDate, 3, CADENCE_DAYS.MAX);
  assert.equal(maxCycle3.dueCairoYmd, "2026-10-23");
});

test("ELITE Schedule: Due dates occur every 14 days from activation", () => {
  const activationDate = new Date("2026-10-02T12:00:00Z");

  // ELITE Cycle 1: 14 days from activation -> 2026-10-16
  const eliteCycle1 = calculateCycleSchedule(activationDate, 1, CADENCE_DAYS.ELITE);
  assert.equal(eliteCycle1.dueCairoYmd, "2026-10-16");
  assert.equal(eliteCycle1.windowOpensAt.toISOString(), "2026-10-15T21:00:00.000Z");
  assert.equal(eliteCycle1.windowClosesAt.toISOString(), "2026-10-18T21:00:00.000Z");

  // ELITE Cycle 2: 28 days from activation -> 2026-10-30
  const eliteCycle2 = calculateCycleSchedule(activationDate, 2, CADENCE_DAYS.ELITE);
  assert.equal(eliteCycle2.dueCairoYmd, "2026-10-30");
});

test("Program Activation Date Source: cycle_started_at takes precedence over createdAt, payment date ignored", () => {
  const progWithCycleStart = {
    program_data: { cycle_started_at: "2026-10-05T08:00:00Z" },
    createdAt: new Date("2026-10-01T00:00:00Z"),
  };
  const user = {
    subscription_start_date: new Date("2026-09-28T00:00:00Z"),
    payment_status: "PAID",
  };

  const resolved = resolveProgramActivationDate(progWithCycleStart, user);
  assert.equal(resolved.toISOString(), "2026-10-05T08:00:00.000Z");

  const progWithoutCycleStart = {
    program_data: {},
    createdAt: new Date("2026-10-01T00:00:00Z"),
  };
  const resolvedFallback = resolveProgramActivationDate(progWithoutCycleStart, user);
  assert.equal(resolvedFallback.toISOString(), "2026-10-01T00:00:00.000Z");
});

test("evaluateClientCheckinSchedule: Early, On-time, Expired and Schedule Invariance", async () => {
  const { User, Program, CheckinSubmission } = await import("../src/api/models/index.js");
  const { evaluateClientCheckinSchedule } = await import("../src/api/services/checkinScheduleService.js");

  const CODE = "TEST_SCHED_GUARD_001";
  let user = await User.findOne({ where: { client_code: CODE } });
  if (user) {
    await CheckinSubmission.destroy({ where: { user_id: user.id } });
    await Program.destroy({ where: { user_id: user.id } });
    await user.destroy();
  }

  user = await User.create({
    client_code: CODE,
    phone_number: "01099887766",
    full_name: "Schedule Guard Trainee",
    role: "CLIENT",
    package_tier: "MAX",
    subscription_package: "MAX",
  });

  // Program activated on 2026-10-02 10:00 UTC (Friday)
  const program = await Program.create({
    user_id: user.id,
    status: "ACTIVE",
    version: 1,
    program_data: {
      cycle_started_at: "2026-10-02T10:00:00.000Z",
      subscription_tier: "MAX",
    },
  });

  try {
    // 1. Early Submission: On 2026-10-06 (4 days in, before Week 1 due on 2026-10-09)
    const earlyEval = await evaluateClientCheckinSchedule(user.id, new Date("2026-10-06T12:00:00Z"));
    assert.equal(earlyEval.allowed, false);
    assert.equal(earlyEval.status, "UPCOMING");
    assert.equal(earlyEval.code, "CHECKIN_WINDOW_NOT_OPEN");
    assert.equal(earlyEval.scheduled_due_date, "2026-10-09");

    // 2. On-Time Submission: On 2026-10-09 10:00 UTC (Inside 72h window)
    const onTimeEval = await evaluateClientCheckinSchedule(user.id, new Date("2026-10-09T10:00:00Z"));
    assert.equal(onTimeEval.allowed, true);
    assert.equal(onTimeEval.status, "OPEN");
    assert.equal(onTimeEval.code, "CHECKIN_WINDOW_OPEN");
    assert.equal(onTimeEval.cycle_sequence, 1);

    // 3. Late Submission: On 2026-10-13 (Day 11, >72 hours after Oct 09 window closed on Oct 11T21:00Z)
    const lateEval = await evaluateClientCheckinSchedule(user.id, new Date("2026-10-13T10:00:00Z"));
    assert.equal(lateEval.allowed, false);
    assert.equal(lateEval.status, "EXPIRED");
    assert.equal(lateEval.code, "CHECKIN_WINDOW_EXPIRED");

    // 4. Invariance: Even if client missed Week 1, Week 2 is still anchored to Oct 16 (never shifts)
    const week2Eval = await evaluateClientCheckinSchedule(user.id, new Date("2026-10-16T10:00:00Z"));
    assert.equal(week2Eval.allowed, true);
    assert.equal(week2Eval.status, "OPEN");
    assert.equal(week2Eval.scheduled_due_date, "2026-10-16");
    assert.equal(week2Eval.cycle_sequence, 2);

    // 5. Duplicate Checkin: Once submitted for Week 2, subsequent submission in same week is rejected
    await CheckinSubmission.create({
      user_id: user.id,
      week_number: 2,
      daily_weights_kg: [80],
      average_weight_kg: 80,
      nutrition_adherence_percent: 95,
      analysis_status: "ON_TRACK",
      analysis_output: { weight_change_kg: 0 },
      biofeedback: {},
    });

    const dupEval = await evaluateClientCheckinSchedule(user.id, new Date("2026-10-16T12:00:00Z"));
    assert.equal(dupEval.allowed, false);
    assert.equal(dupEval.status, "SUBMITTED");
    assert.equal(dupEval.code, "DUPLICATE_CHECKIN_SUBMISSION");
  } finally {
    const { default: sequelize } = await import("../src/api/config/database.js");
    await CheckinSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
    await Program.destroy({ where: { user_id: user.id } }).catch(() => {});
    await user.destroy().catch(() => {});
  }
});

test("submitCheckin Endpoint: Enforces 403 on Early and Expired, 409 on Duplicate, 201 on Valid Window", async () => {
  const { User, Program, CheckinSubmission } = await import("../src/api/models/index.js");
  const { submitCheckin } = await import("../src/api/controllers/checkin.controller.js");

  const CODE = "TEST_API_GUARD_999";
  let user = await User.findOne({ where: { client_code: CODE } });
  if (user) {
    await CheckinSubmission.destroy({ where: { user_id: user.id } });
    await Program.destroy({ where: { user_id: user.id } });
    await user.destroy();
  }

  user = await User.create({
    client_code: CODE,
    phone_number: "01099887755",
    full_name: "API Guard Trainee",
    role: "CLIENT",
    package_tier: "MAX",
    subscription_package: "MAX",
  });

  const program = await Program.create({
    user_id: user.id,
    status: "ACTIVE",
    version: 1,
    program_data: {
      cycle_started_at: "2026-10-02T10:00:00.000Z",
      subscription_tier: "MAX",
    },
  });

  function mockRes() {
    const out = { status: 200, body: null };
    const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
    return { res, out };
  }

  try {
    // 1. Early Submission via API -> 403 CHECKIN_WINDOW_NOT_OPEN
    const earlyRes = mockRes();
    await submitCheckin({
      body: {
        user_id: CODE,
        weight_kg: 85,
        nutrition_adherence_percent: 100,
        enforce_schedule_guard: true,
        submission_time: "2026-10-06T12:00:00Z",
      },
    }, earlyRes.res);

    assert.equal(earlyRes.out.status, 403);
    assert.equal(earlyRes.out.body.code, "CHECKIN_WINDOW_NOT_OPEN");

    // 2. Late Submission via API (>72h) -> 403 CHECKIN_WINDOW_EXPIRED
    const lateRes = mockRes();
    await submitCheckin({
      body: {
        user_id: CODE,
        weight_kg: 85,
        nutrition_adherence_percent: 100,
        enforce_schedule_guard: true,
        submission_time: "2026-10-13T12:00:00Z",
      },
    }, lateRes.res);

    assert.equal(lateRes.out.status, 403);
    assert.equal(lateRes.out.body.code, "CHECKIN_WINDOW_EXPIRED");

    // 3. Valid Submission inside Window (Oct 09) -> 201 Created with authoritative week 1
    const validRes = mockRes();
    await submitCheckin({
      body: {
        user_id: CODE,
        weight_kg: 84.5,
        nutrition_adherence_percent: 95,
        enforce_schedule_guard: true,
        submission_time: "2026-10-09T14:00:00Z",
      },
    }, validRes.res);

    assert.equal(validRes.out.status, 201);
    assert.equal(validRes.out.body.checkin.week_number, 1);

    // 4. Duplicate Submission in same cycle -> 409 DUPLICATE_CHECKIN_SUBMISSION
    const dupRes = mockRes();
    await submitCheckin({
      body: {
        user_id: CODE,
        weight_kg: 84.4,
        nutrition_adherence_percent: 95,
        enforce_schedule_guard: true,
        submission_time: "2026-10-09T15:00:00Z",
      },
    }, dupRes.res);

    assert.equal(dupRes.out.status, 409);
    assert.equal(dupRes.out.body.code, "DUPLICATE_CHECKIN_SUBMISSION");
  } finally {
    await CheckinSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
    await Program.destroy({ where: { user_id: user.id } }).catch(() => {});
    await user.destroy().catch(() => {});
  }
});

test("Activation Validation: DRAFT plans and future dates are strictly rejected", () => {
  // 1. DRAFT plan with cycle_started_at must be rejected
  const draftProg = {
    status: "DRAFT",
    program_data: { cycle_started_at: "2026-10-01T00:00:00Z" },
    createdAt: new Date("2026-10-01T00:00:00Z"),
  };
  assert.equal(resolveProgramActivationDate(draftProg), null, "DRAFT status must return null activation date");

  // 2. Future createdAt must be rejected
  const futureProg = {
    status: "ACTIVE",
    createdAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days in future
  };
  assert.equal(resolveProgramActivationDate(futureProg), null, "Future date must return null activation date");

  // 3. Valid ACTIVE plan is accepted
  const validProg = {
    status: "ACTIVE",
    createdAt: new Date("2026-09-01T00:00:00Z"),
  };
  assert.notEqual(resolveProgramActivationDate(validProg), null);
});

test("IDOR Security Guard: getCheckinSchedule rejects unauthorized access with 403", async () => {
  const { User, Program } = await import("../src/api/models/index.js");
  const { getCheckinSchedule } = await import("../src/api/controllers/checkin.controller.js");

  const CLIENT_A_CODE = "TEST_IDOR_CLIENT_A";
  const CLIENT_B_CODE = "TEST_IDOR_CLIENT_B";
  const COACH_CODE = "TEST_IDOR_COACH";

  for (const c of [CLIENT_A_CODE, CLIENT_B_CODE, COACH_CODE]) {
    const existing = await User.findOne({ where: { client_code: c } });
    if (existing) {
      await Program.destroy({ where: { user_id: existing.id } });
      await existing.destroy();
    }
  }

  const clientA = await User.create({ client_code: CLIENT_A_CODE, phone_number: "01099881111", full_name: "Client A", role: "CLIENT" });
  const clientB = await User.create({ client_code: CLIENT_B_CODE, phone_number: "01099882222", full_name: "Client B", role: "CLIENT" });
  const coach = await User.create({ client_code: COACH_CODE, phone_number: "01099883333", full_name: "Coach Karim", role: "ADMIN" });

  await Program.create({
    user_id: clientA.id,
    status: "ACTIVE",
    program_data: { cycle_started_at: "2026-10-01T00:00:00Z", subscription_tier: "MAX" },
  });

  function mockRes() {
    const out = { status: 200, body: null };
    const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
    return { res, out };
  }

  try {
    // 1. Client B tries to view Client A's schedule -> 403 Forbidden
    const hackRes = mockRes();
    await getCheckinSchedule({ params: { userId: clientA.id }, user: { id: clientB.id, role: "CLIENT" } }, hackRes.res);
    assert.equal(hackRes.out.status, 403);
    assert.equal(hackRes.out.body.success, false);

    // 2. Client A views their own schedule -> 200 OK
    const ownerRes = mockRes();
    await getCheckinSchedule({ params: { userId: clientA.id }, user: { id: clientA.id, role: "CLIENT" } }, ownerRes.res);
    assert.equal(ownerRes.out.status, 200);
    assert.equal(ownerRes.out.body.success, true);

    // 3. Coach views Client A's schedule -> 200 OK
    const coachRes = mockRes();
    await getCheckinSchedule({ params: { userId: clientA.id }, user: { id: coach.id, role: "ADMIN" } }, coachRes.res);
    assert.equal(coachRes.out.status, 200);
    assert.equal(coachRes.out.body.success, true);
  } finally {
    for (const u of [clientA, clientB, coach]) {
      await Program.destroy({ where: { user_id: u.id } }).catch(() => {});
      await u.destroy().catch(() => {});
    }
  }
});

test("Multi-Cycle Continuity: Prior check-ins from previous programs offset week number without collision", async () => {
  const { User, Program, CheckinSubmission } = await import("../src/api/models/index.js");
  const { evaluateClientCheckinSchedule } = await import("../src/api/services/checkinScheduleService.js");

  const CODE = "TEST_MULTICYCLE_007";
  let user = await User.findOne({ where: { client_code: CODE } });
  if (user) {
    await CheckinSubmission.destroy({ where: { user_id: user.id } });
    await Program.destroy({ where: { user_id: user.id } });
    await user.destroy();
  }

  user = await User.create({ client_code: CODE, phone_number: "01099884444", full_name: "Multi-Cycle Client", role: "CLIENT", subscription_package: "MAX", package_tier: "MAX" });

  try {
    // Cycle 1: Activated on Sept 01, completed 4 weeks of check-ins (weeks 1 to 4)
    for (let w = 1; w <= 4; w++) {
      await CheckinSubmission.create({
        user_id: user.id,
        week_number: w,
        daily_weights_kg: [80],
        average_weight_kg: 80,
        nutrition_adherence_percent: 90,
        analysis_status: "ON_TRACK",
        analysis_output: {},
        biofeedback: {},
        createdAt: new Date(`2026-09-${w * 7 < 10 ? '0' + (w * 7) : w * 7}T12:00:00Z`),
      });
    }

    // Cycle 2: Activated on Oct 01 (after Cycle 1)
    await Program.create({
      user_id: user.id,
      status: "ACTIVE",
      program_data: { cycle_started_at: "2026-10-01T00:00:00Z", cycle_number: 2, subscription_tier: "MAX" },
    });

    // 7 days after Cycle 2 activation (Oct 08): Cycle sequence is 1, but authoritative week is 4 + 1 = 5
    const cycle2Week1 = await evaluateClientCheckinSchedule(user.id, new Date("2026-10-08T12:00:00Z"));
    assert.equal(cycle2Week1.cycle_sequence, 1, "First cycle sequence of Program 2");
    assert.equal(cycle2Week1.expected_week_number, 5, "Cumulative week correctly offsets to week 5");
    assert.equal(cycle2Week1.status, "OPEN", "Window is open and ready to accept week 5");

    // Once week 5 is submitted, it marks week 5 submitted
    await CheckinSubmission.create({
      user_id: user.id,
      week_number: 5,
      daily_weights_kg: [79.5],
      average_weight_kg: 79.5,
      nutrition_adherence_percent: 92,
      analysis_status: "ON_TRACK",
      analysis_output: {},
      biofeedback: {},
      createdAt: new Date("2026-10-08T13:00:00Z"),
    });

    const cycle2Week1After = await evaluateClientCheckinSchedule(user.id, new Date("2026-10-08T14:00:00Z"));
    assert.equal(cycle2Week1After.status, "SUBMITTED");
    assert.equal(cycle2Week1After.code, "DUPLICATE_CHECKIN_SUBMISSION");
  } finally {
    const { default: sequelize } = await import("../src/api/config/database.js");
    await CheckinSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
    await Program.destroy({ where: { user_id: user.id } }).catch(() => {});
    await user.destroy().catch(() => {});
    await sequelize.close().catch(() => {});
  }
});

