import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { API_BASE } from '../config/api';
import { getStoredCoachConfig } from '../utils/themeAndCoachConfig';
import { extractClientFastingProfile } from '../utils/seasonalFastingRadar';
import { getExerciseDisplayNames } from '../utils/exerciseTranslator';
import { getItemPortionMeta } from '../utils/kitchenYieldEngine';
import { sanitizeCoachNotesForClient, filterEmptyDaysAndSections } from '../utils/pdfExportEngine';

const CSS_STYLES = `
  @page {
    size: A4 portrait;
    margin: 0 !important;
  }

  * {
    box-sizing: border-box !important;
  }

  .pdf-view-wrapper {
    background-color: #E2E8F0;
    min-height: 100vh;
    padding: 24px 0;
    font-family: var(--font-sans);
  }

  @media screen {
    .pdf-page-container {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      min-height: 297mm;
      margin: 0 auto 24px auto;
      background: #FFFFFF !important;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.12);
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 12mm 14mm;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }
  }

  @media print {
    html, body, #root, .pdf-view-wrapper {
      background: #FFFFFF !important;
      background-color: #FFFFFF !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 210mm !important;
      height: auto !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .no-print {
      display: none !important;
    }

    .pdf-page-container {
      width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      max-height: 297mm !important;
      margin: 0 !important;
      padding: 10mm 12mm !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      background: #FFFFFF !important;
      background-color: #FFFFFF !important;
      page-break-before: auto !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    .pdf-page-container:last-of-type {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
  }

  .running-header {
    border-bottom: 1pt solid #E2E8F0;
    padding-bottom: 5px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7.5pt;
    font-weight: 700;
    color: #475569;
  }

  .running-footer {
    border-top: 1pt solid #E2E8F0;
    padding-top: 5px;
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7.5pt;
    color: #64748B;
    font-weight: 600;
  }

  .pdf-table {
    width: 100% !important;
    table-layout: fixed !important;
    border-collapse: collapse !important;
    margin-bottom: 8px;
    font-size: 8pt;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .pdf-table th {
    background-color: #F8FAFC !important;
    color: #0F172A !important;
    font-weight: 700;
    border: 0.5pt solid #CBD5E1;
    padding: 6px 5px;
    vertical-align: middle;
    word-break: break-word !important;
    overflow-wrap: break-word !important;
  }

  .pdf-table td {
    background-color: #FFFFFF !important;
    border: 0.5pt solid #E2E8F0;
    padding: 5px 5px;
    color: #0F172A;
    vertical-align: middle;
    word-break: break-word !important;
    overflow-wrap: break-word !important;
    white-space: normal !important;
  }

  .pdf-table-center th,
  .pdf-table-center td {
    text-align: center !important;
    vertical-align: middle !important;
  }

  .pdf-card {
    background-color: #FFFFFF !important;
    border: 0.5pt solid #CBD5E1;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 8px;
    page-break-inside: avoid;
    break-inside: avoid;
    overflow: hidden;
  }

  .section-title {
    font-size: 9pt;
    font-weight: 800;
    color: #0F172A;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
    border-right: 3pt solid #0284C7;
    padding-right: 6px;
  }

  .nowrap {
    white-space: nowrap !important;
  }

  .text-center {
    text-align: center !important;
  }
`;

/**
 * Sanitizes any client display name, stripping developer tags, test labels, or clinical notes in parentheses.
 */
function sanitizeClientDisplayName(name) {
  if (!name) return 'المشترك';
  return String(name)
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\b(persona|test|stress|audit|minefield|client|user)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || 'المشترك';
}

/**
 * Sanitizes goal labels to ensure pure fitness terminology without internal codes.
 */
function sanitizeGoalLabel(goal) {
  if (!goal) return 'خسارة دهون وتنشيف عضلي متقدم';
  const str = String(goal).trim();
  const upper = str.toUpperCase();
  if (upper.includes('FAT_LOSS') || str.includes('خسارة دهون') || str.includes('تنشيف')) return 'خسارة دهون وتنشيف عضلي متقدم';
  if (upper.includes('HYPERTROPHY') || str.includes('تضخيم') || str.includes('بناء عضلي')) return 'زيادة الكتلة العضلية والقوة البدنية';
  if (upper.includes('RECOMP') || str.includes('إعادة تشكيل')) return 'نزول دهون مع شد وبناء عضل';
  if (upper.includes('COACH_DECIDES')) return 'الهدف اللي حدده الكوتش ليك';
  return str.replace(/\s*\(.*?\)\s*/g, ' ').trim() || 'خسارة دهون وتنشيف عضلي متقدم';
}

/**
 * Resolves precise Arabic muscle name for any exercise, eliminating generic placeholders.
 */
function resolveExerciseMuscleName(ex) {
  if (!ex) return 'عضلات مستهدفة';
  if (ex.target_muscle_ar) return ex.target_muscle_ar;
  if (ex.muscle_ar) return ex.muscle_ar;
  if (ex.target_muscle && /[\u0600-\u06FF]/.test(ex.target_muscle)) return ex.target_muscle;
  if (ex.muscle && /[\u0600-\u06FF]/.test(ex.muscle) && ex.muscle !== 'عضلة رئيسية') return ex.muscle;

  const raw = String(ex.muscle || ex.target_muscle || ex.muscle_group || ex.primary_muscle || ex.name || ex.name_en || ex.code || '').toUpperCase();
  const rawAr = String(ex.name_ar || ex.name || '');

  if (raw.includes('BENCH') || raw.includes('CHEST') || raw.includes('PUSH-UP') || raw.includes('FLY') || rawAr.includes('صدر') || rawAr.includes('بنش') || rawAr.includes('ضغط قبضة')) {
    if (raw.includes('INCLINE') || rawAr.includes('مائل')) return 'الصدر العلوي';
    if (raw.includes('CLOSE-GRIP') || rawAr.includes('ضيقة') || raw.includes('PUSH-UP')) return 'الترايسبس والصدر الداخلي';
    return 'عضلات الصدر';
  }
  if (raw.includes('LATS') || raw.includes('PULLDOWN') || raw.includes('ROW') || raw.includes('DEADLIFT') || raw.includes('BACK') || rawAr.includes('ظهر') || rawAr.includes('سحب') || rawAr.includes('تجديف')) {
    if (raw.includes('PULLDOWN') || rawAr.includes('سحب عالي')) return 'الظهر العريض (اللاتس)';
    if (raw.includes('ROW') || rawAr.includes('تجديف')) return 'منتصف الظهر والمجنص';
    if (raw.includes('DEADLIFT') || rawAr.includes('ديدليفت')) return 'السلسلة الخلفية وأسفل الظهر';
    return 'عضلات الظهر';
  }
  if (raw.includes('SQUAT') || raw.includes('LUNGE') || raw.includes('QUAD') || raw.includes('LEG EXT') || rawAr.includes('سكوات') || rawAr.includes('طعنات') || rawAr.includes('أرجل')) {
    if (raw.includes('LUNGE') || rawAr.includes('طعنات')) return 'الأرجل الأمامية والمؤخرة';
    if (raw.includes('CURL') || raw.includes('ROMANIAN') || raw.includes('RDL') || rawAr.includes('خلفية') || rawAr.includes('روماني')) return 'عضلات الفخذ الخلفية';
    return 'الأرجل الأمامية (الكوادس)';
  }
  if (raw.includes('HAMSTRING') || raw.includes('LEG CURL') || rawAr.includes('خلفي')) {
    return 'عضلات الفخذ الخلفية';
  }
  if (raw.includes('SHOULDER') || raw.includes('OVERHEAD') || raw.includes('OHP') || raw.includes('LATERAL') || rawAr.includes('DELT') || rawAr.includes('كتف') || rawAr.includes('رفرفة')) {
    if (raw.includes('LATERAL') || rawAr.includes('جانبي') || rawAr.includes('رفرفة')) return 'الكتف الجانبي';
    if (raw.includes('REAR') || rawAr.includes('خلفي')) return 'الكتف الخلفي';
    return 'الكتف الأمامي والعلوي';
  }
  if (raw.includes('BICEPS') || raw.includes('CURL') || rawAr.includes('بايسبس') || rawAr.includes('باي')) {
    return 'عضلة البايسبس';
  }
  if (raw.includes('TRICEPS') || raw.includes('PUSHDOWN') || rawAr.includes('ترايسبس') || rawAr.includes('تراي')) {
    return 'عضلة الترايسبس';
  }
  if (raw.includes('CALF') || rawAr.includes('سمانة')) {
    return 'عضلات السمانة';
  }
  if (raw.includes('GLUTE') || raw.includes('HIP') || rawAr.includes('جلوتس') || rawAr.includes('مؤخرة')) {
    return 'عضلات المؤخرة والحوض';
  }
  if (raw.includes('ABS') || raw.includes('CORE') || raw.includes('PLANK') || raw.includes('DEAD BUG') || rawAr.includes('كور') || rawAr.includes('بطن') || rawAr.includes('حشرة')) {
    return 'عضلات البطن والجذع (الكور)';
  }

  return 'عضلات مستهدفة';
}

