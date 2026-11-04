import test from "node:test";
import assert from "node:assert/strict";

import { getCheckinAdherencePercent } from "../frontend/src/utils/checkinAdherence.js";
import { resolveMilestoneMetrics } from "../frontend/src/utils/milestoneMetrics.js";
import { formatCardioLine } from "../frontend/src/utils/cardioLine.js";
import { generateCheckinApprovalWhatsAppMessage } from "../frontend/src/utils/checkinApprovalWhatsApp.js";
import { collectCoachAlerts } from "../frontend/src/utils/coachAlerts.js";

// P1-B11 "surfaces corrected": committed tests for the pure modules the
// package introduced or changed. JSX/Dart rendering is covered by the
// fail-first probe's static checks, not here (no vite/React/Flutter here).

test("adherence is the raw server value, never blended, never defaulted", () => {
  assert.equal(getCheckinAdherencePercent({ nutrition_adherence_percent: 82 }), 82);
  assert.equal(getCheckinAdherencePercent({ adherence: 77 }), 77);
  // Missing / out-of-range / non-numeric input is unknown, not 100.
  assert.equal(getCheckinAdherencePercent({}), null);
  assert.equal(getCheckinAdherencePercent({ nutrition_adherence_percent: null }), null);
  assert.equal(getCheckinAdherencePercent({ nutrition_adherence_percent: 140 }), null);
  assert.equal(getCheckinAdherencePercent({ nutrition_adherence_percent: "high" }), null);
  // A workout-completion blend must not leak in through another key.
  assert.equal(getCheckinAdherencePercent({ nutrition_adherence_percent: 60, workouts_completed: 4, workouts_scheduled: 4 }), 60);
});

test("milestone metrics accept both key sets and never invent values", () => {
  const m = resolveMilestoneMetrics({
    client: { start_weight: 90 },
    activeCheckin: {
      metrics: { current_weight: 84, waist_current: 88, adherence: 80 },
      biofeedback: { energy: 4, sleep: 3 },
      week_number: 6,
    },
    history: [
      { weight: 90, waist: 95, adherence: 70 },
      { weight: 84, waist: 88, adherence: 80 },
    ],
  });
  assert.equal(m.canRender, true);
  assert.equal(m.weightDropKg, 6);
  assert.equal(m.waistDropCm, 7);
  assert.equal(m.weeksCount, 6);
  assert.equal(m.avgAdherence, 80);

  // Legacy key set (weight_kg / waist_cm / diet_adherence_percentage).
  const legacy = resolveMilestoneMetrics({
    client: {},
    activeCheckin: {},
    history: [
      { weight_kg: 100, waist_cm: 100, diet_adherence_percentage: 90 },
      { weight_kg: 95, waist_cm: 96, diet_adherence_percentage: 80 },
    ],
  });
  assert.equal(legacy.canRender, true);
  assert.equal(legacy.weightDropKg, 5);
  assert.equal(legacy.waistDropCm, 4);

  // No weights anywhere: the card must refuse, not print 85 kg.
  const empty = resolveMilestoneMetrics({ client: {}, activeCheckin: {}, history: [] });
  assert.equal(empty.canRender, false);
  assert.equal(empty.startWeight, null);
  assert.equal(empty.currentWeight, null);
  assert.equal(empty.weeksCount, null);
});

test("cardio line comes from the served card or is omitted", () => {
  assert.equal(
    formatCardioLine({ protocol_title_ar: "مشي سريع", sessions_per_week: 4, duration_minutes: 30 }),
    "مشي سريع، 4 مرات أسبوعياً، 30 دقيقة"
  );
  assert.equal(formatCardioLine({ modality: "دراجة" }), "دراجة");
  assert.equal(formatCardioLine(null), null);
  assert.equal(formatCardioLine({}), null);
});

test("whatsapp summary claims applied macros only when applied", () => {
  const base = {
    clientName: "أحمد",
    weekNumber: 3,
    macros: { calories: 2000, protein: 150, carbs: 200, fats: 60 },
    cardioTarget: "مشي سريع",
    coachNotes: "استمر",
  };
  const applied = generateCheckinApprovalWhatsAppMessage({ ...base, adaptationApplied: true });
  assert.match(applied, /الأهداف الغذائية المعتمدة/);
  assert.match(applied, /الخطة المحدثة/);

  const draft = generateCheckinApprovalWhatsAppMessage({ ...base });
  assert.doesNotMatch(draft, /الأهداف الغذائية المعتمدة/);
  assert.doesNotMatch(draft, /الخطة المحدثة/);
  assert.match(draft, /خطتك الحالية/);
});

test("coach alerts recompute from current meals, not load-time notes", () => {
  // The load-time meal-count note lives on targets.meal_count_note_ar.
  // Editor targets never carry it, so a recompute drops the stale note.
  const alerts = collectCoachAlerts({
    nutrition: {
      targets: { meal_count_note_ar: "ملاحظة قديمة لعدد وجبات قديم" },
      culinary_meals: [
        { items: [{ name_ar: "شوفان", portion_warning_ar: "الحصة كبيرة" }] },
      ],
    },
  });
  assert.ok(alerts.includes("ملاحظة قديمة لعدد وجبات قديم"));
  assert.ok(alerts.some((a) => a.includes("شوفان")));

  const recomputed = collectCoachAlerts({
    nutrition: {
      targets: {},
      culinary_meals: [
        { items: [{ name_ar: "شوفان", portion_warning_ar: "الحصة كبيرة" }] },
      ],
    },
  });
  assert.ok(!recomputed.includes("ملاحظة قديمة لعدد وجبات قديم"));
  assert.ok(recomputed.some((a) => a.includes("شوفان")));
});
