/**
 * Zero-Conflict Pharmacological Isolation Firewall
 *
 * Deterministic Pharmacological Safety Matrix:
 * 1. Levothyroxine (Eltroxin / Euthyrox):
 *    - 4-hour strict isolation window from calcium, iron, soy, and high fiber.
 * 2. Metformin (Glucophage):
 *    - Taken with largest meal; mandatory B12 replenishment tracking.
 * 3. Statins (Atorvastatin / Lipitor / Crestor):
 *    - Absolute ban on Grapefruit fruit and juice (CYP3A4 inhibition).
 * 4. ACE Inhibitors / ARBs (Captopril, Enalapril, Losartan):
 *    - Strict ban on Potassium Chloride (KCl) salt substitutes to prevent hyperkalemia.
 * 5. Antibiotics (Fluoroquinolones / Tetracyclines):
 *    - 2-hour separation from dairy and multivalent divalent minerals (Ca, Fe, Mg).
 * 6. Exogenous Insulin Therapy (Lantus, Novorapid, Apidra, etc.):
 *    - Minimum 130g carb floor, anti-keto lock, 15-15 emergency rule, and non-working muscle injection directive.
 */

export const INSULIN_DRUG_KEYS = [
  'INSULIN', 'LANTUS', 'NOVORAPID', 'APIDRA', 'TRESIBA', 'MIXTARD', 'HUMALOG', 'LEVEMIR', 'انسولين'
];

export const PHARMACOLOGICAL_RULES = {
  INSULIN: {
    identifiers: INSULIN_DRUG_KEYS,
    carb_floor_grams: 130,
    lock_keto: true,
    safety_cues_ar: [
      'قاعدة 15-15: احتفظ بـ 15 جم سكر سريع في حقيبة الجيم (عصير صغير / تمر) للطوارئ.',
      'توجيه موضع الحقن: تجنب حقن الأنسولين السريع في العضلة المستهدفة بالتمرين في نفس اليوم.',
      'نطاق الأمان: السكر قبل التمرين يجب أن يكون بين 100 إلى 250 mg/dL.'
    ],
    rule_directive_ar: 'بروتوكول الأنسولين الإكلينيكي: قفل حد أدنى للكربوهيدرات عند 130 جم لمنع هبوط السكر، مع تفعيل قاعدة 15-15 للطوارئ وتوجيه موضع الحقن بعيداً عن العضلات المستهدفة بالتمرين.'
  },
  LEVOTHYROXINE: {
    identifiers: ['ELTROXIN', 'EUTHYROX', 'LEVOTHYROXINE', 'THYROXINE', 'غدة'],
    isolation_hours: 4,
    prohibited_during_window: ['ألبان', 'أجبان', 'مكملات كالسيوم', 'مكملات حديد', 'صويا', 'ألياف عالية'],
    rule_directive_ar: 'قفل زمني صارم 4 ساعات: تناول حبة الغدة على معدة فارغة تماماً مع الماء والانتظار 4 ساعات كاملة قبل تناول الألبان، الأجبان، مكملات الكالسيوم، الحديد، أو الصويا.'
  },
  METFORMIN: {
    identifiers: ['METFORMIN', 'GLUCOPHAGE', 'CIDOPHAGE', 'ميتفورمين', 'سيدوفاج'],
    timing_rule_ar: 'يُلزم تناول الجرعة في منتصف أو نهاية أكبر وجبة طعام لتقليل الاضطراب المعوي.',
    mandatory_cofactor: 'Vitamin B12 (500 - 1000 mcg)',
    cofactor_rationale_ar: 'لتعويض استنزاف بكتيريا الأمعاء ومستقبلات امتصاص فيتامين B12 الناتج عن الاستخدام المزمن للميتفورمين.'
  },
  STATINS: {
    identifiers: ['LIPITOR', 'CRESTOR', 'ATORVASTATIN', 'ROSUVASTATIN', 'STATIN', 'كوليسترول'],
    prohibited_foods: ['GRAPEFRUIT', 'GRAPEFRUIT_JUICE', 'جريب فروت'],
    rule_directive_ar: 'حظر مطلق لثمار وعصير الجريب فروت من الوجبات والمبادلات لتفادي تثبيط إنزيم CYP3A4 الكبدي ومنع سمية العضلات.'
  },
  ACE_INHIBITORS_ARBS: {
    identifiers: ['CAPTOPRIL', 'ENALAPRIL', 'LOSARTAN', 'VALSARTAN', 'ZESTORETIC', 'ضغط'],
    prohibited_items: ['POTASSIUM_CHLORIDE_SALT_SUBSTITUTE', 'بدائل الملح الغنية بالبوتاسيوم KCl'],
    rule_directive_ar: 'حظر بدائل الملح المحتوية على كلوريد البوتاسيوم (KCl) لتجنب خطر فرط بوتاسيوم الدم (Hyperkalemia).'
  },
  ANTIBIOTICS: {
    identifiers: ['CIPROFLOXACIN', 'DOXYCYCLINE', 'LEVOFLOXACIN', 'TETRACYCLINE', 'مضاد حيوي'],
    isolation_hours: 2,
    prohibited_during_window: ['منتجات الألبان', 'مكملات المعادن الثنائية (كالسيوم، حديد، مغنيسيوم)'],
    rule_directive_ar: 'فاصل أمان ساعتين قبل وبعد الجرعة بعيداً عن منتجات الألبان ومكملات المعادن لتفادي التصالب المخلبي (Chelation) وفقدان فاعلية الدواء.'
  }
};

export function evaluateInsulinSafety(medicationsList = []) {
  const normalizedMeds = (Array.isArray(medicationsList) ? medicationsList : [medicationsList])
    .map(m => String(m || '').toUpperCase());

  const isTakingInsulin = normalizedMeds.some(med => 
    INSULIN_DRUG_KEYS.some(k => med.includes(k))
  );

  if (!isTakingInsulin) {
    return { requires_insulin_protocol: false };
  }

  return {
    requires_insulin_protocol: true,
    carb_floor_grams: 130,
    lock_keto: true,
    safety_cues_ar: [
      'قاعدة 15-15: احتفظ بـ 15 جم سكر سريع في حقيبة الجيم (عصير صغير / تمر) للطوارئ.',
      'توجيه موضع الحقن: تجنب حقن الأنسولين السريع في العضلة المستهدفة بالتمرين في نفس اليوم.',
      'نطاق الأمان: السكر قبل التمرين يجب أن يكون بين 100 إلى 250 mg/dL.'
    ]
  };
}

/**
 * Evaluates active pharmacological profile against dietary & supplement prescriptions.
 */
export function evaluatePharmacologicalFirewall(medicationsList = []) {
  const activeRules = [];
  const normalizedMeds = (Array.isArray(medicationsList) ? medicationsList : [medicationsList])
    .map(m => String(m || '').toUpperCase());

  for (const [key, rule] of Object.entries(PHARMACOLOGICAL_RULES)) {
    const isMatch = rule.identifiers.some(id => 
      normalizedMeds.some(med => med.includes(id))
    );

    if (isMatch) {
      activeRules.push({
        drug_category: key,
        ...rule
      });
    }
  }

  return {
    has_active_drug_rules: activeRules.length > 0,
    active_rules_count: activeRules.length,
    active_firewall_rules: activeRules,
    isolation_directives_ar: activeRules.map(r => r.rule_directive_ar || r.timing_rule_ar)
  };
}
