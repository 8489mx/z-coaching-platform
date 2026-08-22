import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluatePharmacologicalFirewall,
  PHARMACOLOGICAL_RULES,
  evaluateBiochemicalSynergies,
  FOOD_FIRST_FALLBACK_MATRIX,
  LEGAL_MEDICAL_DISCLAIMER_AR,
  NON_MANDATORY_LABEL_AR
} from '../src/execution-engines/index.js';

test('1. Pharmacological Firewall - Levothyroxine Enforces 4-Hour Isolation from Calcium, Iron, Dairy', () => {
  const result = evaluatePharmacologicalFirewall(['Eltroxin 100mcg']);
  assert.equal(result.has_active_drug_rules, true);
  assert.equal(result.active_rules_count, 1);
  const thyroxineRule = result.active_firewall_rules[0];
  assert.equal(thyroxineRule.isolation_hours, 4);
  assert.ok(thyroxineRule.prohibited_during_window.includes('ألبان'));
  assert.ok(thyroxineRule.prohibited_during_window.includes('مكملات كالسيوم'));
});

test('2. Pharmacological Firewall - Statins Block Grapefruit and ACE Inhibitors Block KCl Substitutes', () => {
  const result = evaluatePharmacologicalFirewall(['Lipitor 20mg', 'Captopril 25mg']);
  assert.equal(result.active_rules_count, 2);

  const statinRule = result.active_firewall_rules.find(r => r.drug_category === 'STATINS');
  assert.ok(statinRule.prohibited_foods.includes('GRAPEFRUIT'));

  const aceRule = result.active_firewall_rules.find(r => r.drug_category === 'ACE_INHIBITORS_ARBS');
  assert.ok(aceRule.prohibited_items.some(i => i.includes('POTASSIUM_CHLORIDE')));
});

test('3. Pharmacological Firewall - Metformin Requires Meal Administration and B12 Monitoring', () => {
  const result = evaluatePharmacologicalFirewall(['Glucophage 1000mg']);
  const metforminRule = result.active_firewall_rules[0];
  assert.ok(metforminRule.timing_rule_ar.includes('أكبر وجبة'));
  assert.ok(metforminRule.mandatory_cofactor.includes('B12'));
});

test('4. Biochemical Synergy - Vitamin D3 Closed Loop Enforces K2 (MK-7) & Magnesium', () => {
  const result = evaluateBiochemicalSynergies({
    prescribed_supplements: ['Vitamin D3 5000 IU'],
    meal_fat_grams: 8
  });

  assert.equal(result.co_factor_synergies.length, 1);
  const d3Synergy = result.co_factor_synergies[0];
  assert.equal(d3Synergy.target_supplement, 'Vitamin D3');
  assert.ok(d3Synergy.mandatory_co_factors.some(c => c.nutrient.includes('K2')));
  assert.ok(d3Synergy.mandatory_co_factors.some(c => c.nutrient.includes('Magnesium')));
  assert.equal(result.fat_soluble_absorption_check.is_fat_vehicle_sufficient, true);
});

test('5. Biochemical Synergy - Iron Requires Vitamin C Synergy and 2h Calcium Spacing', () => {
  const result = evaluateBiochemicalSynergies({
    prescribed_supplements: ['Gentle Iron Bisglycinate'],
    meal_fat_grams: 6
  });

  const ironSynergy = result.co_factor_synergies.find(s => s.target_supplement === 'Iron');
  assert.ok(ironSynergy.mandatory_co_factors.some(c => c.nutrient.includes('Vitamin C')));
  assert.ok(ironSynergy.spacing_rules_ar.includes('ساعتين'));
});

test('6. Food-First Matrix & Legal Disclaimer - Provides Non-Mandatory Natural Whole-Food Options', () => {
  const result = evaluateBiochemicalSynergies({
    prescribed_supplements: ['Omega-3 Fish Oil', 'Magnesium Glycinate', 'Zinc Picolinate']
  });

  assert.equal(result.non_mandatory_label_ar, NON_MANDATORY_LABEL_AR);
  assert.ok(result.legal_medical_disclaimer_ar.includes('تنويه طبي وإخلاء مسؤولية'));
  assert.ok(result.food_first_fallback_matrix.some(f => f.supplement_name.includes('Zinc')));
});
