import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { evaluateIntake } from "z-coaching-intake-decision-engine";

/**
 * The engine handled pregnancy, breastfeeding, a recent birth, PCOS, asthma and heart disease, but the
 * intake form never asked about them: every woman reached the engine as not pregnant with no PCOS, so a
 * pregnant client on fat loss got a 20% deficit. One question for women only (one tap for "none"),
 * required before submitting, and two more conditions in the existing list.
 */
const FORM = fs.readFileSync("frontend/src/pages/FullIntakeForm.jsx", "utf8");
const MODAL = fs.readFileSync("frontend/src/components/intake/IntakeAuditDetailModal.jsx", "utf8");
const CONTEXT = { system_time: "2026-09-22T08:00:00.000Z", assessmentDate: "2026-09-22" };

test("the form asks women about pregnancy, breastfeeding, a recent birth and PCOS", () => {
  assert.match(FORM, /gender === 'female' && \(\(\) => \{/);
  for (const key of ["'none'", "'pregnant'", "'is_lactating'", "'is_postpartum'", "'is_pcos'"]) {
    assert.ok(FORM.includes(`key: ${key}, label:`), `${key} option`);
  }
  assert.match(FORM, /const pregnant = prev\.female_pregnancy !== 'PREGNANT';/);
  assert.match(FORM, /female_pregnancy: pregnant \? 'PREGNANT' : null/);
});

test("a woman must answer it before submitting, and a man never sends it", () => {
  assert.match(FORM, /formData\.gender === 'female' && formData\.medical_conditions\?\.female_cases\?\.answered !== true/);
  assert.match(FORM, /answers: formData\.gender === 'female' \? formData : \{/);
});

test("asthma and heart disease are in the conditions list and on the coach's intake view", () => {
  assert.ok(FORM.includes("{ key: 'asthma', label:"));
  assert.ok(FORM.includes("{ key: 'heart_condition', label:"));
  assert.match(MODAL, /asthma: '/);
  assert.match(MODAL, /heart_condition: '/);
  assert.match(MODAL, /label="حامل" value=\{answers\.female_pregnancy === 'PREGNANT'\}/);
});

// What the form sends for each answer, and what the engine reads from it.
const answers = (femalePregnancy, femaleCases, selected = ["none"]) => ({
  gender: "female", age: "30", height_cm: "165", weight_kg: "75", primary_goal: "fat_loss", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: !selected.includes("none"), selected,
    female_cases: { is_pcos: false, is_lactating: false, is_postpartum: false, answered: true, ...femaleCases } },
  injuries_map: { has_injuries: false, selected_areas: ["none"] }, strict_allergies: ["none"],
  training_logistics: { days_per_week: 3, training_age: "never" }, female_pregnancy: femalePregnancy,
});
const canonical = (a) => adaptIntakePayloadToCanonicalEngine(structuredClone(a));

test("each answer reaches the engine", () => {
  assert.equal(canonical(answers("PREGNANT", {})).medical.pregnancyStatus, "PREGNANT");
  assert.equal(canonical(answers(null, { is_lactating: true })).medical.pregnancyStatus, "BREASTFEEDING");
  assert.equal(canonical(answers(null, { is_postpartum: true })).medical.pregnancyStatus, "POSTPARTUM");
  assert.equal(canonical(answers(null, {})).medical.pregnancyStatus, "NOT_PREGNANT");
  assert.ok(canonical(answers(null, { is_pcos: true })).medical.conditions.some((c) => c.conditionCode === "PCOS"));
  const codes = canonical(answers(null, {}, ["asthma", "heart_condition"])).medical.conditions.map((c) => c.conditionCode);
  assert.ok(codes.includes("ASTHMA_OR_RESPIRATORY_CONDITION") && codes.includes("HEART_CONDITION"), codes.join());
  assert.equal(evaluateIntake(canonical(answers(null, {})), CONTEXT).plan_status, "READY_FOR_DRAFT");
});
