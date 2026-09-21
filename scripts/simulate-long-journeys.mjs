/**
 * Long-horizon journeys: hard clients carried week by week from the intake to the end of their
 * subscription (4, 8 and 12 months) through the real controllers and the local database.
 * Time is simulated by moving every date of the simulated clients one week back per step.
 * Run: node --env-file=.env scripts/simulate-long-journeys.mjs [--keep]
 * Only JRN_ clients are touched; the global run-due is not called (it would act on real clients),
 * its exact per-client logic is applied instead.
 */
import { Op } from "sequelize";
const W = new URL("../", import.meta.url).href;
const { submitPublicIntake, getAllIntakeSubmissions, generateDraftFromIntake, approveAndPublishIntake } = await import(W + "src/api/controllers/intake.controller.js");
const { getActiveProgramByUserId, prepareNextCycle, getCyclesNeedingAttention, updateCustomProgram } = await import(W + "src/api/controllers/program.controller.js");
const { submitCheckin, approveCheckin, logWorkout } = await import(W + "src/api/controllers/checkin.controller.js");
const { User, IntakeSubmission, Program, CheckinSubmission, WorkoutLog } = await import(W + "src/api/models/index.js");
const sequelize = (await import(W + "src/api/config/database.js")).default;
const { resolveTrainingCycleStatus } = await import(W + "src/api/services/trainingCycleService.js");
const { evaluateClientCheckinOverdue } = await import(W + "src/execution-engines/overdue-checkin-engine.js");

const DAY = 86400000;
function call(fn, req) {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return fn(req, res).then(() => out);
}

const base = () => ({
  health_data_consent: { accepted: true, version: "PDPL-2026-09", accepted_at: new Date().toISOString() },
  neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: [], bariatric: { is_operated: false, meal_capacity_grams: "150_200", dumping_syndrome: false },
    diabetes: { type: "type2", uses_insulin: false, icr_ratio: "", hba1c: "" }, favism_g6pd: false, renal_hepatic_issue: false, thyroid: "none", gi_issues: [],
    female_cases: { is_pcos: false, is_lactating: false, is_postpartum: false }, hypertension: false, gout: false, cholecystectomy: false, other_notes: "" },
  injuries_map: { has_injuries: false, selected_areas: [], knee: [], spine_back: [], shoulder: [], core: [], other_joints: [], injury_nature: "chronic", pain_relieved_by_rest: true },
  smoking_status: "non_smoker", current_meds_supplements_list: [], current_meds_supplements: "", religion: "MUSLIM", christianFastingStyle: "PESCATARIAN_ALLOWED",
  strict_allergies: [], other_allergies: "", cuisine_preference: "egyptian_traditional", food_budget: "MEDIUM", food_prep_ability: "FULL_KITCHEN",
  meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" }, cravings_pattern: "controlled", beverage_sugar_intake: "zero_or_sweetener",
  sleep_schedule: { pattern: "regular_night", average_hours: "7_8", bedtime_hour: "23:30" }, disliked_foods: [], disliked_foods_text: "",
  training_environment: "commercial_gym", training_logistics: { days_per_week: 4, experience_level: "intermediate", has_other_sports: false, sports_name: "none", hours_per_week: 0 },
  recent_training: "ACTIVE", focus_muscles: [], media_uploads: { front_url: "", side_url: "", back_url: "", inbody_report_url: "", medical_reports_urls: [] },
});
const med = (over) => ({ ...base().medical_conditions, has_conditions: true, ...over });

