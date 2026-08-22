import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  evaluateIntake,
  ActivityLevel,
  CalorieDirection,
  Confidence,
  PlanStatus,
  Sex,
  SleepQuality,
  StressLevel,
  VolumeStart,
} from "../src/intake-decision-engine/index.js";
import {
  buildNutritionPlanningSnapshot,
  NUTRITION_PLANNING_SNAPSHOT_VERSION,
} from "z-coaching-intake-decision-engine/nutrition-planning-snapshot";
import * as nutritionEnergyTargetApi from "z-coaching-intake-decision-engine/nutrition-energy-target";

const {
  buildNutritionEnergyTarget,
  NUTRITION_ENERGY_TARGET_VERSION,
  NutritionEnergyCalculationMethod,
  NutritionEnergyTargetStatus,
  NutritionPalCategory,
} = nutritionEnergyTargetApi;

const FULL_INTAKE_URL = new URL(
  "../examples/full-intake.json",
  import.meta.url,
);
const EVALUATION_CONTEXT_URL = new URL(
  "../examples/evaluation-context.json",
  import.meta.url,
);

function readJson(url) {
  return JSON.parse(readFileSync(url, "utf8"));
}

function makeSnapshot({
  client = {},
  goal = {},
  body = {},
  activity = {},
  recovery = {},
  decisionContext = {},
} = {}) {
  return {
    snapshot_version: NUTRITION_PLANNING_SNAPSHOT_VERSION,
    client: {
      age_years: 32,
      sex: Sex.FEMALE,
      ...client,
    },
    goal: {
      calorie_direction: CalorieDirection.MAINTENANCE,
      decision_confidence: Confidence.HIGH,
      ...goal,
    },
    body: {
      height_cm: 165,
      weight_kg: 72,
      ...body,
    },
    activity: {
      daily_activity: ActivityLevel.SEDENTARY,
      average_daily_steps: null,
      additional_sports: [],
      recommended_resistance_days: 0,
      intro_week_required: false,
      training_volume_start: VolumeStart.NORMAL,
      ...activity,
    },
    recovery: {
      sleep_average_hours: 8,
      sleep_quality: SleepQuality.GOOD,
      stress_level: StressLevel.LOW,
      ...recovery,
    },
    decision_context: {
      plan_status: PlanStatus.READY_FOR_DRAFT,
      nutrition_constraints: [],
      ...decisionContext,
    },
  };
}

function reasonCodes(target) {
  return target.reasons.map((reason) => reason.code);
}

function assertAllCalorieValuesNull(target) {
  assert.equal(target.estimated_maintenance_kcal, null);
  assert.equal(target.adjustment_percent, null);
  assert.equal(target.adjustment_kcal, null);
  assert.equal(target.target_calories, null);
  assert.equal(target.calibration_required, false);
}

function assertDeepFrozen(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return;
  }
  seen.add(value);
  assert.equal(Object.isFrozen(value), true);
  for (const key of Reflect.ownKeys(value)) {
    assertDeepFrozen(value[key], seen);
  }
}

function collectObjectKeys(value, keys = new Set(), seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return keys;
  }
  seen.add(value);
  for (const key of Object.keys(value)) {
    keys.add(key);
    collectObjectKeys(value[key], keys, seen);
  }
  return keys;
}

test("Public API exposes only the version, three frozen enums, and builder", () => {
  assert.equal(
    NUTRITION_ENERGY_TARGET_VERSION,
    "nutrition-energy-target-v1",
  );
  assert.deepEqual(NutritionEnergyTargetStatus, {
    READY: "READY",
    PROVISIONAL_REVIEW_REQUIRED: "PROVISIONAL_REVIEW_REQUIRED",
    WITHHELD: "WITHHELD",
  });
  assert.deepEqual(NutritionPalCategory, {
    INACTIVE: "INACTIVE",
    LOW_ACTIVE: "LOW_ACTIVE",
    ACTIVE: "ACTIVE",
    VERY_ACTIVE: "VERY_ACTIVE",
  });
  assert.deepEqual(NutritionEnergyCalculationMethod, {
    NASEM_DRI_2023_EER_ADULT: "NASEM_DRI_2023_EER_ADULT",
  });
  assert.equal(Object.isFrozen(NutritionEnergyTargetStatus), true);
  assert.equal(Object.isFrozen(NutritionPalCategory), true);
  assert.equal(Object.isFrozen(NutritionEnergyCalculationMethod), true);
  assert.equal(typeof buildNutritionEnergyTarget, "function");
  assert.deepEqual(Object.keys(nutritionEnergyTargetApi).sort(), [
    "NUTRITION_ENERGY_TARGET_VERSION",
    "NutritionEnergyCalculationMethod",
    "NutritionEnergyTargetStatus",
    "NutritionPalCategory",
    "buildNutritionEnergyTarget",
  ]);
});