/**
 * Resolves smart gym rush / equipment substitute for any exercise.
 */
function resolveExerciseAlternative(ex) {
  if (!ex) return null;
  if (ex.substitute) return ex.substitute;
  if (ex.alternative) return ex.alternative;
  if (ex.swap_name) return ex.swap_name;
  if (ex.alternative_ar) return ex.alternative_ar;
  if (ex.safetyNote && ex.safetyNote.includes('بديل')) return ex.safetyNote.replace(/^بديل.*?:/i, '').trim();

  const raw = String(ex.name_en || ex.name || ex.code || '').toUpperCase();
  const rawAr = String(ex.name_ar || ex.name || '');

  // Chest / Press
  if (raw.includes('INCLINE') && (raw.includes('BENCH') || raw.includes('PRESS') || rawAr.includes('مائل'))) {
    return 'ضغط دمبلز بنش مائل 30° أو جهاز سميث مائل';
  }
  if (raw.includes('BENCH PRESS') || raw.includes('FLAT BENCH') || rawAr.includes('بنش برس') || rawAr.includes('بنش مستوي')) {
    return 'ضغط دمبلز بنش مستوي أو جهاز الصدر بالوزن الحر (Chest Press Machine)';
  }
  if (raw.includes('PUSH-UP') || rawAr.includes('ضغط قبضة')) {
    return 'ترايسبس دفع كابل لأسفل بالحبل أو بار مستوي';
  }
  if (raw.includes('FLY') || raw.includes('PEC DECK') || rawAr.includes('تفتيح') || rawAr.includes('فراشة')) {
    return 'تفتيح كابل وسطي متقاطع (Cable Crossover) أو تفتيح بالدمبل';
  }

  // Back / Pull
  if (raw.includes('PULLDOWN') || rawAr.includes('سحب عالي')) {
    return 'سحب فردي بالكابل أو سحب عالي قبضة متوازية ضيقة';
  }
  if (raw.includes('BENT-OVER ROW') || raw.includes('BARBELL ROW') || (raw.includes('ROW') && !raw.includes('UPRIGHT')) || rawAr.includes('تجديف')) {
    return 'تجديف دمبل مسنود الصدر على بنش مائل أو سحب كابل جالس';
  }
  if (raw.includes('DEADLIFT') || rawAr.includes('ديدليفت')) {
    return 'ديدليفت روماني بالدمبلز (DB RDL) أو هايبرايكستنشن 45°';
  }

  // Shoulders
  if (raw.includes('OVERHEAD') || raw.includes('OHP') || raw.includes('MILITARY') || rawAr.includes('كتف بالبار') || (raw.includes('SHOULDER') && raw.includes('PRESS'))) {
    return 'ضغط كتف بالدمبلز جالساً أو جهاز ضغط الأكتاف';
  }
  if (raw.includes('LATERAL') || rawAr.includes('جانبي') || rawAr.includes('رفرفة')) {
    return 'رفرفة كابل جانبي قطري (Cable Y-Raise) أو دمبل مائل';
  }
  if (raw.includes('REAR') || raw.includes('FACE PULL') || rawAr.includes('خلفي') || rawAr.includes('فيس بول')) {
    return 'فيس بول بالحبل على الكابل أو رفرفة خلفية بالدمبل على بنش مائل';
  }

  // Legs
  if (raw.includes('SQUAT') || rawAr.includes('سكوات')) {
    return 'السكوات البلغاري بالدمبلز (Bulgarian Split Squat) أو جهاز الهاك سكوات';
  }
  if (raw.includes('LUNGE') || rawAr.includes('طعنات')) {
    return 'طعنات متحركة بالدمبلز أو سبليت سكوات على بنش ثابت';
  }
  if (raw.includes('LEG EXTENSION') || rawAr.includes('فرد أرجل') || rawAr.includes('أمامي')) {
    return 'السكوات الإسباني بالمطاط (Spanish Squat) أو سيسي سكوات بالوزن';
  }
  if (raw.includes('LEG CURL') || rawAr.includes('ثني أرجل') || rawAr.includes('مرجحة أرجل')) {
    return 'ثني أرجل نائماً بالدمبل بين القدمين أو ديدليفت روماني فردي';
  }
  if (raw.includes('CALF') || rawAr.includes('سمانة')) {
    return 'رفع السمانة فردي على حافة الدرج بالدمبل أو جهاز السمانة جالس';
  }

  // Arms
  if (raw.includes('BICEPS') || raw.includes('CURL') || rawAr.includes('بايسبس') || rawAr.includes('باي')) {
    return 'مرجحة بايسبس بالدمبل على بنش مائل أو مرجحة بالحبل على الكابل';
  }
  if (raw.includes('TRICEPS') || raw.includes('PUSHDOWN') || rawAr.includes('ترايسبس') || rawAr.includes('تراي')) {
    return 'ترايسبس فرنساوي بالدمبل نائماً (Skull Crusher) أو حبل فوق الرأس';
  }

  // Core / Abs
  if (raw.includes('DEAD BUG') || raw.includes('PLANK') || raw.includes('ABS') || rawAr.includes('حشرة') || rawAr.includes('كور') || rawAr.includes('بطن')) {
    return 'تمرين البالوف برس بالكابل (Pallof Press) أو رفع الركبتين معلقاً';
  }

  return 'بديل حر مباشر بالدمبل بنفس زاوية الشد والمفصل';
}