// Weight curves: each returns {w, adh, pain, off} for week n (1-based). off = no training, no check-in.
const JOURNEYS = [
  {
    code: "JRN_01", name: "رجل سكري بالأنسولين وضغط وركبة - 4 شهور", gender: "male", pkg: "ELITE_4M", months: 4,
    answers: { ...base(), gender: "male", age: "46", height_cm: "172", weight_kg: "118", circumferences: { neck_cm: "45", waist_cm: "121", hips_cm: "116" },
      primary_goal: "fat_loss", neat_level: "sedentary",
      medical_conditions: med({ selected: ["diabetes", "hypertension"], diabetes: { type: "type2", uses_insulin: true, icr_ratio: "", hba1c: "8.4" }, hypertension: true }),
      injuries_map: { ...base().injuries_map, has_injuries: true, selected_areas: ["knee"], knee: ["patellofemoral"] },
      training_logistics: { ...base().training_logistics, days_per_week: 3, experience_level: "beginner" }, strict_allergies: ["gluten_celiac"] },
    week: (n) => ({ w: n <= 6 ? 118 - 0.8 * n : n <= 10 ? 113.2 : 113.2 - 0.5 * (n - 10), adh: n >= 7 && n <= 10 ? 65 : 88, pain: n === 9 ? 8 : 0, off: false }),
  },
  {
    code: "JRN_02", name: "ست تكيس وغدة وانقطاع شهر ثم رجوع وزيادة - 8 شهور", gender: "female", pkg: "ELITE_8M", months: 8,
    answers: { ...base(), gender: "female", age: "33", height_cm: "160", weight_kg: "92", circumferences: { neck_cm: "36", waist_cm: "98", hips_cm: "118" },
      primary_goal: "fat_loss", medical_conditions: med({ selected: ["thyroid"], thyroid: "hypothyroid", female_cases: { is_pcos: true, is_lactating: false, is_postpartum: false } }),
      training_environment: "home_gym", strict_allergies: ["dairy_lactose", "eggs"] },
    week: (n) => ({ w: n <= 12 ? 92 - 0.45 * n : n <= 17 ? 86.6 + 0.6 * (n - 12) : 89.6 - 0.35 * (n - 17), adh: n > 17 ? 80 : 85, pain: 0, off: n >= 13 && n <= 17 }),
  },
  {
    code: "JRN_03", name: "شاب نحيف تضخيم بيت أحبال - سنة كاملة MAX", gender: "male", pkg: "MAX", months: 12,
    answers: { ...base(), gender: "male", age: "20", height_cm: "183", weight_kg: "58", circumferences: { neck_cm: "33", waist_cm: "70", hips_cm: "84" },
      primary_goal: "lean_bulk", neat_level: "very_active", training_environment: "calisthenics_bands",
      training_logistics: { ...base().training_logistics, days_per_week: 5, experience_level: "beginner" }, strict_allergies: ["peanuts_tree_nuts", "sesame_seeds"],
      meal_structure: { meals_count: "4_to_5_meals", intermittent_fasting: "none" } },
    week: (n) => ({ w: 58 + Math.min(n, 30) * 0.22 + Math.max(0, n - 30) * 0.08, adh: n % 9 === 0 ? 55 : 85, pain: n === 40 ? 7 : 0, off: n >= 25 && n <= 26 }),
  },
  {
    code: "JRN_04", name: "ست 58 سنة كلى وكبد (مراجعة طبية) - 8 شهور", gender: "female", pkg: "ELITE_8M", months: 8,
    answers: { ...base(), gender: "female", age: "58", height_cm: "158", weight_kg: "81", circumferences: { neck_cm: "37", waist_cm: "99", hips_cm: "112" },
      primary_goal: "general_fitness", medical_conditions: med({ selected: ["renal", "hepatic", "hypertension"], renal_hepatic_issue: true, hypertension: true }),
      injuries_map: { ...base().injuries_map, has_injuries: true, selected_areas: ["spine_back"], spine_back: ["disc_herniation"] },
      training_environment: "minimal_equipment", training_logistics: { ...base().training_logistics, days_per_week: 2, experience_level: "beginner" }, strict_allergies: ["fish_shellfish"] },
    week: (n) => ({ w: 81 - 0.2 * Math.min(n, 20), adh: 80, pain: n === 15 ? 6 : 0, off: false }),
  },
  {
    code: "JRN_05", name: "ست مرضعة تنزل بسرعة - 4 شهور", gender: "female", pkg: "ELITE_4M", months: 4,
    answers: { ...base(), gender: "female", age: "29", height_cm: "165", weight_kg: "76", circumferences: { neck_cm: "34", waist_cm: "88", hips_cm: "106" },
      primary_goal: "fat_loss", medical_conditions: med({ selected: [], female_cases: { is_pcos: false, is_lactating: true, is_postpartum: true } }),
      strict_allergies: ["dairy_lactose"], meal_structure: { meals_count: "4_to_5_meals", intermittent_fasting: "none" } },
    week: (n) => ({ w: 76 - 1.1 * n, adh: 95, pain: 0, off: false }),
  },
  {
    code: "JRN_06", name: "رجل ريكومب سنة كاملة بالتزام ضعيف وضغط شغل - MAX", gender: "male", pkg: "MAX", months: 12,
    answers: { ...base(), gender: "male", age: "38", height_cm: "178", weight_kg: "100", circumferences: { neck_cm: "42", waist_cm: "104", hips_cm: "108" },
      primary_goal: "recomposition", medical_conditions: med({ selected: ["gout"], gout: true }),
      injuries_map: { ...base().injuries_map, has_injuries: true, selected_areas: ["shoulder"], shoulder: ["impingement"] },
      sleep_schedule: { pattern: "rotating_shifts", average_hours: "less_6", bedtime_hour: "02:00" },
      training_logistics: { ...base().training_logistics, days_per_week: 4, experience_level: "advanced" }, meal_structure: { meals_count: "3_meals", intermittent_fasting: "16_8" } },
    week: (n) => ({ w: 100 + (n % 6 < 3 ? 0.5 : -0.4) + (n > 26 ? -0.1 * (n - 26) : 0), adh: 40 + (n % 5) * 8, pain: n === 20 || n === 21 ? 7 : 0, off: n >= 33 && n <= 36 }),
  },
];