test("actual intake flows end to end into the expected energy target", () => {
  const intake = readJson(FULL_INTAKE_URL);
  const evaluationContext = readJson(EVALUATION_CONTEXT_URL);
  const intakeDecision = evaluateIntake(intake, evaluationContext);
  const snapshot = buildNutritionPlanningSnapshot({
    intake,
    evaluationContext,
    intakeDecision,
  });
  const target = buildNutritionEnergyTarget(snapshot);

  assert.deepEqual(Object.keys(target), [
    "energy_target_version",
    "source_snapshot_version",
    "status",
    "calculation_method",
    "activity_assessment",
    "estimated_maintenance_kcal",
    "calorie_direction",
    "adjustment_percent",
    "adjustment_kcal",
    "target_calories",
    "calibration_required",
    "constraints",
    "reasons",
  ]);
  assert.equal(target.energy_target_version, NUTRITION_ENERGY_TARGET_VERSION);
  assert.equal(
    target.source_snapshot_version,
    NUTRITION_PLANNING_SNAPSHOT_VERSION,
  );
  assert.equal(
    target.calculation_method,
    NutritionEnergyCalculationMethod.NASEM_DRI_2023_EER_ADULT,
  );
  assert.equal(target.status, NutritionEnergyTargetStatus.READY);
  assert.deepEqual(target.activity_assessment, {
    pal_category: NutritionPalCategory.LOW_ACTIVE,
    lifestyle_category: NutritionPalCategory.LOW_ACTIVE,
    steps_category: NutritionPalCategory.INACTIVE,
    resistance_category: NutritionPalCategory.LOW_ACTIVE,
    sport_category: null,
    weighted_sport_minutes: 0,
  });
  assert.equal(target.estimated_maintenance_kcal, 2310);
  assert.equal(target.calorie_direction, CalorieDirection.MAINTENANCE);
  assert.equal(target.adjustment_percent, 0);
  assert.equal(target.adjustment_kcal, 0);
  assert.equal(target.target_calories, 2310);
  assert.equal(target.calibration_required, true);
  assert.deepEqual(
    target.constraints,
    snapshot.decision_context.nutrition_constraints,
  );
  assert.deepEqual(reasonCodes(target), [
    "NASEM_DRI_2023_EER_APPLIED",
    "MAINTENANCE_DIRECTION_APPLIED",
    "CALIBRATION_REQUIRED",
  ]);
  assert.equal(
    target.reasons.every(
      (reason) =>
        typeof reason.message === "string" && reason.message.length > 0,
    ),
    true,
  );
});

test("all four male NASEM adult EER equations are applied exactly", () => {
  const cases = [
    [ActivityLevel.SEDENTARY, NutritionPalCategory.INACTIVE, 2490],
    [ActivityLevel.LIGHT, NutritionPalCategory.LOW_ACTIVE, 2680],
    [ActivityLevel.MODERATE, NutritionPalCategory.ACTIVE, 2880],
    [ActivityLevel.HIGH, NutritionPalCategory.VERY_ACTIVE, 3090],
  ];

  for (const [dailyActivity, palCategory, expected] of cases) {
    const target = buildNutritionEnergyTarget(
      makeSnapshot({
        client: { sex: Sex.MALE },
        activity: { daily_activity: dailyActivity },
      }),
    );
    assert.equal(target.activity_assessment.pal_category, palCategory);
    assert.equal(target.estimated_maintenance_kcal, expected);
  }
});

