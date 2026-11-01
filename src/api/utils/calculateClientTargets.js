/* S4-7 unified target calculation (pure, no database access).
 *
 * The coach macro calculator used to run a second formula in the browser and
 * save its numbers into the stored program. This helper is the only place
 * calculator numbers are now produced: it loads the client's stored intake
 * answers, evaluates them exactly like program generation does, overlays the
 * coach's fresh measurements, and runs the same function generation uses
 * (calculateUniversalNutritionTargets). Every clinical guard in that function
 * therefore applies: calorie floors, kidney protein cap from bloodwork,
 * diabetes carbohydrate ceiling, youth maintenance, lactation, goal
 * redirects, and the reference-weight rules.
 *
 * Fail-first contract, mirroring the old browser engine's no-silent-defaults
 * rule and the generation firewall:
 * - Weight and height are REQUIRED from the coach on every call. A missing
 *   measurement throws instead of silently reusing the stale intake weight.
 * - Age comes from the intake's date of birth when present (authoritative).
 *   When the intake has no date of birth, an explicit coach age is required:
 *   the adapter would otherwise silently fabricate 1998-01-01 (the engine's
 *   28-year-old default), and this path refuses instead.
 * - A MEDICAL_REVIEW_REQUIRED or BLOCKED evaluation is refused before any
 *   number is computed, on the OVERRIDDEN intake: the gate sees the same
 *   intake the engine builds from, as in generateProgram.
 * - The response carries headline targets only. The biomarker analysis and
 *   clinical shield are not copied here; persisting them into the stored
 *   program is the separate S3-3 remainder, untouched by this package.
 */
import { adaptIntakePayloadToCanonicalEngine } from "../../intake-decision-engine/adapters/intake-adapter.js";
import { evaluateIntake } from "z-coaching-intake-decision-engine";
import { calculateUniversalNutritionTargets } from "../../master-engine-v2/build-master-engine-v2.js";

function codedError(code, message, extra = {}) {
  const err = new Error(message);
  err.code = code;
  Object.assign(err, extra);
  return err;
}

function invalid(message) {
  return codedError("INVALID_MEASUREMENTS", message);
}

function requiredNumber(value, name, min, max, labelAr) {
  if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
    throw invalid(`${labelAr} مطلوب لحساب الأهداف ولم يتم توفيره.`);
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < min || num > max) {
    throw invalid(`قيمة ${labelAr} غير صالحة (${value}). يجب أن تكون بين ${min} و ${max}.`);
  }
  return num;
}

function optionalNumber(value, name, min, max, labelAr) {
  // S4-7 review fix: absence is only undefined/null/blank. A supplied 0 is a
  // real value and must be range-checked, not silently turned into "not
  // sent" (which reused the intake's stored value). The engine itself
  // applies its own physiological guards to a supplied 0 (body fat below
  // 3% is treated as unreliable, steps of 0 fall to its 6000 default), so
  // passing 0 through can never resurrect a stale intake value.
  if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < min || num > max) {
    throw invalid(`قيمة ${labelAr} غير صالحة (${value}). يجب أن تكون بين ${min} و ${max}.`);
  }
  return num;
}