async function cleanup() {
  const users = await User.findAll({ where: { client_code: { [Op.like]: "JRN_%" } } });
  for (const u of users) {
    for (const M of [WorkoutLog, CheckinSubmission, Program, IntakeSubmission]) await M.destroy({ where: { user_id: u.id } });
    await u.destroy();
  }
}

/** One simulated week passes: every date of the simulated clients moves 7 days back. */
async function ageWorld(ids, days = 7) {
  const list = ids.join(",");
  for (const t of ["programs", "checkin_submissions", "workout_logs", "intake_submissions"]) {
    await sequelize.query(`UPDATE ${t} SET createdAt = DATE_SUB(createdAt, INTERVAL ${days} DAY), updatedAt = DATE_SUB(updatedAt, INTERVAL ${days} DAY) WHERE user_id IN (${list})`);
  }
  await sequelize.query(`UPDATE users SET subscription_end_date = DATE_SUB(subscription_end_date, INTERVAL ${days} DAY), subscription_start_date = DATE_SUB(subscription_start_date, INTERVAL ${days} DAY) WHERE id IN (${list})`);
  for (const p of await Program.findAll({ where: { user_id: ids } })) {
    const d = p.program_data || {};
    if (d.cycle_started_at) {
      d.cycle_started_at = new Date(new Date(d.cycle_started_at).getTime() - days * DAY).toISOString();
      p.program_data = { ...d };
      p.changed("program_data", true);
      await p.save({ silent: true });
    }
  }
}

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
function targetsOf(pd = {}) {
  const t = pd.nutrition?.targets || {}; const mt = pd.nutrition_program?.macro_targets || {};
  return { kcal: num(t.calories ?? mt.calories_kcal), protein: num(t.protein ?? t.protein_g ?? mt.protein_g), carbs: num(t.carbs ?? t.carb_g ?? mt.carbohydrate_g), fat: num(t.fat ?? t.fat_g ?? mt.fat_g) };
}
const exerciseSet = (pd = {}) => new Set(((pd.training_program || pd.training || {}).weeks || []).flatMap((w) => (w.sessions || []).flatMap((s) => (s.exercises || []).map((e) => e.exercise_code || e.code))));

await cleanup();
const coach = await User.findOne({ where: { client_code: "JRN_COACH" } }) || await User.create({ client_code: "JRN_COACH", phone_number: "01097700000", full_name: "كوتش الرحلات", role: "ADMIN" });
const COACH = { id: coach.id, role: "ADMIN" };
const results = [];