test("all four female NASEM adult EER equations are applied exactly", () => {
  const cases = [
    [ActivityLevel.SEDENTARY, NutritionPalCategory.INACTIVE, 2150],
    [ActivityLevel.LIGHT, NutritionPalCategory.LOW_ACTIVE, 2310],
    [ActivityLevel.MODERATE, NutritionPalCategory.ACTIVE, 2450],
    [ActivityLevel.HIGH, NutritionPalCategory.VERY_ACTIVE, 2690],
  ];

  for (const [dailyActivity, palCategory, expected] of cases) {
    const target = buildNutritionEnergyTarget(
      makeSnapshot({ activity: { daily_activity: dailyActivity } }),
    );
    assert.equal(target.activity_assessment.pal_category, palCategory);
    assert.equal(target.estimated_maintenance_kcal, expected);
  }
});

test("lifestyle activity maps to the frozen PAL categories", () => {
  const cases = [
    [ActivityLevel.SEDENTARY, NutritionPalCategory.INACTIVE],
    [ActivityLevel.LIGHT, NutritionPalCategory.LOW_ACTIVE],
    [ActivityLevel.MODERATE, NutritionPalCategory.ACTIVE],
    [ActivityLevel.HIGH, NutritionPalCategory.VERY_ACTIVE],
    [ActivityLevel.VERY_HIGH, NutritionPalCategory.VERY_ACTIVE],
    [ActivityLevel.UNKNOWN, null],
  ];

  for (const [dailyActivity, expected] of cases) {
    const target = buildNutritionEnergyTarget(
      makeSnapshot({ activity: { daily_activity: dailyActivity } }),
    );
    assert.equal(target.activity_assessment.lifestyle_category, expected);
  }
});

test("step boundaries map at 4999, 5000, 7499, 7500, 11999, and 12000", () => {
  const cases = [
    [4999, NutritionPalCategory.INACTIVE],
    [5000, NutritionPalCategory.LOW_ACTIVE],
    [7499, NutritionPalCategory.LOW_ACTIVE],
    [7500, NutritionPalCategory.ACTIVE],
    [11999, NutritionPalCategory.ACTIVE],
    [12000, NutritionPalCategory.VERY_ACTIVE],
  ];

  for (const [steps, expected] of cases) {
    const target = buildNutritionEnergyTarget(
      makeSnapshot({
        activity: {
          daily_activity: ActivityLevel.UNKNOWN,
          average_daily_steps: steps,
        },
      }),
    );
    assert.equal(target.activity_assessment.steps_category, expected);
  }
});

test("resistance days map correctly and conservative training caps the signal", () => {
  const cases = [
    [0, null],
    [1, NutritionPalCategory.INACTIVE],
    [2, NutritionPalCategory.LOW_ACTIVE],
    [3, NutritionPalCategory.LOW_ACTIVE],
    [4, NutritionPalCategory.ACTIVE],
    [5, NutritionPalCategory.ACTIVE],
    [6, NutritionPalCategory.VERY_ACTIVE],
  ];

  for (const [days, expected] of cases) {
    const target = buildNutritionEnergyTarget(
      makeSnapshot({
        activity: {
          daily_activity: ActivityLevel.UNKNOWN,
          recommended_resistance_days: days,
        },
      }),
    );
    assert.equal(target.activity_assessment.resistance_category, expected);
  }

  for (const activity of [
    { recommended_resistance_days: 6, intro_week_required: true },
    {
      recommended_resistance_days: 6,
      training_volume_start: VolumeStart.CONSERVATIVE,
    },
  ]) {
    const target = buildNutritionEnergyTarget(
      makeSnapshot({
        activity: { daily_activity: ActivityLevel.UNKNOWN, ...activity },
      }),
    );
    assert.equal(
      target.activity_assessment.resistance_category,
      NutritionPalCategory.LOW_ACTIVE,
    );
  }
});