export function buildClientTargets({ answers, measurements = {}, assessmentDate } = {}) {
  if (!answers || typeof answers !== "object") {
    throw invalid("بيانات الاستمارة مطلوبة لحساب الأهداف.");
  }
  const weight = requiredNumber(measurements.weight_kg, "weight_kg", 30, 300, "الوزن");
  const height = requiredNumber(measurements.height_cm, "height_cm", 120, 250, "الطول");
  const bodyFat = optionalNumber(measurements.body_fat_percent, "body_fat_percent", 0, 100, "نسبة الدهون");
  const steps = optionalNumber(measurements.average_daily_steps, "average_daily_steps", 0, 100000, "عدد الخطوات اليومية");
  const ageInput = optionalNumber(measurements.age, "age", 1, 110, "العمر");
  if (ageInput !== null && !Number.isInteger(ageInput)) {
    throw invalid(`قيمة العمر غير صالحة (${measurements.age}). يجب أن تكون عدداً صحيحاً من السنوات.`);
  }

  // The raw answers are copied once: the adapter builds the canonical intake
  // from this copy, and the engine reads body fat from it. The caller's
  // answers are never mutated.
  const rawForEngine = structuredClone(answers);

  // Age: the intake's date of birth is authoritative and the adapter prefers
  // it over any age. Only when the intake carries no date of birth (in any
  // shape the adapter reads) does the coach's age apply, via the raw age the
  // adapter itself turns into a date of birth. When neither exists, the
  // adapter would silently fabricate 1998-01-01, so this path refuses
  // instead (see the fail-first contract above). The check must run on the
  // RAW answers: the adapted intake always carries a date of birth, real or
  // fabricated, so checking the canonical intake could never catch it.
  // S4-7 review fix: a date of birth counts only when it is a non-blank
  // YYYY-MM-DD string, the only shape the adapter accepts before it
  // fabricates 1998-01-01. A whitespace-only string used to count as
  // present (Boolean("   ") is true) and slip past this guard straight
  // into the fabricated default. An age counts only when it parses to a
  // positive number, so blank or non-numeric ages cannot count either.
  const dobCandidates = [
    rawForEngine.personal?.dateOfBirth,
    rawForEngine.personal?.date_of_birth,
    rawForEngine.dateOfBirth,
    rawForEngine.date_of_birth,
  ];
  // No trimming: the adapter tests the raw string against the same pattern,
  // so a padded date would be fabricated by the adapter too and must not
  // count as present here either.
  const rawHasDob = dobCandidates.some(
    (candidate) => typeof candidate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(candidate)
  );
  const ageCandidates = [rawForEngine.personal?.age, rawForEngine.age];
  const rawHasAge = ageCandidates.some((candidate) => {
    if (candidate === undefined || candidate === null) return false;
    if (typeof candidate === "string" && candidate.trim() === "") return false;
    const parsed = Number(candidate);
    return Number.isFinite(parsed) && parsed > 0;
  });
  if (!rawHasDob && ageInput === null && !rawHasAge) {
    throw invalid("العمر مطلوب لحساب الأهداف لأن استمارة المتدرب لا تحمل تاريخ ميلاد.");
  }
  if (!rawHasDob && ageInput !== null) {
    if (rawForEngine.personal && typeof rawForEngine.personal === "object") {
      rawForEngine.personal.age = ageInput;
    } else {
      rawForEngine.age = ageInput;
    }
  }
  if (bodyFat !== null) {
    if (!rawForEngine.body || typeof rawForEngine.body !== "object") rawForEngine.body = {};
    rawForEngine.body.bodyFat = bodyFat;
  }

  const canonicalIntake = adaptIntakePayloadToCanonicalEngine(rawForEngine);
  if (!canonicalIntake.body || typeof canonicalIntake.body !== "object") canonicalIntake.body = {};
  if (!canonicalIntake.cardio || typeof canonicalIntake.cardio !== "object") canonicalIntake.cardio = {};

  // Fresh measurements win over the stored intake; the clinical context
  // (conditions, bloodwork, goal, diet framework) always stays the intake's.
  // Only the canonical contract's own camelCase keys are written: the
  // evaluation rejects unknown fields, so snake_case duplicates (and a
  // bodyFat key the contract does not carry) would fail validation. Body fat
  // travels through the raw answers instead, which is where the engine reads
  // it from.
  canonicalIntake.body.weightKg = weight;
  canonicalIntake.body.heightCm = height;
  if (steps !== null) {
    canonicalIntake.cardio.averageDailySteps = steps;
  }

  const evaluationContext = Object.freeze({
    system_time: new Date().toISOString(),
    assessmentDate: assessmentDate || new Date().toISOString().split("T")[0],
  });
  const decision = evaluateIntake(canonicalIntake, evaluationContext);
  if (decision.plan_status === "MEDICAL_REVIEW_REQUIRED") {
    throw codedError(
      "MEDICAL_REVIEW_REQUIRED",
      "هذا المتدرب يحتاج مراجعة طبية قبل حساب أهداف جديدة. راجع الحالة مع الطبيب المعالج.",
      { reasons: decision.decision_reasons || [] }
    );
  }
  if (decision.plan_status === "BLOCKED") {
    throw codedError(
      "BLOCKED",
      "لا يمكن حساب أهداف لهذا المتدرب: الاستمارة مرفوضة ويجب استكمالها أولاً.",
      { reasons: decision.decision_reasons || [] }
    );
  }

  const computed = calculateUniversalNutritionTargets(canonicalIntake, evaluationContext, rawForEngine);
  const guardrails = computed.clinical_guardrails || {};
  const targets = {
    target_source: "UNIVERSAL_TARGETS",
    bmr: computed.bmr,
    bmr_formula: computed.bmr_formula,
    body_fat_percentage: computed.body_fat_percentage,
    activity_factor: computed.activity_factor,
    tdee: computed.tdee,
    target_calories: computed.target_calories,
    target_calories_kcal: computed.target_calories_kcal,
    calories_kcal: computed.calories_kcal,
    calorie_adjustment_desc: computed.calorie_adjustment_desc,
    effective_goal: computed.effective_goal,
    goal_redirect: computed.goal_redirect || null,
    protein_g: computed.protein_g,
    total_protein_g: computed.total_protein_g,
    protein_per_kg: computed.protein_per_kg,
    protein_reference_weight_kg: computed.protein_reference_weight_kg,
    protein_reference_basis: computed.protein_reference_basis,
    calorie_floor_applied: computed.calorie_floor_applied,
    carbohydrate_g: computed.carbohydrate_g,
    carb_g: computed.carb_g,
    total_carbs_g: computed.total_carbs_g,
    fat_g: computed.fat_g,
    total_fat_g: computed.total_fat_g,
    fiber_g: computed.fiber_g,
    water_liters: computed.water_liters,
    diet_framework: computed.diet_framework,
    methodology_policy: computed.methodology_policy,
    clinical_guardrails: guardrails,
  };
  const notes_ar = [
    computed.calorie_adjustment_desc,
    computed.goal_redirect?.reason_ar,
    guardrails.rationale_ar,
    guardrails.young_trainee_note_ar,
    guardrails.heart_diet_note_ar,
    guardrails.energy_balance_note_ar,
    computed.meal_count_note_ar,
  ].filter(Boolean);
  const effectiveSteps = Number(canonicalIntake.cardio.averageDailySteps) || 6000;
  return {
    targets,
    notes_ar,
    plan_status: decision.plan_status,
    decision_reasons: decision.decision_reasons || [],
    hard_constraints: decision.hard_constraints || [],
    inputs_used: {
      weight_kg: weight,
      height_cm: height,
      age_input: ageInput,
      age_from_intake: rawHasDob,
      body_fat_percent: bodyFat,
      average_daily_steps: effectiveSteps,
      sex: canonicalIntake.personal.sex ?? null,
    },
  };
}