for (const [i, J] of JOURNEYS.entries()) {
  const log = [];
  const issues = [];
  const bad = (msg) => issues.push(msg);
  const user = await User.create({ client_code: J.code, phone_number: `0109770000${i + 1}`, full_name: J.name, role: "CLIENT", gender: J.gender,
    subscription_package: J.pkg, subscription_status: "ACTIVE", subscription_start_date: new Date(), subscription_end_date: new Date(Date.now() + J.months * 30 * DAY) });

  const sub = await call(submitPublicIntake, { body: { client_code: J.code, phone_number: user.phone_number, full_name: J.name, answers: J.answers } });
  if (sub.status >= 300) { bad(`الاستمارة رُفضت ${sub.status} ${JSON.stringify(sub.body).slice(0, 200)}`); results.push({ J, log, issues }); continue; }
  const list = await call(getAllIntakeSubmissions, { user: COACH });
  const s = (list.body?.submissions || []).find((x) => x.user_id === user.id || x.user?.client_code === J.code);
  const draft = await call(generateDraftFromIntake, { params: { submission_id: s.id }, user: COACH });
  if (draft.status !== 200) bad(`المسودة فشلت ${draft.status} ${JSON.stringify(draft.body).slice(0, 200)}`);
  let pub = await call(approveAndPublishIntake, { params: { submission_id: s.id }, body: {}, user: COACH });
  const needsMedical = pub.status === 409;
  if (needsMedical) pub = await call(approveAndPublishIntake, { params: { submission_id: s.id }, body: { medical_review_confirmed: true }, user: COACH });
  if (pub.status !== 200) bad(`النشر فشل ${pub.status}`);

  const first = await Program.findOne({ where: { user_id: user.id, status: "ACTIVE" }, order: [["id", "DESC"]] });
  const t0 = targetsOf(first?.program_data);
  const baseExercises = exerciseSet(first?.program_data);
  const floor = J.gender === "female" ? 1200 : 1500;
  const cadence = J.pkg.includes("MAX") ? 7 : 14;
  const totalWeeks = Math.ceil((J.months * 30) / 7) + 2; // two weeks past the end
  let lastCheckinWeek = 0;
  let prevKcal = t0.kcal;
  let pendingDraftSince = null;
  let cycles = 1;
  let autoPublished = 0;
  let renewalSeen = false;
  let benchKg = 20;

  for (let n = 1; n <= totalWeeks; n++) {
    await ageWorld([user.id]);
    await user.reload();
    const wk = J.week(n);
    const subEnded = user.subscription_end_date && new Date(user.subscription_end_date).getTime() < Date.now();
    const events = [];

    // Training: two logged exercises from today's first session.
    const active = await Program.findOne({ where: { user_id: user.id, status: "ACTIVE" }, order: [["id", "DESC"]] });
    const firstSession = ((active?.program_data?.training_program || active?.program_data?.training || {}).weeks || [])[0]?.sessions?.[0];
    if (!wk.off && !subEnded && firstSession) {
      const exs = (firstSession.exercises || []).slice(0, 2);
      const stall = wk.adh < 60;
      if (!stall) benchKg += 1.25;
      const lw = await call(logWorkout, { user: { id: user.id, role: "CLIENT" }, body: { user_id: user.id, program_id: active.id, week_number: n, day_number: 1, session_title: firstSession.title || "S1",
        logged_exercises: exs.map((e) => ({ exercise_code: e.exercise_code || e.code, weight_kg: benchKg, last_set_reps: stall ? 6 : 10, rep_min: 8, rep_max: 10, effort: stall ? "HARD" : "SUITABLE" })) } });
      if (lw.status >= 300) bad(`أ${n}: تسجيل التمرين فشل ${lw.status} ${JSON.stringify(lw.body).slice(0, 160)}`);
    }

    // Check-in on the package's cadence.
    const due = (n - lastCheckinWeek) * 7 >= cadence;
    if (!wk.off && !subEnded && due) {
      const c = await call(submitCheckin, { user: { id: user.id, role: "CLIENT" }, body: { user_id: user.id, week_number: n, weight_kg: Number(wk.w.toFixed(1)),
        waist_circumference_cm: 100 - n * 0.2, nutrition_adherence_percent: wk.adh, workouts_completed: 3, workouts_scheduled: 4,
        pain_reports: wk.pain ? [{ joint: J.code === "JRN_06" ? "shoulder" : "knee", score: wk.pain, severity: wk.pain, pain_level: wk.pain }] : [],
        biofeedback: { hunger_level: 3, energy_level: wk.pain ? 2 : 3, sleep_quality: 3, sleep_hours: 6, stress_level: J.code === "JRN_06" ? 4 : 2 } } });
      if (c.status >= 300) bad(`أ${n}: المتابعة رُفضت ${c.status} ${JSON.stringify(c.body).slice(0, 160)}`);
      const ck = c.body?.checkin;
      if (ck?.id) {
        const a = await call(approveCheckin, { params: { checkinId: ck.id }, body: { coach_notes: "ok" }, user: COACH });
        if (a.status !== 200) bad(`أ${n}: اعتماد المتابعة فشل ${a.status}`);
        events.push(`متابعة ${ck.analysis_status}${ck.analysis_output?.deload_recommendation?.recommended ? " +ديلود:" + ck.analysis_output.deload_recommendation.reason : ""}`);
      }
      lastCheckinWeek = n;
    }

    // Overdue engine must agree with reality.
    const cks = await CheckinSubmission.findAll({ where: { user_id: user.id }, attributes: ["createdAt"] });
    const od = evaluateClientCheckinOverdue({ subscription_status: user.subscription_status, subscription_package: J.pkg, subscription_start_date: user.subscription_start_date, checkinSubmissions: cks.map((x) => ({ createdAt: x.createdAt })) });
    if (wk.off && (n - lastCheckinWeek) * 7 >= cadence + 7 && !od.isOverdue && !subEnded) bad(`أ${n}: متدرب منقطع ${(n - lastCheckinWeek) * 7} يوم ومحرك التأخير قال مش متأخر`);
    if (!wk.off && !subEnded && od.isOverdue) bad(`أ${n}: محرك التأخير قال متأخر ${od.daysElapsed} يوم والمتدرب ملتزم بباقة ${J.pkg}`);

    // Cycle continuity: run-due's exact per-client logic.
    const latest = await Program.findOne({ where: { user_id: user.id }, order: [["id", "DESC"]] });
    if (latest.status === "ACTIVE" && resolveTrainingCycleStatus(latest).status === "ENDED") {
      const nc = await call(prepareNextCycle, { user: COACH, body: { client_code: J.code } });
      if (nc.status !== 201) bad(`أ${n}: تجهيز الدورة فشل ${nc.status} ${JSON.stringify(nc.body).slice(0, 160)}`);
      else {
        cycles = nc.body.summary.cycle_number;
        if (nc.body.published) { autoPublished++; events.push(`دورة ${cycles} نُشرت تلقائياً`); }
        else { pendingDraftSince = n; events.push(`دورة ${cycles} مسودة: ${nc.body.waiting_reasons_ar.join(" | ")}`); }
        if (nc.body.published && J.code === "JRN_04") bad(`أ${n}: عميلة المراجعة الطبية اتنشرلها دورة تلقائياً`);
        if (nc.body.published && subEnded) bad(`أ${n}: دورة نُشرت بعد انتهاء الاشتراك`);
      }
    } else if (latest.status === "DRAFT" && pendingDraftSince !== null && n - pendingDraftSince >= 1 && !subEnded) {
      // The coach reviews the waiting draft a week later and publishes it.
      const up = await call(updateCustomProgram, { user: COACH, body: { client_code: J.code, program_data: latest.program_data, publish: true, medical_review_confirmed: true } });
      if (up.status !== 200) bad(`أ${n}: نشر الكوتش للمسودة فشل ${up.status} ${JSON.stringify(up.body).slice(0, 160)}`);
      else events.push("الكوتش نشر المسودة");
      pendingDraftSince = null;
    }

    // Renewal alert two weeks ahead.
    const att = await call(getCyclesNeedingAttention, { user: COACH });
    const me = (att.body?.clients || []).find((c) => c.client_code === J.code);
    const daysLeft = Math.ceil((new Date(user.subscription_end_date).getTime() - Date.now()) / DAY);
    if (me?.renewal_due) renewalSeen = true;
    if (daysLeft > 0 && daysLeft <= 14 && !(me?.renewal_due)) bad(`أ${n}: الاشتراك فاضله ${daysLeft} يوم ومفيش تنبيه تجديد`);

    // What the client actually opens.
    const view = await call(getActiveProgramByUserId, { user: COACH, params: { user_id: J.code } });
    if (view.status !== 200) bad(`أ${n}: التطبيق مش لاقي خطة (${view.status})`);
    const activeNow = await Program.findOne({ where: { user_id: user.id, status: "ACTIVE" }, order: [["id", "DESC"]] });
    const t = targetsOf(activeNow?.program_data);
    const cycleNow = resolveTrainingCycleStatus(activeNow);
    if (!subEnded && cycleNow.days_remaining < -7) bad(`أ${n}: المتدرب على دورة منتهية من ${-cycleNow.days_remaining} يوم`);
    for (const [k, v] of Object.entries(t)) if (v === null || v <= 0) bad(`أ${n}: ${k} غير صالح (${v})`);
    if (t.kcal && t.kcal < floor - 1) bad(`أ${n}: السعرات ${t.kcal} تحت الحد ${floor}`);
    if (t.kcal && prevKcal && Math.abs(t.kcal - prevKcal) > 350) bad(`أ${n}: قفزة سعرات ${prevKcal} -> ${t.kcal}`);
    if (J.code === "JRN_04" && t.protein > 0.8 * 81 + 2) bad(`أ${n}: بروتين ${t.protein} فوق سقف الكلى`);
    if (J.code === "JRN_05" && t.kcal && t.kcal < 1700) bad(`أ${n}: مرضعة على ${t.kcal} سعرة`);
    const atw = t.protein * 4 + t.carbs * 4 + t.fat * 9;
    if (t.kcal && Math.abs(atw - t.kcal) / t.kcal > 0.12) bad(`أ${n}: الماكروز ${Math.round(atw)} لا تطابق السعرات ${t.kcal}`);
    const exNow = exerciseSet(activeNow?.program_data);
    const changed = [...exNow].filter((x) => !baseExercises.has(x));
    if (changed.length > 0 && J.code !== "JRN_06" && J.code !== "JRN_01") bad(`أ${n}: تمارين اتغيرت من غير ألم: ${changed.join(",")}`);
    prevKcal = t.kcal ?? prevKcal;
    log.push({ n, w: wk.w.toFixed(1), kcal: t.kcal, p: t.protein, c: t.carbs, f: t.fat, cycle: cycleNow.cycle_number, wk: `${cycleNow.current_week}/${cycleNow.total_weeks}`, ev: [wk.off ? "منقطع" : "", subEnded ? "اشتراك منتهي" : "", ...events].filter(Boolean).join("؛ ") });
  }
  if (!renewalSeen) bad("تنبيه التجديد لم يظهر أبداً");
  const expectedCycles = Math.floor((J.months * 30) / 35);
  if (cycles < expectedCycles) bad(`عدد الدورات ${cycles} أقل من المتوقع ${expectedCycles} لمدة ${J.months} شهور`);
  results.push({ J, log, issues, cycles, autoPublished, t0 });
}

for (const r of results) {
  console.log(`\n=== ${r.J.code} ${r.J.name} | باقة ${r.J.pkg} | دورات ${r.cycles} (تلقائي ${r.autoPublished}) | بداية ${r.t0?.kcal} سعرة`);
  for (const l of r.log.filter((x, i, a) => i === 0 || x.ev || i === a.length - 1 || x.kcal !== a[i - 1].kcal)) {
    console.log(`  أ${String(l.n).padStart(2)} وزن ${l.w} | ${l.kcal} سعرة P${l.p} C${l.c} F${l.f} | دورة ${l.cycle} (${l.wk}) ${l.ev ? "| " + l.ev : ""}`);
  }
  console.log(r.issues.length ? `  مشاكل (${r.issues.length}):\n    - ` + [...new Set(r.issues)].slice(0, 25).join("\n    - ") : "  مشاكل: لا شيء");
}
if (!process.argv.includes("--keep")) await cleanup();
await sequelize.close();
