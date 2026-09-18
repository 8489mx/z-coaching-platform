import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluatePharmacologicalFirewall,
  PHARMACOLOGICAL_RULES
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