test("weighted sport minutes include low, moderate, and high intensity weights", () => {
  const target = buildNutritionEnergyTarget(
    makeSnapshot({
      activity: {
        daily_activity: ActivityLevel.UNKNOWN,
        additional_sports: [
          {
            days: ["MONDAY", "THURSDAY"],
            minutesPerSession: 40,
            intensity: "LOW",
          },
          {
            days: ["TUESDAY"],
            minutesPerSession: 40,
            intensity: "MODERATE",
          },
          {
            days: ["SATURDAY"],
            minutesPerSession: 40,
            intensity: "HIGH",
          },
        ],
      },
    }),
  );

  assert.equal(target.activity_assessment.weighted_sport_minutes, 140);
  assert.equal(
    target.activity_assessment.sport_category,
    NutritionPalCategory.ACTIVE,
  );

  const categoryCases = [
    [[], null],
    [
      [{ days: ["MONDAY"], minutesPerSession: 30, intensity: "LOW" }],
      NutritionPalCategory.LOW_ACTIVE,
    ],
    [
      [
        {
          days: ["MONDAY", "THURSDAY"],
          minutesPerSession: 45,
          intensity: "MODERATE",
        },
      ],
      NutritionPalCategory.ACTIVE,
    ],
    [
      [
        {
          days: ["MONDAY"],
          minutesPerSession: 180,
          intensity: "MODERATE",
        },
      ],
      NutritionPalCategory.VERY_ACTIVE,
    ],
  ];
  for (const [additionalSports, expected] of categoryCases) {
    const categoryTarget = buildNutritionEnergyTarget(
      makeSnapshot({
        activity: {
          daily_activity: ActivityLevel.UNKNOWN,
          additional_sports: additionalSports,
        },
      }),
    );
    assert.equal(categoryTarget.activity_assessment.sport_category, expected);
  }
});

test("PAL takes the highest activity signal without adding signal ranks", () => {
  const target = buildNutritionEnergyTarget(
    makeSnapshot({
      activity: {
        daily_activity: ActivityLevel.LIGHT,
        average_daily_steps: 6000,
        recommended_resistance_days: 3,
        additional_sports: [
          {
            days: ["MONDAY"],
            minutesPerSession: 30,
            intensity: "LOW",
          },
        ],
      },
    }),
  );

  assert.deepEqual(target.activity_assessment, {
    pal_category: NutritionPalCategory.LOW_ACTIVE,
    lifestyle_category: NutritionPalCategory.LOW_ACTIVE,
    steps_category: NutritionPalCategory.LOW_ACTIVE,
    resistance_category: NutritionPalCategory.LOW_ACTIVE,
    sport_category: NutritionPalCategory.LOW_ACTIVE,
    weighted_sport_minutes: 15,
  });

  const highestSignal = buildNutritionEnergyTarget(
    makeSnapshot({
      activity: {
        daily_activity: ActivityLevel.LIGHT,
        average_daily_steps: 12000,
        recommended_resistance_days: 2,
      },
    }),
  );
  assert.equal(
    highestSignal.activity_assessment.pal_category,
    NutritionPalCategory.VERY_ACTIVE,
  );
});

