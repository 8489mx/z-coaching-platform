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
 */

export const PHARMACOLOGICAL_RULES = {
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