export default function ProgramPdfView() {
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [user, setUser] = useState(null);

  const searchParams = new URLSearchParams(window.location.search);
  const targetUserId = searchParams.get('user_id') || searchParams.get('code') || '1';

  useEffect(() => {
    fetchData();
  // مقصود: التأثير يعمل عند تغيّر مفتاحه فقط. إضافة الدوال للتبعيات تُعاد إنشاؤها كل رندر فتدخل في حلقة إعادة تشغيل.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/programs/active/${targetUserId}`);
      const data = await res.json();
      if (data.master_program || data.program) {
        setProgram(data.master_program || data.program);
      }
      if (data.user) setUser(data.user);
    } catch (e) {
      console.error('ProgramPdfView load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (!loading && (program || user) && (searchParams.get('auto_print') === 'true' || searchParams.get('download') === 'true')) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 600);
      return () => clearTimeout(timer);
    }
  // مقصود: التأثير يعمل عند تغيّر مفتاحه فقط. إضافة الدوال للتبعيات تُعاد إنشاؤها كل رندر فتدخل في حلقة إعادة تشغيل.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, program, user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FFFFFF', direction: 'rtl', fontFamily: 'var(--font-sans)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #E2E8F0', borderTopColor: '#0284C7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px auto' }}></div>
          <h5 style={{ fontWeight: 800, color: '#0F172A', margin: 0 }}>جاري تجهيز الوثيقة التنفيذية المعتمدة...</h5>
        </div>
      </div>
    );
  }

  const coachConfig = getStoredCoachConfig();
  const coachName = coachConfig.coachName || 'كريم زكريا';
  const brandTitle = coachConfig.brandTitle || 'Z COACHING';

  const clientName = sanitizeClientDisplayName(program?.client?.full_name || program?.client_name || user?.full_name || 'المشترك');
  const clientCode = program?.client?.client_code || program?.client_code || user?.client_code || user?.id || targetUserId;
  const rawTier = program?.client?.subscription_package || program?.client?.package_tier || user?.package_tier || user?.subscription_package || 'ELITE';
  const packageTier = String(rawTier).toUpperCase().includes('MAX') ? 'باقة MAX الشاملة' : 'باقة ELITE المتقدمة';
  const now = new Date();
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const _issueDate = `${now.getDate()} ${arabicMonths[now.getMonth()]} ${now.getFullYear()}`;

  // Fasting Profile
  const clientObj = program?.client || user || {};
  const fastingProfile = extractClientFastingProfile(clientObj, clientObj.answers || program?.intake_summary);

  // Bio-metrics
  const heightCm = program?.client?.height_cm || user?.height || user?.height_cm || program?.intake_summary?.height || 180;
  const weightKg = program?.client?.weight_kg || user?.weight || user?.weight_kg || program?.intake_summary?.weight || 80;
  const bmi = (weightKg / ((heightCm / 100) * (heightCm / 100))).toFixed(1);
  const bodyFat = program?.client?.body_fat || user?.body_fat || program?.intake_summary?.body_fat || '18.5%';
  const neckCm = program?.intake_summary?.neck || 40;
  const waistCm = program?.intake_summary?.waist || 88;
  const hipsCm = program?.intake_summary?.hips || 102;
  const primaryGoal = sanitizeGoalLabel(program?.client?.goal_label || program?.client?.primary_goal || user?.primary_goal || program?.intake_summary?.primary_goal || 'خسارة دهون وتنشيف عضلي متقدم');
  const rawCoachNotes = program?.coach_notes || program?.notes || clientObj?.coach_notes || user?.coach_notes || '';
  const coachNotes = sanitizeCoachNotesForClient(rawCoachNotes);

  // Energy & Macros
  const targetCalories = Math.round(
    program?.nutrition?.targets?.calories ||
    program?.nutrition_program?.stages?.energy_target?.target_calories_kcal || 
    program?.nutrition_program?.macro_targets?.calories_kcal ||
    2250
  );
  const proteinG = Math.round(
    program?.nutrition?.targets?.protein ||
    program?.nutrition_program?.stages?.macro_targets?.protein_g || 
    180
  );
  const carbsG = Math.round(
    program?.nutrition?.targets?.carbs ||
    program?.nutrition_program?.stages?.macro_targets?.carbohydrate_g || 
    program?.nutrition_program?.macro_targets?.carb_g ||
    230
  );
  const fatsG = Math.round(
    program?.nutrition?.targets?.fats ||
    program?.nutrition_program?.stages?.macro_targets?.fat_g || 
    68
  );
  const hydrationLiters = program?.nutrition_program?.targets?.hydration?.recommended_range_liters
    || program?.nutrition_program?.hydration?.recommended_range_liters 
    || program?.nutrition?.hydration?.recommended_range_liters
    || `${(weightKg * 0.040).toFixed(1)} - ${(weightKg * 0.040 + 0.5).toFixed(1)} لتر/اليوم`;

  // Meals
  const meals = program?.nutrition?.meals 
    || program?.nutrition_program?.quantized_plan?.meals 
    || [
    {
      meal_name_ar: 'الوجبة الأولى (وجبة الإفطار)',
      meal_energy_kcal: 506,
      items: [
        { name_ar: 'بيض طازج كامل مسلوق', amount_g: 3, unit: 'حبات' },
        { name_ar: 'بياض بيض صافي', amount_g: 100, unit: 'جم' },
        { name_ar: 'شوفان كامل الحبة خام', amount_g: 70, unit: 'جم' },
        { name_ar: 'توت مشكل أو فراولة طازجة', amount_g: 100, unit: 'جم' }
      ],
      protein_g: 34, carbs_g: 52, fat_g: 18
    },
    {
      meal_name_ar: 'الوجبة الثانية (وجبة الغداء)',
      meal_energy_kcal: 566,
      items: [
        { name_ar: 'صدور دجاج متبلة مشوية', amount_g: 200, unit: 'جم' },
        { name_ar: 'أرز بسمتي مطبوخ', amount_g: 220, unit: 'جم' },
        { name_ar: 'خضار مشكل سوتيه', amount_g: 150, unit: 'جم' },
        { name_ar: 'زيت زيتون بكر ممتاز', amount_g: 10, unit: 'جم' }
      ],
      protein_g: 48, carbs_g: 62, fat_g: 14
    },
    {
      meal_name_ar: 'الوجبة الثالثة (وجبة العشاء)',
      meal_energy_kcal: 308,
      items: [
        { name_ar: 'جبن قريش طبيعي قليل الملح', amount_g: 150, unit: 'جم' },
        { name_ar: 'بطاطس مسلوقة أو مشوية', amount_g: 150, unit: 'جم' },
        { name_ar: 'سلطة خضراء مع خيار وورقيات', amount_g: 150, unit: 'جم' }
      ],
      protein_g: 30, carbs_g: 38, fat_g: 4
    }
  ];

  // Active Training Week Resolution
  const activeWeekNum = parseInt(searchParams.get('week'), 10) || program?.current_week || clientObj?.current_week || 1;
  const activeWeekObj = Array.isArray(program?.training_program?.weeks)
    ? (program.training_program.weeks.find(w => Number(w.week_number) === Number(activeWeekNum)) || program.training_program.weeks[0])
    : null;

  // Training Sessions
  const rawSessions = program?.training?.sessions 
    || program?.training_split?.sessions 
    || activeWeekObj?.sessions
    || program?.training_program?.weeks?.[0]?.sessions 
    || [
    {
      session_name: 'الحصة التدريبية 1: الصدر والأكتاف والترايسبس (Push A)',
      exercises: [
        { name_en: 'Barbell Bench Press', name_ar: 'بنش برس بالبار مستوي', sets: 3, reps: '8 - 10', rest: '90 ثانية' },
        { name_en: 'Barbell Bent-Over Row', name_ar: 'تجديف بالبار منحني الظهر', sets: 3, reps: '8 - 10', rest: '90 ثانية' },
        { name_en: 'Barbell Overhead Press (OHP)', name_ar: 'ضغط كتف بالبار واقفاً', sets: 3, reps: '8 - 10', rest: '90 ثانية' },
        { name_en: 'Lat Pulldown', name_ar: 'سحب عالي للظهر قبضة واسعة', sets: 3, reps: '8 - 12', rest: '75 ثانية' },
        { name_en: 'Dumbbell Biceps Curl', name_ar: 'مرجحة بايسبس بالدمبل متبادل', sets: 3, reps: '12 - 15', rest: '60 ثانية' },
        { name_en: 'Close-Grip Push-Up', name_ar: 'ضغط قبضة ضيقة للترايسبس والصدر', sets: 3, reps: '12 - 20', rest: '60 ثانية' }
      ]
    },
    {
      session_name: 'الحصة التدريبية 2: الأرجل والسمانة واستقرار الكور (Legs A)',
      exercises: [
        { name_en: 'Barbell Back Squat', name_ar: 'سكوات بالبار الخلفي للأرجل', sets: 3, reps: '8 - 10', rest: '120 ثانية' },
        { name_en: 'Dumbbell Romanian Deadlift', name_ar: 'ديدليفت روماني بالدمبل للخلفيات', sets: 3, reps: '8 - 10', rest: '90 ثانية' },
        { name_en: 'Dumbbell Reverse Lunge', name_ar: 'طعنات عكسية بالدمبل للأرجل', sets: 3, reps: '10 - 12', rest: '75 ثانية' },
        { name_en: 'Lying Leg Curl Machine', name_ar: 'مرجحة أرجل خلفية نائماً على الجهاز', sets: 3, reps: '10 - 15', rest: '60 ثانية' },
        { name_en: 'Dumbbell Calf Raise', name_ar: 'رفع السمانة بالدمبل واقفاً', sets: 3, reps: '15 - 20', rest: '60 ثانية' },
        { name_en: 'Dead Bug', name_ar: 'تمرين الحشرة الميتة لاستقرار الكور والبطن', sets: 3, reps: '15 - 20', rest: '60 ثانية' }
      ]
    },
    {
      session_name: 'الحصة التدريبية 3: الظهر والكتف الجانبي والبايسبس (Pull A)',
      exercises: [
        { name_en: 'Barbell Overhead Press (OHP)', name_ar: 'ضغط كتف بالبار واقفاً', sets: 3, reps: '8 - 10', rest: '90 ثانية' },
        { name_en: 'Lat Pulldown', name_ar: 'سحب عالي للظهر قبضة واسعة', sets: 3, reps: '8 - 12', rest: '75 ثانية' },
        { name_en: 'Barbell Bench Press', name_ar: 'بنش برس بالبار مستوي', sets: 3, reps: '8 - 10', rest: '90 ثانية' },
        { name_en: 'Barbell Bent-Over Row', name_ar: 'تجديف بالبار منحني الظهر', sets: 3, reps: '8 - 10', rest: '90 ثانية' },
        { name_en: 'Close-Grip Push-Up', name_ar: 'ضغط قبضة ضيقة للترايسبس والصدر', sets: 3, reps: '12 - 20', rest: '60 ثانية' },
        { name_en: 'Dumbbell Biceps Curl', name_ar: 'مرجحة بايسبس بالدمبل متبادل', sets: 3, reps: '12 - 15', rest: '60 ثانية' }
      ]
    },
    {
      session_name: 'الحصة التدريبية 4: الجزء السفلي والظهر السفلي (Legs B)',
      exercises: [
        { name_en: 'Dumbbell Romanian Deadlift', name_ar: 'ديدليفت روماني بالدمبل للخلفيات', sets: 3, reps: '8 - 10', rest: '90 ثانية' },
        { name_en: 'Barbell Back Squat', name_ar: 'سكوات بالبار الخلفي للأرجل', sets: 3, reps: '8 - 10', rest: '120 ثانية' },
        { name_en: 'Lying Leg Curl Machine', name_ar: 'مرجحة أرجل خلفية نائماً على الجهاز', sets: 3, reps: '10 - 15', rest: '60 ثانية' },
        { name_en: 'Dumbbell Reverse Lunge', name_ar: 'طعنات عكسية بالدمبل للأرجل', sets: 3, reps: '10 - 12', rest: '75 ثانية' },
        { name_en: 'Dumbbell Calf Raise', name_ar: 'رفع السمانة بالدمبل واقفاً', sets: 3, reps: '15 - 20', rest: '60 ثانية' },
        { name_en: 'Dead Bug', name_ar: 'تمرين الحشرة الميتة لاستقرار الكور والبطن', sets: 3, reps: '15 - 20', rest: '60 ثانية' }
      ]
    }
  ];

  // Cardio & Daily Physical Activity (NEAT)
  const cardioModality = program?.cardio?.modality 
    || program?.cardio_protocol?.modality 
    || 'مشي على سير مائل (Incline Treadmill)';
  const cardioWeeklySessions = program?.cardio?.weekly_sessions 
    || program?.cardio_protocol?.weekly_sessions 
    || 3;
  const cardioDuration = program?.cardio?.session_duration_min 
    || program?.cardio_protocol?.duration_minutes 
    || 30;
  const cardioHeartRate = program?.cardio?.heart_rate_target?.range_display
    || program?.cardio?.target_heart_rate_zone 
    || program?.cardio_protocol?.target_heart_rate_zone 
    || '120 - 135 نبضة / دقيقة (Zone 2)';
  const cardioNeatSteps = program?.cardio?.neat_target?.range_display
    || program?.cardio?.neat_target_steps 
    || program?.cardio?.daily_steps 
    || program?.cardio?.target_daily_steps 
    || 8500;

  // Prescribed Daily Supplements Protocol
  const supplementsList = (Array.isArray(program?.cardio?.supplements) && program.cardio.supplements.length > 0)
    ? program.cardio.supplements
    : ((Array.isArray(program?.supplements) && program.supplements.length > 0)
        ? program.supplements
        : [
            { name: 'الكرياتين مونوهيدرات (Creatine Monohydrate)', dosage: '5 جم يومياً', timing: 'بعد التمرين أو مع الوجبة الأولى', purpose: 'زيادة القوة العضلية وتخليق الـ ATP' },
            { name: 'أوميجا 3 عالي التركيز (Omega-3 Fish Oil)', dosage: '1000 - 2000 مجم EPA/DHA', timing: 'مع وجبة الغداء أو العشاء', purpose: 'صحة المفاصل وتخفيف الالتهاب' },
            { name: 'فيتامين D3 + K2 (MK-7)', dosage: '5000 وحدة دولية', timing: 'صباحاً مع وجبة غنية بالدهون', purpose: 'دعم العظام والمناعة والتستوستيرون' },
            { name: 'مغنيسيوم بيسجلايسينات (Magnesium Glycinate)', dosage: '300 - 400 مجم', timing: 'قبل النوم بـ 45 دقيقة', purpose: 'استرخاء العضلات وجودة النوم العميق' }
          ]);

  // Divide sessions into chunks of 2 per page for ultra-spacious, premium full-width rendering
  const sessionChunks = [];
  for (let i = 0; i < rawSessions.length; i += 2) {
    sessionChunks.push(rawSessions.slice(i, i + 2));
  }

  // Total pages: Page 1 (Nutrition) + Session Pages (usually 2) + Final Page (Periodization & Swaps) = 4 pages
  const totalPages = 2 + sessionChunks.length;

  return (
    <div className="pdf-view-wrapper" dir="rtl">
      
      {/* Non-Printable Floating Action Bar */}
      <div 
        className="no-print" 
        style={{ 
          width: 'calc(100% - 32px)',
          maxWidth: '210mm', 
          margin: '0 auto 20px auto', 
          background: '#FFFFFF',
          border: '1px solid #EAECF0',
          borderRadius: '12px',
          padding: '12px 20px',
          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#673DE6', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', flexShrink: 0 }}>
            Z
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
              وثيقة البرنامج المعتمدة (نسخة A4 فاخرة - {totalPages} صفحات)
            </h2>
            <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '2px' }}>
              المشترك: <strong style={{ color: '#0F172A' }}>{clientName}</strong> (كود: #{clientCode})
            </div>
          </div>
        </div>

        <button 
          type="button" 
          onClick={handlePrint}
          style={{ 
            background: '#673DE6', 
            color: '#FFFFFF',
            border: 'none', 
            borderRadius: '8px',
            padding: '10px 22px', 
            fontSize: '0.86rem', 
            fontWeight: 800, 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.28)',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(2, 132, 199, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(2, 132, 199, 0.28)';
          }}
        >
          <Printer size={16} />
          <span>طباعة / حفظ كملف PDF ({totalPages} صفحات)</span>
        </button>
      </div>

      {/* Embedded Master PDF Stylesheet */}
      <style>{CSS_STYLES}</style>

      {/* =========================================================================
          PAGE 1: الغلاف، الملف الفسيولوجي، الماكروز، وجدول الوجبات
          ========================================================================= */}
      <div className="pdf-page-container" id="page-1">
        <div>
          {/* Running Header */}
          <div className="running-header">
            <span>منظومة {brandTitle} التدريبية والتغذوية</span>
            <span className="nowrap">كود المشترك: #{clientCode}</span>
          </div>

          {/* Master Executive Cover Header */}
          <div style={{ textAlign: 'center', margin: '2px 0 8px 0', borderBottom: '1.5pt solid #0F172A', paddingBottom: '6px' }}>
            <span style={{ fontSize: '7.5pt', fontWeight: '800', letterSpacing: '1px', color: '#0284C7' }}>
              البروتوكول الرياضي والغذائي المتكامل
            </span>
            <h1 style={{ fontSize: '15pt', fontWeight: '900', color: '#0F172A', margin: '2px 0 2px 0' }}>
              برنامج الإعداد الرياضي والتغذوي المخصص
            </h1>
            <p style={{ fontSize: '8pt', color: '#475569', margin: 0 }}>
              تصميم وإشراف الكوتش: <strong>كابتن {coachName}</strong> — منظومة {brandTitle}
            </p>
          </div>

          {/* Identification Metadata Grid - Centered cells */}
          <table className="pdf-table pdf-table-center" style={{ marginBottom: '8px' }}>
            <tbody>
              <tr>
                <th style={{ width: '18%', textAlign: 'center' }}>اسم المتدرب</th>
                <td style={{ width: '32%', fontWeight: '700', textAlign: 'center' }}>{clientName}</td>
                <th style={{ width: '18%', textAlign: 'center' }}>كود المشترك</th>
                <td style={{ width: '32%', fontWeight: '700', color: '#0284C7', textAlign: 'center' }} className="nowrap">
                  <span dir="ltr">#{clientCode}</span>
                </td>
              </tr>
              <tr>
                <th style={{ textAlign: 'center' }}>نوع الباقة</th>
                <td style={{ fontWeight: '600', textAlign: 'center' }}>{packageTier}</td>
                <th style={{ textAlign: 'center' }}>الهدف المعتمد</th>
                <td style={{ fontWeight: '700', color: '#0284C7', textAlign: 'center' }}>{primaryGoal}</td>
              </tr>
              {fastingProfile && (fastingProfile.isCoptic || fastingProfile.isRamadan || fastingProfile.isIntermittent) && (
                <tr>
                  <th style={{ textAlign: 'center' }}>بروتوكول الصيام</th>
                  <td colSpan="3" style={{ fontWeight: '700', color: fastingProfile.isCoptic ? '#6D28D9' : (fastingProfile.isRamadan ? '#B45309' : '#0284C7'), textAlign: 'center' }}>
                    {fastingProfile.isCoptic
                      ? (fastingProfile.christianFastingStyle === 'STRICT_VEGAN' ? 'صيام مسيحي (نباتي بدون سمك)' : 'صيام مسيحي (مع مأكولات بحرية)')
                      : (fastingProfile.isRamadan
                          ? 'صيام رمضان المبارك (إفطار وسحور)'
                          : `صيام متقطع (${fastingProfile.intermittentBadge?.label || '16/8'})`)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 1. Physiological Profile Table - All Centered in One Unified Table */}
          <div className="section-title">1. القياسات ومؤشرات القوام</div>
          <table className="pdf-table pdf-table-center" style={{ marginBottom: '8px' }}>
            <thead>
              <tr>
                <th style={{ width: '15%', textAlign: 'center' }}>الطول</th>
                <th style={{ width: '15%', textAlign: 'center' }}>الوزن الحالي</th>
                <th style={{ width: '15%', textAlign: 'center' }}>نسبة الدهون</th>
                <th style={{ width: '15%', textAlign: 'center' }}>كتلة الجسم (BMI)</th>
                <th style={{ width: '13%', textAlign: 'center' }}>محيط الخصر</th>
                <th style={{ width: '14%', textAlign: 'center' }}>محيط الحوض</th>
                <th style={{ width: '13%', textAlign: 'center' }}>محيط الرقبة</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ fontWeight: '700' }}>
                <td style={{ textAlign: 'center' }} className="nowrap">{heightCm} سم</td>
                <td style={{ textAlign: 'center' }} className="nowrap">{weightKg} كجم</td>
                <td style={{ textAlign: 'center', color: '#0284C7' }} className="nowrap">{bodyFat}</td>
                <td style={{ textAlign: 'center' }} className="nowrap">{bmi}</td>
                <td style={{ textAlign: 'center' }} className="nowrap">{waistCm} سم</td>
                <td style={{ textAlign: 'center' }} className="nowrap">{hipsCm} سم</td>
                <td style={{ textAlign: 'center' }} className="nowrap">{neckCm} سم</td>
              </tr>
            </tbody>
          </table>

          {/* 2. Daily Energy & Macronutrient Breakdown (4 Clean KPI Boxes) */}
          <div className="section-title">2. مصفوفة الطاقة والماكروز اليومية</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
            
            {/* Calories */}
            <div className="pdf-card" style={{ textAlign: 'center', borderTop: '2.5pt solid #0F172A', padding: '8px 6px', margin: 0 }}>
              <span style={{ fontSize: '7.5pt', fontWeight: '700', color: '#475569' }}>السعرات اليومية</span>
              <div style={{ fontSize: '14pt', fontWeight: '900', color: '#0F172A', margin: '3px 0' }} className="nowrap">
                {targetCalories}
              </div>
              <small style={{ fontSize: '7pt', color: '#64748B', fontWeight: '600' }} className="nowrap">سعرة / اليوم</small>
            </div>

            {/* Protein */}
            <div className="pdf-card" style={{ textAlign: 'center', borderTop: '2.5pt solid #0284C7', padding: '8px 6px', margin: 0 }}>
              <span style={{ fontSize: '7.5pt', fontWeight: '700', color: '#0284C7' }}>البروتين الصافي</span>
              <div style={{ fontSize: '14pt', fontWeight: '900', color: '#0284C7', margin: '3px 0' }} className="nowrap">
                {proteinG} جم
              </div>
              <small style={{ fontSize: '7pt', color: '#64748B', fontWeight: '600' }} className="nowrap">بناء واستشفاء</small>
            </div>

            {/* Carbs */}
            <div className="pdf-card" style={{ textAlign: 'center', borderTop: '2.5pt solid #D97706', padding: '8px 6px', margin: 0 }}>
              <span style={{ fontSize: '7.5pt', fontWeight: '700', color: '#D97706' }}>الكربوهيدرات</span>
              <div style={{ fontSize: '14pt', fontWeight: '900', color: '#D97706', margin: '3px 0' }} className="nowrap">
                {carbsG} جم
              </div>
              <small style={{ fontSize: '7pt', color: '#64748B', fontWeight: '600' }} className="nowrap">طاقة وأداء عضلي</small>
            </div>

            {/* Fats */}
            <div className="pdf-card" style={{ textAlign: 'center', borderTop: '2.5pt solid #10B981', padding: '8px 6px', margin: 0 }}>
              <span style={{ fontSize: '7.5pt', fontWeight: '700', color: '#10B981' }}>الدهون الصحية</span>
              <div style={{ fontSize: '14pt', fontWeight: '900', color: '#10B981', margin: '3px 0' }} className="nowrap">
                {fatsG} جم
              </div>
              <small style={{ fontSize: '7pt', color: '#64748B', fontWeight: '600' }} className="nowrap">توازن هرموني</small>
            </div>

          </div>

          {/* Hydration Banner - Centered content */}
          <div className="pdf-card" style={{ background: '#F0F9FF', borderColor: '#BAE6FD', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '5px 10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '8pt', fontWeight: '700', color: '#0369A1' }}>معدل الترطيب واستهلاك الماء اليومي المستهدف:</span>
            <span style={{ fontSize: '9pt', fontWeight: '800', color: '#0284C7' }} className="nowrap">{hydrationLiters}</span>
          </div>

          {/* 3. Structured Meals Protocol */}
          <div className="section-title">3. البروتوكول الغذائي وتوزيع الوجبات اليومية</div>
          
          {fastingProfile && (fastingProfile.isCoptic || fastingProfile.isRamadan || fastingProfile.isIntermittent) && (
            <div className="pdf-card" style={{ background: '#FFFBEB', borderRight: '3pt solid #D97706', borderColor: '#FDE68A', marginBottom: '6px', fontSize: '7.5pt', lineHeight: '1.4', padding: '5px 8px' }}>
              <strong style={{ color: '#B45309' }}>توجيه نمط وجدولة الصيام: </strong>
              <span style={{ color: '#78350F' }}>
                مواعيد الوجبات موزعة بدقة بين الإفطار والسحور مع تركيز النشويات حول جلسة التمرين لضمان أعلى طاقة واستشفاء.
              </span>
            </div>
          )}

          {/* Meals Table with Centered Macro Columns */}
          <table className="pdf-table" style={{ marginBottom: '8px' }}>
            <thead>
              <tr>
                <th style={{ width: '16%', textAlign: 'center' }}>الوجبة</th>
                <th style={{ width: '52%', textAlign: 'right' }}>المكونات والمقادير الدقيقة</th>
                <th style={{ width: '8%', textAlign: 'center' }}>بروتين</th>
                <th style={{ width: '8%', textAlign: 'center' }}>كارب</th>
                <th style={{ width: '8%', textAlign: 'center' }}>دهون</th>
                <th style={{ width: '8%', textAlign: 'center' }}>السعرات</th>
              </tr>
            </thead>
            <tbody>
              {meals.map((meal, mIdx) => (
                <tr key={mIdx}>
                  <td style={{ fontWeight: '700', color: '#0F172A', fontSize: '7.5pt', textAlign: 'center' }} className="nowrap">
                    {meal.meal_name_ar || `الوجبة ${mIdx + 1}`}
                  </td>
                  <td style={{ fontSize: '7.5pt', lineHeight: '1.5' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 6px', alignItems: 'center' }}>
                      {meal.items?.map((it, iIdx) => {
                        const meta = getItemPortionMeta(it);
                        return (
                          <span key={iIdx} style={{ background: '#F8FAFC', border: '0.5pt solid #E2E8F0', borderRadius: '6px', padding: '1px 5px', fontSize: '7pt', color: '#334155' }}>
                            <strong style={{ color: '#0284C7' }}>{meta.badge_text}</strong> {meta.name || it.name_ar || it.name}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '700', color: '#0284C7', fontSize: '7.5pt' }} className="nowrap">{meal.protein_g ?? meal.p ?? 35} جم</td>
                  <td style={{ textAlign: 'center', fontWeight: '700', color: '#D97706', fontSize: '7.5pt' }} className="nowrap">{meal.carbs_g ?? meal.c ?? 45} جم</td>
                  <td style={{ textAlign: 'center', fontWeight: '700', color: '#10B981', fontSize: '7.5pt' }} className="nowrap">{meal.fat_g ?? meal.f ?? 12} جم</td>
                  <td style={{ textAlign: 'center', fontWeight: '800', color: '#0F172A', fontSize: '7.5pt' }} className="nowrap">{meal.meal_energy_kcal ?? meal.cal ?? 450}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Culinary Guidelines Box */}
          <div className="section-title">4. إرشادات التحضير وقواعد الطهي الصحي</div>
          <div className="pdf-card" style={{ fontSize: '7.5pt', lineHeight: '1.5', margin: 0, padding: '6px 10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div>
                <strong style={{ color: '#0F172A' }}>• وزن الأغذية بعد الطهي:</strong> كافة أوزان البروتينات (دجاج، لحم، سمك) والنشويات (أرز، بطاطس) في جدولك موزونة بعد الطهي وجاهزة للأكل ما لم يُذكر غير ذلك.
              </div>
              <div>
                <strong style={{ color: '#0F172A' }}>• الزيوت والدهون:</strong> زيت الزيتون وزبدة المكسرات تقاس بالملعقة المعيارية بدقة دون سكب عشوائي لتفادي السعرات الخفية.
              </div>
              <div>
                <strong style={{ color: '#0F172A' }}>• الورقيات والمشروبات:</strong> الورقيات الخضراء والخيار حرة، والقهوة والشاي تُشرب بدون سكر أو بمحلي ستيفيا، مع الالتزام بمعدل الماء اليومي.
              </div>
            </div>
          </div>
        </div>

        {/* Running Footer */}
        <div className="running-footer">
          <span>وثيقة تدريبية رسمية ومعتمدة — منظومة {brandTitle}</span>
          <span className="nowrap">الصفحة 1 من {totalPages}</span>
        </div>
      </div>

      {/* =========================================================================
          PAGES 2 & 3: الحصص التدريبية الميدانية (بعرض الصفحة الكامل 100% وبدون أي تكدس)
          ========================================================================= */}
      {sessionChunks.map((chunk, cIdx) => (
        <div className="pdf-page-container" id={`page-sessions-${cIdx + 1}`} key={`chunk-${cIdx}`}>
          <div>
            {/* Running Header */}
            <div className="running-header">
              <span>منظومة {brandTitle} التدريبية — الخطة الميدانية المعتمدة (جزء {cIdx + 1} من {sessionChunks.length})</span>
              <span className="nowrap">كود المشترك: #{clientCode}</span>
            </div>

            {/* Sleek Minimalist Training Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1.5pt solid #0284C7' }}>
              <div>
                <span style={{ fontSize: '9pt', fontWeight: '900', color: '#0F172A' }}>
                  البرنامج التدريبي الميداني وتوزيع الحصص الأسبوعية
                </span>
                <span style={{ fontSize: '7pt', color: '#64748B', marginRight: '8px' }}>
                  (نظام Push / Pull / Legs — زيادة التوتر الميكانيكي والبناء العضلي)
                </span>
              </div>
              <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '6px', fontSize: '7pt', fontWeight: '800' }}>
                {rawSessions.length} حصص أسبوعية
              </span>
            </div>

            {/* Render 2 Full-Width Sessions per Page with Centered Columns */}
            {chunk.map((session, sIdx) => (
              <div key={sIdx} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '8.5pt', fontWeight: '800', color: '#0F172A', marginBottom: '4px', background: '#F1F5F9', padding: '4px 8px', borderRadius: '6px', borderRight: '2.5pt solid #0284C7' }}>
                  {session.session_name || `الحصة التدريبية ${cIdx * 2 + sIdx + 1}`}
                </div>
                {session.is_rest_day ? (
                  <div style={{ padding: '14px 18px', background: '#F0FDF4', border: '0.5pt solid #BBF7D0', borderRadius: '8px', textAlign: 'center', margin: '4px 0 8px 0' }}>
                    <div style={{ fontWeight: '800', color: '#166534', fontSize: '9pt', marginBottom: '4px' }}>
                      يوم راحة واستشفاء عضلي نشط
                    </div>
                    <div style={{ color: '#15803D', fontSize: '7.5pt', lineHeight: '1.5' }}>
                      {session.recovery_guideline_ar || 'يوم مخصص لتعافي الألياف العضلية وتجديد طاقة الجهاز العصبي ومخازن الجليكوجين. احرص على شرب 3-4 لتر ماء والمشي الخفيف 6000-8000 خطوة مع النوم الكافي.'}
                    </div>
                  </div>
                ) : (
                  <table className="pdf-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '42%', textAlign: 'right' }}>التمرين وتوجيه التكنيك</th>
                      <th style={{ width: '20%', textAlign: 'center' }}>العضلة المستهدفة</th>
                      <th style={{ width: '12%', textAlign: 'center' }}>المجموعات</th>
                      <th style={{ width: '13%', textAlign: 'center' }}>العدات والشدة</th>
                      <th style={{ width: '13%', textAlign: 'center' }}>الراحة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.exercises?.map((ex, eIdx) => {
                      const exNames = getExerciseDisplayNames(ex);
                      const targetMuscle = resolveExerciseMuscleName(ex);
                      const altExercise = resolveExerciseAlternative(ex);
                      const rirLabel = ex.target_rir != null ? `RIR ${ex.target_rir}` : (ex.rir != null ? `RIR ${ex.rir}` : 'RIR 1-2');
                      return (
                        <tr key={eIdx}>
                          <td style={{ textAlign: 'right' }}>
                            <strong style={{ display: 'block', fontSize: '7.8pt', fontWeight: '800', color: '#0F172A', direction: 'ltr', textAlign: 'right' }}>
                              {exNames.nameEn}
                            </strong>
                            <span style={{ fontSize: '6.8pt', color: '#475569', display: 'block', marginTop: '1px' }}>
                              {exNames.nameAr}
                            </span>
                            {altExercise && (
                              <div style={{ fontSize: '6.2pt', color: '#0369A1', marginTop: '2px', background: '#F0F9FF', border: '0.5pt solid #BAE6FD', borderRadius: '4px', padding: '1px 5px', display: 'inline-block' }}>
                                <span style={{ fontWeight: '800' }}>بديل زحمة الجيم: </span>
                                <span>{altExercise}</span>
                              </div>
                            )}
                          </td>
                          <td style={{ color: '#0369A1', fontWeight: '700', fontSize: '7.5pt', textAlign: 'center' }}>
                            {targetMuscle}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '700', fontSize: '8pt' }} className="nowrap">
                            {ex.sets || 3}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: '700', fontSize: '7.5pt', color: '#0F172A' }} className="nowrap">
                            <div>{ex.reps || '8 - 10'}</div>
                            <div style={{ fontSize: '6.3pt', color: '#0284C7', fontWeight: '800', marginTop: '1px' }}>
                              {rirLabel}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center', color: '#64748B', fontSize: '7.2pt' }} className="nowrap">
                            {ex.rest || '75 ثانية'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                )}

                {!session.is_rest_day && ((Array.isArray(session.pre_workout_mobility) && session.pre_workout_mobility.length > 0) ||
                  (Array.isArray(session.post_workout_stretches) && session.post_workout_stretches.length > 0)) && (
                  <div style={{
                    marginTop: '6px',
                    padding: '6px 10px',
                    background: '#F8FAFC',
                    border: '0.5pt solid #E2E8F0',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    fontSize: '6.8pt'
                  }}>
                    {Array.isArray(session.pre_workout_mobility) && session.pre_workout_mobility.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '800', color: '#0284C7', background: '#F0F9FF', border: '0.5pt solid #BAE6FD', padding: '1px 6px', borderRadius: '4px' }}>
                          الإحماء الحركي الديناميكي:
                        </span>
                        {session.pre_workout_mobility.map((m, mIdx) => (
                          <span key={mIdx} style={{ color: '#334155' }}>
                            {m.name_ar || m.name || m.name_en} ({m.dose || m.reps || '8-10 تكرارات'}){mIdx < session.pre_workout_mobility.length - 1 ? ' • ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    {Array.isArray(session.post_workout_stretches) && session.post_workout_stretches.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '800', color: '#0F766E', background: '#F0FDFA', border: '0.5pt solid #CCFBF1', padding: '1px 6px', borderRadius: '4px' }}>
                          التهدئة والإطالة الاستشفائية:
                        </span>
                        {session.post_workout_stretches.map((s, sIdx) => (
                          <span key={sIdx} style={{ color: '#334155' }}>
                            {s.name_ar || s.name || s.name_en} ({s.duration_seconds ? `${s.duration_seconds} ثانية` : (s.dose || '30 ثانية')}){sIdx < session.post_workout_stretches.length - 1 ? ' • ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Running Footer */}
          <div className="running-footer">
            <span>وثيقة تدريبية رسمية ومعتمدة — منظومة {brandTitle}</span>
            <span className="nowrap">الصفحة {2 + cIdx} من {totalPages}</span>
          </div>
        </div>
      ))}

      {/* =========================================================================
          PAGE 4: مصفوفة تدرج الأحمال + البدائل الذكية + الكارديو + الاعتماد الرسمي
          ========================================================================= */}
      <div className="pdf-page-container" id="page-final">
        <div>
          {/* Running Header */}
          <div className="running-header">
            <span>منظومة {brandTitle} التدريبية — دليل تدرج الأحمال والاستشفاء</span>
            <span className="nowrap">كود المشترك: #{clientCode}</span>
          </div>

          {/* 5. Periodization Schedule Matrix (Spacious & Clean with Centered Cells) */}
          <div className="section-title">5. مصفوفة التدرج الدوري للأحمال (خطة دورة الـ 5 أسابيع الميدانية)</div>
          <table className="pdf-table pdf-table-center" style={{ marginBottom: '12px' }}>
            <thead>
              <tr>
                <th style={{ width: '16%', textAlign: 'center' }}>الأسبوع التدريبي</th>
                <th style={{ width: '24%', textAlign: 'center' }}>المرحلة والهدف الحركي</th>
                <th style={{ width: '16%', textAlign: 'center' }}>حجم المجموعات</th>
                <th style={{ width: '16%', textAlign: 'center' }}>معدل الاحتياط (RIR)</th>
                <th style={{ width: '28%', textAlign: 'center' }}>التوجيه الفني والتطبيقي</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>الأسبوع 1</td>
                <td style={{ fontWeight: '600', color: '#0284C7', textAlign: 'center' }}>التأسيس والتكيف الحركي</td>
                <td style={{ textAlign: 'center', fontWeight: '700' }} className="nowrap">3 مجموعات</td>
                <td style={{ textAlign: 'center', fontWeight: '800', color: '#0284C7' }} className="nowrap">RIR 3</td>
                <td style={{ textAlign: 'center' }}>التعود على مسار الحركة وضبط الأوزان الابتدائية بدقة.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>الأسبوع 2</td>
                <td style={{ fontWeight: '600', color: '#0284C7', textAlign: 'center' }}>التحميل التدريجي (Overload)</td>
                <td style={{ textAlign: 'center', fontWeight: '700' }} className="nowrap">3 مجموعات</td>
                <td style={{ textAlign: 'center', fontWeight: '800', color: '#0284C7' }} className="nowrap">RIR 2</td>
                <td style={{ textAlign: 'center' }}>زيادة الحمل الخطي تدريجياً مع إبقاء تكرارين في الاحتياط.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>الأسبوع 3</td>
                <td style={{ fontWeight: '600', color: '#D97706', textAlign: 'center' }}>التكثيف والضغط العضلي</td>
                <td style={{ textAlign: 'center', fontWeight: '700', color: '#D97706' }} className="nowrap">4 مجموعات (+1)</td>
                <td style={{ textAlign: 'center', fontWeight: '800', color: '#D97706' }} className="nowrap">RIR 1</td>
                <td style={{ textAlign: 'center' }}>إضافة مجموعة عمل لكل حركة أساسية والاقتراب من الفشل العضلي.</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>الأسبوع 4</td>
                <td style={{ fontWeight: '600', color: '#DC2626', textAlign: 'center' }}>ذروة الأداء (Peak Phase)</td>
                <td style={{ textAlign: 'center', fontWeight: '700', color: '#DC2626' }} className="nowrap">4 مجموعات</td>
                <td style={{ textAlign: 'center', fontWeight: '800', color: '#DC2626' }} className="nowrap">RIR 0 - 1</td>
                <td style={{ textAlign: 'center' }}>الوصول لأقصى أداء ممكن وبذل أعلى طاقة عضلية قبل الاستشفاء.</td>
              </tr>
              <tr style={{ background: '#F0FDF4' }}>
                <td style={{ fontWeight: '700', color: '#166534', textAlign: 'center' }}>الأسبوع 5 (ديلود)</td>
                <td style={{ fontWeight: '600', color: '#166534', textAlign: 'center' }}>أسبوع كسر الإجهاد والاستشفاء</td>
                <td style={{ textAlign: 'center', fontWeight: '700', color: '#166534' }} className="nowrap">مجموعتان (-40%)</td>
                <td style={{ textAlign: 'center', fontWeight: '800', color: '#166534' }} className="nowrap">RIR 3 - 4</td>
                <td style={{ textAlign: 'center' }}>تخفيض الحجم التدريبي لتجديد الجهاز العصبي والمفاصل والأوتار.</td>
              </tr>
            </tbody>
          </table>

          {/* 6. Smart Food Swaps Table */}
          <div className="section-title">6. جدول المبادلات الغذائية الفورية (أوزان متكافئة بعد الطهي)</div>
          <table className="pdf-table" style={{ marginBottom: '8px' }}>
            <thead>
              <tr>
                <th style={{ width: '28%', textAlign: 'center' }}>الصنف الأساسي (موزون بعد الطهي)</th>
                <th style={{ width: '72%', textAlign: 'right' }}>الخيارات البديلة المكافئة لنفس السعرات والماكروز</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>100 جم صدور دجاج مشوية</td>
                <td style={{ fontSize: '7pt', lineHeight: '1.6' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 6px', alignItems: 'center' }}>
                    <span style={{ background: '#F8FAFC', border: '0.5pt solid #E2E8F0', borderRadius: '4px', padding: '1px 5px' }}>125 جم سمك فيليه مشوي</span>
                    <span style={{ background: '#F8FAFC', border: '0.5pt solid #E2E8F0', borderRadius: '4px', padding: '1px 5px' }}>110 جم لحم بقري صافي (5% دهون)</span>
                    <span style={{ background: '#F8FAFC', border: '0.5pt solid #E2E8F0', borderRadius: '4px', padding: '1px 5px' }}>130 جم جمبري مشوي</span>
                    <span style={{ background: '#F8FAFC', border: '0.5pt solid #E2E8F0', borderRadius: '4px', padding: '1px 5px' }}>130 جم تونة مصفاة بالماء</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>100 جم أرز بسمتي مطبوخ</td>
                <td style={{ fontSize: '7pt', lineHeight: '1.6' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 6px', alignItems: 'center' }}>
                    <span style={{ background: '#F8FAFC', border: '0.5pt solid #E2E8F0', borderRadius: '4px', padding: '1px 5px' }}>110 جم بطاطس مسلوقة/مشوية</span>
                    <span style={{ background: '#F8FAFC', border: '0.5pt solid #E2E8F0', borderRadius: '4px', padding: '1px 5px' }}>100 جم بطاطا حلوة مشوية</span>
                    <span style={{ background: '#F8FAFC', border: '0.5pt solid #E2E8F0', borderRadius: '4px', padding: '1px 5px' }}>35 جم شوفان كامل الحبة خام</span>
                    <span style={{ background: '#F8FAFC', border: '0.5pt solid #E2E8F0', borderRadius: '4px', padding: '1px 5px' }}>2 شريحة خبز توست بني حبوب كاملة</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>100 جم جبن قريش طبيعي</td>
                <td style={{ fontSize: '7pt', lineHeight: '1.6' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 6px', alignItems: 'center' }}>
                    <span style={{ background: '#F8FAFC', border: '0.5pt solid #E2E8F0', borderRadius: '4px', padding: '1px 5px' }}>120 جم زبادي يوناني 0% دسم</span>
                    <span style={{ background: '#F8FAFC', border: '0.5pt solid #E2E8F0', borderRadius: '4px', padding: '1px 5px' }}>4 بياض بيض كبير</span>
                    <span style={{ background: '#F8FAFC', border: '0.5pt solid #E2E8F0', borderRadius: '4px', padding: '1px 5px' }}>1 مكيال واي بروتين أيزوليت (25 جم)</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>10 جم زيت زيتون بكر</td>
                <td style={{ fontSize: '7pt', lineHeight: '1.6' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 6px', alignItems: 'center' }}>
                    <span style={{ background: '#F8FAFC', border: '0.5pt solid #E2E8F0', borderRadius: '4px', padding: '1px 5px' }}>15 جم زبدة فول سوداني طبيعية 100%</span>
                    <span style={{ background: '#F8FAFC', border: '0.5pt solid #E2E8F0', borderRadius: '4px', padding: '1px 5px' }}>40 جم أفوكادو طازج</span>
                    <span style={{ background: '#F8FAFC', border: '0.5pt solid #E2E8F0', borderRadius: '4px', padding: '1px 5px' }}>15 جم مكسرات نيئة (لوز أو جوز)</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 7. Zone 2 Cardio & NEAT Protocol */}
          <div className="section-title">7. بروتوكول كارديو حرق الدهون والنشاط الحركي اليومي (Zone 2 & NEAT)</div>
          <div className="pdf-card" style={{ background: '#F8FAFC', borderColor: '#BAE6FD', padding: '6px 10px', marginBottom: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '6.8pt', color: '#64748B', display: 'block' }}>النشاط الموصى به</span>
                <strong style={{ fontSize: '7.2pt', color: '#0F172A' }}>{cardioModality}</strong>
              </div>
              <div>
                <span style={{ fontSize: '6.8pt', color: '#64748B', display: 'block' }}>التكرار الأسبوعي</span>
                <strong style={{ fontSize: '7.2pt', color: '#0284C7' }} className="nowrap">{cardioWeeklySessions} جلسات</strong>
              </div>
              <div>
                <span style={{ fontSize: '6.8pt', color: '#64748B', display: 'block' }}>المدة لكل جلسة</span>
                <strong style={{ fontSize: '7.2pt', color: '#0F172A' }} className="nowrap">{cardioDuration} دقيقة</strong>
              </div>
              <div>
                <span style={{ fontSize: '6.8pt', color: '#64748B', display: 'block' }}>النبض المستهدف</span>
                <strong style={{ fontSize: '7.2pt', color: '#16A34A' }} className="nowrap">{cardioHeartRate}</strong>
              </div>
              <div>
                <span style={{ fontSize: '6.8pt', color: '#64748B', display: 'block' }}>النشاط اليومي (NEAT)</span>
                <strong style={{ fontSize: '7.2pt', color: '#0284C7' }} className="nowrap">{Number(cardioNeatSteps).toLocaleString()} خطوة / اليوم</strong>
              </div>
            </div>
          </div>

          {/* 8. Prescribed Daily Supplements Table */}
          <div className="section-title">8. بروتوكول المكملات الغذائية اليومية المعتمدة</div>
          <table className="pdf-table" style={{ marginBottom: '8px' }}>
            <thead>
              <tr>
                <th style={{ width: '30%', textAlign: 'right' }}>المكمل الغذائي</th>
                <th style={{ width: '20%', textAlign: 'center' }}>الجرعة اليومية</th>
                <th style={{ width: '25%', textAlign: 'center' }}>توقيت التناول المثالي</th>
                <th style={{ width: '25%', textAlign: 'center' }}>الهدف الفسيولوجي والاستشفاء</th>
              </tr>
            </thead>
            <tbody>
              {supplementsList.map((sup, sIdx) => {
                const sName = typeof sup === 'string' ? sup : (sup.name_ar || sup.name || sup.code);
                const sDose = sup.dosage || sup.dose || sup.standard_dosage || 'جرعة يومية منتظمة';
                const sTiming = sup.timing || sup.time || 'مع إحدى الوجبات الرئيسية';
                const sPurpose = sup.purpose || sup.notes || sup.category || 'دعم البناء والاستشفاء العضلي';
                return (
                  <tr key={sIdx}>
                    <td style={{ fontWeight: '700', color: '#0F172A', fontSize: '7pt', textAlign: 'right' }}>
                      {sName}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '700', color: '#0284C7', fontSize: '7pt' }} className="nowrap">
                      {sDose}
                    </td>
                    <td style={{ textAlign: 'center', color: '#475569', fontSize: '7pt' }}>
                      {sTiming}
                    </td>
                    <td style={{ textAlign: 'center', color: '#64748B', fontSize: '7pt' }}>
                      {sPurpose}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 9. Practical Tips & Official Sign-off Box */}
          <div className="section-title">9. القواعد الذهبية للاستمرار واعتماد المدرب الرسمي</div>
          <div className="pdf-card" style={{ fontSize: '7.2pt', lineHeight: '1.5', margin: 0, padding: '6px 10px', background: '#F8FAFC', border: '1pt solid #CBD5E1' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '6px', paddingBottom: '6px', borderBottom: '0.5pt solid #E2E8F0' }}>
              <div>
                <strong style={{ color: '#0F172A' }}>• الالتزام بالـ RIR والأوزان:</strong> إتقان المسار الحركي أولاً ثم التحميل التدريجي دون الوصول للفشل العشوائي لحماية الأعصاب والمفاصل.
              </div>
              <div>
                <strong style={{ color: '#0F172A' }}>• ثبات النوم والاستشفاء:</strong> النوم العميق من 7 إلى 8 ساعات يومياً مع إيقاف المنبهات قبل النوم بـ 6-8 ساعات لضمان أعلى إفراز لهرمون النمو.
              </div>
              <div>
                <strong style={{ color: '#0F172A' }}>• الدقة التغذوية:</strong> وزن الأطعمة بالميزان الرقمي بعد الطهي مع شرب الماء الكافي يضمن بقاءك في المسار المحسوب بالمللي.
              </div>
            </div>

            {coachNotes && (
              <div style={{ background: '#F0F9FF', border: '0.5pt solid #BAE6FD', borderRadius: '6px', padding: '4px 8px', marginBottom: '6px' }}>
                <span style={{ fontWeight: '800', color: '#0369A1' }}>توجيهات الكوتش الخاصة: </span>
                <span style={{ color: '#0F172A' }}>{coachNotes}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '8pt', fontWeight: '900', color: '#0F172A' }}>
                  اعتماد المشرف الرياضي والتغذوي المباشر: كابتن <strong>{coachName}</strong>
                </div>
                <div style={{ fontSize: '6.8pt', color: '#64748B', marginTop: '1px' }}>
                  كبير المدربين ومؤسس منظومة {brandTitle} — وثيقة رسمية مخصصة ومعتمدة
                </div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'inline-block', background: '#E0F2FE', border: '1px solid #BAE6FD', color: '#0284C7', padding: '3px 8px', borderRadius: '6px', fontSize: '7pt', fontWeight: '800' }}>
                  معتمد وموثق رقمياً (Digitally Approved)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Running Footer */}
        <div className="running-footer">
          <span>وثيقة تدريبية رسمية ومعتمدة — منظومة {brandTitle}</span>
          <span className="nowrap">الصفحة {totalPages} من {totalPages}</span>
        </div>
      </div>

    </div>
  );
}