test("insufficient activity data returns a provisional target with null calories", () => {
  const target = buildNutritionEnergyTarget(
    makeSnapshot({
      activity: {
        daily_activity: ActivityLevel.UNKNOWN,
        average_daily_steps: null,
        recommended_resistance_days: 0,
      },
    }),
  );

  assert.equal(
    target.status,
    NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.equal(target.activity_assessment.pal_category, null);
  assertAllCalorieValuesNull(target);
  assert.deepEqual(reasonCodes(target), ["ACTIVITY_DATA_INSUFFICIENT"]);
});

test("maintenance keeps the estimate unchanged and requires calibration", () => {
  const target = buildNutritionEnergyTarget(makeSnapshot());

  assert.equal(target.estimated_maintenance_kcal, 2150);
  assert.equal(target.adjustment_percent, 0);
  assert.equal(target.adjustment_kcal, 0);
  assert.equal(target.target_calories, 2150);
  assert.equal(target.calibration_required, true);
  assert.ok(reasonCodes(target).includes("MAINTENANCE_DIRECTION_APPLIED"));
});

test("standard deficit applies 15 percent and rounds the adjustment", () => {
  const target = buildNutritionEnergyTarget(
    makeSnapshot({ goal: { calorie_direction: CalorieDirection.DEFICIT } }),
  );

  assert.equal(target.adjustment_percent, 15);
  assert.equal(target.adjustment_kcal, -320);
  assert.equal(target.target_calories, 1830);

  const noArtificialFloor = buildNutritionEnergyTarget(
    makeSnapshot({
      goal: { calorie_direction: CalorieDirection.DEFICIT },
      body: { height_cm: 100, weight_kg: 30 },
    }),
  );
  assert.equal(noArtificialFloor.estimated_maintenance_kcal, 1280);
  assert.equal(noArtificialFloor.adjustment_kcal, -190);
  assert.equal(noArtificialFloor.target_calories, 1090);
});

test("every direct conservative trigger applies a 10 percent deficit", () => {
  const cases = [
    { activity: { intro_week_required: true } },
    { activity: { training_volume_start: VolumeStart.CONSERVATIVE } },
    { recovery: { sleep_average_hours: 5.9 } },
    { recovery: { sleep_quality: SleepQuality.POOR } },
    { recovery: { sleep_quality: SleepQuality.UNKNOWN } },
    { recovery: { stress_level: StressLevel.HIGH } },
    { recovery: { stress_level: StressLevel.UNKNOWN } },
  ];

  for (const conservativeTrigger of cases) {
    const target = buildNutritionEnergyTarget(
      makeSnapshot({
        goal: { calorie_direction: CalorieDirection.DEFICIT },
        ...conservativeTrigger,
      }),
    );
    assert.equal(target.status, NutritionEnergyTargetStatus.READY);
    assert.equal(target.adjustment_percent, 10);
    assert.equal(target.adjustment_kcal, -220);
    assert.equal(target.target_calories, 1930);
  }

  const sixHours = buildNutritionEnergyTarget(
    makeSnapshot({
      goal: { calorie_direction: CalorieDirection.DEFICIT },
      recovery: { sleep_average_hours: 6 },
    }),
  );
  assert.equal(sixHours.adjustment_percent, 15);
});

test("deficit adjustment is capped at 500 kcal per day", () => {
  const target = buildNutritionEnergyTarget(
    makeSnapshot({
      client: { sex: Sex.MALE },
      goal: { calorie_direction: CalorieDirection.DEFICIT },
      body: { height_cm: 200, weight_kg: 200 },
      activity: { daily_activity: ActivityLevel.HIGH },
    }),
  );

  assert.ok(target.estimated_maintenance_kcal > 5000);
  assert.equal(target.adjustment_percent, 15);
  assert.equal(target.adjustment_kcal, -500);
  assert.equal(
    target.target_calories,
    target.estimated_maintenance_kcal + target.adjustment_kcal,
  );
});

test("standard surplus applies 8 percent and rounds the adjustment", () => {
  const target = buildNutritionEnergyTarget(
    makeSnapshot({ goal: { calorie_direction: CalorieDirection.SURPLUS } }),
  );

  assert.equal(target.adjustment_percent, 8);
  assert.equal(target.adjustment_kcal, 170);
  assert.equal(target.target_calories, 2320);
});

test("a conservative trigger applies a 5 percent surplus", () => {
  const target = buildNutritionEnergyTarget(
    makeSnapshot({
      goal: { calorie_direction: CalorieDirection.SURPLUS },
      recovery: { sleep_average_hours: 5.5 },
    }),
  );

  assert.equal(target.status, NutritionEnergyTargetStatus.READY);
  assert.equal(target.adjustment_percent, 5);
  assert.equal(target.adjustment_kcal, 110);
  assert.equal(target.target_calories, 2260);
});

test("surplus adjustment is capped at 300 kcal per day", () => {
  const target = buildNutritionEnergyTarget(
    makeSnapshot({
      client: { sex: Sex.MALE },
      goal: { calorie_direction: CalorieDirection.SURPLUS },
      body: { height_cm: 200, weight_kg: 200 },
      activity: { daily_activity: ActivityLevel.HIGH },
    }),
  );

  assert.ok(target.estimated_maintenance_kcal > 5000);
  assert.equal(target.adjustment_percent, 8);
  assert.equal(target.adjustment_kcal, 300);
  assert.equal(
    target.target_calories,
    target.estimated_maintenance_kcal + target.adjustment_kcal,
  );
});

test("upstream coach review keeps calculated calories with conservative adjustment", () => {
  const target = buildNutritionEnergyTarget(
    makeSnapshot({
      goal: { calorie_direction: CalorieDirection.DEFICIT },
      decisionContext: { plan_status: PlanStatus.COACH_REVIEW_REQUIRED },
    }),
  );

  assert.equal(
    target.status,
    NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.equal(target.estimated_maintenance_kcal, 2150);
  assert.equal(target.adjustment_percent, 10);
  assert.equal(target.target_calories, 1930);
  assert.ok(reasonCodes(target).includes("UPSTREAM_COACH_REVIEW_REQUIRED"));
});

test("medical review withholds the complete energy calculation", () => {
  const target = buildNutritionEnergyTarget(
    makeSnapshot({
      decisionContext: { plan_status: PlanStatus.MEDICAL_REVIEW_REQUIRED },
    }),
  );

  assert.equal(target.status, NutritionEnergyTargetStatus.WITHHELD);
  assert.equal(
    target.calculation_method,
    NutritionEnergyCalculationMethod.NASEM_DRI_2023_EER_ADULT,
  );
  assert.deepEqual(target.activity_assessment, {
    pal_category: null,
    lifestyle_category: null,
    steps_category: null,
    resistance_category: null,
    sport_category: null,
    weighted_sport_minutes: 0,
  });
  assertAllCalorieValuesNull(target);
  assert.deepEqual(reasonCodes(target), [
    "ENERGY_TARGET_WITHHELD_BY_INTAKE_STATUS",
  ]);
});

test("blocked intake status withholds the energy target", () => {
  const target = buildNutritionEnergyTarget(
    makeSnapshot({
      decisionContext: { plan_status: PlanStatus.BLOCKED },
    }),
  );

  assert.equal(target.status, NutritionEnergyTargetStatus.WITHHELD);
  assertAllCalorieValuesNull(target);
  assert.deepEqual(reasonCodes(target), [
    "ENERGY_TARGET_WITHHELD_BY_INTAKE_STATUS",
  ]);
});

test("review-required calorie direction retains maintenance but no target", () => {
  const target = buildNutritionEnergyTarget(
    makeSnapshot({
      goal: { calorie_direction: CalorieDirection.REVIEW_REQUIRED },
    }),
  );

  assert.equal(
    target.status,
    NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.equal(target.estimated_maintenance_kcal, 2150);
  assert.equal(target.adjustment_percent, null);
  assert.equal(target.adjustment_kcal, null);
  assert.equal(target.target_calories, null);
  assert.equal(target.calibration_required, false);
  assert.ok(reasonCodes(target).includes("CALORIE_DIRECTION_REQUIRES_REVIEW"));
  assert.equal(reasonCodes(target).includes("CALIBRATION_REQUIRED"), false);
});

test("non-high nutrition confidence is provisional and uses conservative adjustment", () => {
  const target = buildNutritionEnergyTarget(
    makeSnapshot({
      goal: {
        calorie_direction: CalorieDirection.DEFICIT,
        decision_confidence: Confidence.MEDIUM,
      },
    }),
  );

  assert.equal(
    target.status,
    NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.equal(target.adjustment_percent, 10);
  assert.notEqual(target.target_calories, null);
  assert.ok(
    reasonCodes(target).includes("LOW_NUTRITION_DECISION_CONFIDENCE"),
  );

  const combinedReviewSignals = buildNutritionEnergyTarget(
    makeSnapshot({
      goal: {
        calorie_direction: CalorieDirection.DEFICIT,
        decision_confidence: Confidence.LOW,
      },
      activity: {
        daily_activity: ActivityLevel.UNKNOWN,
        average_daily_steps: 7500,
      },
      decisionContext: { plan_status: PlanStatus.COACH_REVIEW_REQUIRED },
    }),
  );
  const combinedCodes = reasonCodes(combinedReviewSignals);
  assert.equal(new Set(combinedCodes).size, combinedCodes.length);
});

test("clients younger than 19 do not receive the adult EER calculation", () => {
  const target = buildNutritionEnergyTarget(
    makeSnapshot({ client: { age_years: 18 } }),
  );

  assert.equal(
    target.status,
    NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assertAllCalorieValuesNull(target);
  assert.deepEqual(reasonCodes(target), ["ADULT_EER_REQUIRES_AGE_19_PLUS"]);

  const exactlyNineteen = buildNutritionEnergyTarget(
    makeSnapshot({ client: { age_years: 19 } }),
  );
  assert.equal(exactlyNineteen.status, NutritionEnergyTargetStatus.READY);
  assert.notEqual(exactlyNineteen.estimated_maintenance_kcal, null);

  const twoEquationGuards = buildNutritionEnergyTarget(
    makeSnapshot({ client: { age_years: 18, sex: Sex.OTHER } }),
  );
  assert.equal(
    twoEquationGuards.activity_assessment.pal_category,
    NutritionPalCategory.INACTIVE,
  );
  assertAllCalorieValuesNull(twoEquationGuards);
  assert.deepEqual(reasonCodes(twoEquationGuards), [
    "ADULT_EER_REQUIRES_AGE_19_PLUS",
    "SEX_SPECIFIC_EER_REQUIRES_REVIEW",
  ]);
});

test("non-binary equation inputs require review without using an averaged equation", () => {
  for (const sex of [Sex.OTHER, Sex.PREFER_NOT_TO_SAY]) {
    const target = buildNutritionEnergyTarget(
      makeSnapshot({ client: { sex } }),
    );
    assert.equal(
      target.status,
      NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED,
    );
    assertAllCalorieValuesNull(target);
    assert.deepEqual(reasonCodes(target), [
      "SEX_SPECIFIC_EER_REQUIRES_REVIEW",
    ]);
  }
});

test("unknown lifestyle with sufficient steps calculates a provisional target", () => {
  const target = buildNutritionEnergyTarget(
    makeSnapshot({
      goal: { calorie_direction: CalorieDirection.DEFICIT },
      activity: {
        daily_activity: ActivityLevel.UNKNOWN,
        average_daily_steps: 7500,
      },
    }),
  );

  assert.equal(target.activity_assessment.pal_category, NutritionPalCategory.ACTIVE);
  assert.equal(
    target.status,
    NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.equal(target.adjustment_percent, 10);
  assert.notEqual(target.target_calories, null);
  assert.ok(
    reasonCodes(target).includes(
      "UNKNOWN_LIFESTYLE_ACTIVITY_REQUIRES_REVIEW",
    ),
  );
});

test("building an energy target never mutates the input snapshot", () => {
  const snapshot = makeSnapshot({
    decisionContext: {
      nutrition_constraints: [
        { code: "EXAMPLE", value: { nested: ["kept"] } },
      ],
    },
  });
  const before = structuredClone(snapshot);

  buildNutritionEnergyTarget(snapshot);

  assert.deepEqual(snapshot, before);
});

test("output and constraints are independent deep-frozen values", () => {
  const snapshot = makeSnapshot({
    decisionContext: {
      nutrition_constraints: [
        { code: "EXAMPLE", value: { nested: ["kept"] } },
      ],
    },
  });
  const target = buildNutritionEnergyTarget(snapshot);

  assert.notStrictEqual(
    target.constraints,
    snapshot.decision_context.nutrition_constraints,
  );
  assert.notStrictEqual(
    target.constraints[0],
    snapshot.decision_context.nutrition_constraints[0],
  );
  assert.notStrictEqual(
    target.constraints[0].value,
    snapshot.decision_context.nutrition_constraints[0].value,
  );
  assert.notStrictEqual(
    target.constraints[0].value.nested,
    snapshot.decision_context.nutrition_constraints[0].value.nested,
  );
  assert.deepEqual(
    target.constraints,
    snapshot.decision_context.nutrition_constraints,
  );
  assert.equal(Object.isFrozen(snapshot), false);
  assert.equal(
    Object.isFrozen(snapshot.decision_context.nutrition_constraints[0]),
    false,
  );
  snapshot.decision_context.nutrition_constraints[0].value.nested.push(
    "source-only",
  );
  assert.deepEqual(target.constraints[0].value.nested, ["kept"]);
  assertDeepFrozen(target);
  assert.throws(() => {
    target.constraints[0].value.nested.push("changed");
  }, TypeError);
});

test("energy target contains no macros, meals, foods, protein, or BMR fields", () => {
  const keys = collectObjectKeys(buildNutritionEnergyTarget(makeSnapshot()));

  for (const forbidden of [
    "protein",
    "carbs",
    "fat",
    "macros",
    "meals",
    "foods",
    "bmr",
  ]) {
    assert.equal(keys.has(forbidden), false);
  }
});

test("invalid snapshots and sport records throw TypeError", () => {
  const mutate = (mutation) => {
    const snapshot = makeSnapshot();
    mutation(snapshot);
    return snapshot;
  };
  const validSport = {
    days: ["MONDAY"],
    minutesPerSession: 30,
    intensity: "MODERATE",
  };
  const invalidSnapshots = [
    null,
    [],
    mutate((value) => {
      value.snapshot_version = "wrong";
    }),
    mutate((value) => {
      value.client = null;
    }),
    mutate((value) => {
      value.client.age_years = -1;
    }),
    mutate((value) => {
      value.client.age_years = 19.5;
    }),
    mutate((value) => {
      value.client.sex = "UNKNOWN_SEX";
    }),
    mutate((value) => {
      value.goal = null;
    }),
    mutate((value) => {
      value.goal.calorie_direction = "CUT";
    }),
    mutate((value) => {
      value.goal.decision_confidence = "CERTAIN";
    }),
    mutate((value) => {
      value.body = [];
    }),
    mutate((value) => {
      value.body.height_cm = 0;
    }),
    mutate((value) => {
      value.body.weight_kg = Number.POSITIVE_INFINITY;
    }),
    mutate((value) => {
      value.activity = null;
    }),
    mutate((value) => {
      value.activity.daily_activity = "UNKNOWN_ACTIVITY";
    }),
    mutate((value) => {
      value.activity.average_daily_steps = -1;
    }),
    mutate((value) => {
      value.activity.average_daily_steps = 5000.5;
    }),
    mutate((value) => {
      value.activity.additional_sports = null;
    }),
    mutate((value) => {
      value.activity.recommended_resistance_days = 7;
    }),
    mutate((value) => {
      value.activity.intro_week_required = "false";
    }),
    mutate((value) => {
      value.activity.training_volume_start = "LOW";
    }),
    mutate((value) => {
      value.recovery = null;
    }),
    mutate((value) => {
      value.recovery.sleep_average_hours = 24.1;
    }),
    mutate((value) => {
      value.recovery.sleep_quality = "EXCELLENT";
    }),
    mutate((value) => {
      value.recovery.stress_level = "EXTREME";
    }),
    mutate((value) => {
      value.decision_context = null;
    }),
    mutate((value) => {
      value.decision_context.plan_status = "APPROVED";
    }),
    mutate((value) => {
      value.decision_context.nutrition_constraints = null;
    }),
    mutate((value) => {
      value.activity.additional_sports = [null];
    }),
    mutate((value) => {
      value.activity.additional_sports = [{ ...validSport, days: null }];
    }),
    mutate((value) => {
      value.activity.additional_sports = [
        { ...validSport, days: ["FUNDAY"] },
      ];
    }),
    mutate((value) => {
      value.activity.additional_sports = [
        { ...validSport, minutesPerSession: 0 },
      ];
    }),
    mutate((value) => {
      value.activity.additional_sports = [
        { ...validSport, intensity: "MAXIMUM" },
      ];
    }),
  ];

  for (const invalidSnapshot of invalidSnapshots) {
    assert.throws(
      () => buildNutritionEnergyTarget(invalidSnapshot),
      TypeError,
    );
  }
});
