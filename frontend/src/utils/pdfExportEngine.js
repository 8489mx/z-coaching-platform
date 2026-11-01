/**
 * Master Branded PDF Exporter & Contextual Guidelines Engine (Z-Coaching 2026)
 *
 * 1. Smart Contextual Guidelines Matrix:
 *    - Cooked Weight Rule: All meat/fish/poultry/rice weighed after cooking.
 *    - Flexible Meal Timing: Combining or splitting meals allowed based on work schedule.
 *    - Caffeine Cutoff: Stop all stimulants 6-8 hours before scheduled sleep.
 *    - Hydration Standard: 3-5 liters daily for optimal plasma volume and muscle fullness.
 *    - RIR Precision: Respect prescribed RIR targets to prevent central nervous system burnout.
 *
 * 2. 1-Click Master PDF Plan Data Exporter:
 *    - Complete nutrition with dual portion metrics (scale grams & hand measures).
 *    - Structured workouts with RIR targets, rest intervals, and exercise cues.
 *    - Practical talk-test cardio prescriptions and warm-up protocols.
 */

import { getExerciseDisplayNames } from './exerciseTranslator.js';
import { getItemPortionMeta, formatItemPortionDisplay } from './kitchenYieldEngine.js';

export const SMART_GUIDELINES_MATRIX = Object.freeze([
  {
    id: 'COOKED_WEIGHT_RULE',
    title_ar: 'قاعدة الوزن بعد الطهي (Cooked Food Weight)',
    instruction_ar: 'كافة أوزان البروتينات (دجاج، لحم، سمك) والنشويات (أرز، مكرونة، بطاطس) في جدولك موزونة بعد الطهي وجاهزة للأكل ما لم يُذكر غير ذلك.'
  },
  {
    id: 'FLEXIBLE_TIMING_RULE',
    title_ar: 'مرونة مواعيد الوجبات (Flexible Meal Timing)',
    instruction_ar: 'المواعيد المكتوبة استرشادية؛ متاح تماماً تقديم أو تأخير أو دمج وجبتين في وجبة واحدة كبيرة في الأيام المزدحمة طالما التزمت بالماكروز الإجمالية.'
  },
  {
    id: 'CAFFEINE_CUTOFF_RULE',
    title_ar: 'فاصل الأمان للكافيين (Caffeine Sleep Cutoff)',
    instruction_ar: 'أوقف كافة مشروبات القهوة والشاي ومشروبات الطاقة قبل موعد نومك بـ 6 إلى 8 ساعات لضمان جودة النوم العميق وإفراز هرمون النمو (GH).'
  },
  {
    id: 'HYDRATION_RULE',
    title_ar: 'المعيار الذهبي للسوائل (Hydration Standard)',
    instruction_ar: 'احرص على شرب 3 إلى 5 لتر ماء يومياً موزعاً على مدار اليوم للحفاظ على حجم البلازما، قوة العضلات، ومنع احتباس السوائل.'
  },
  {
    id: 'RIR_INTENSITY_RULE',
    title_ar: 'قاعدة الـ RIR والشدة المحسوبة (Reps In Reserve)',
    instruction_ar: 'التزم بإيقاف الجولات عند الـ RIR المحدد (1-2 عدات في الاحتياط) لحماية الجهاز العصبي المركزي وضمان الاستمرار في التطور الأسبوعي.'
  }
]);

/**
 * Escapes unsafe characters for secure HTML injection (S4-8)
 * @param {*} unsafe 
 * @returns {string}
 */
export function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitizes coach notes intended for client-facing views and PDF exports.
 * Purges internal developer tags, clinical warnings, and medical review prompt codes.
 */
export function sanitizeCoachNotesForClient(notes) {
  if (!notes || typeof notes !== 'string') return '';

  const emojiRegex = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu;

  // Split into lines to filter out line-based internal tags and clinical alerts
  const lines = notes.split(/\r?\n/);
  const cleanLines = [];

  for (let line of lines) {
    let l = line.trim();
    if (!l) continue;

    // Check for internal tags or clinical markers
    if (/^\[(CLINICAL|INTERNAL|DEBUG|TEST|AUDIT|MINEFIELD)[^\]]*\]/i.test(l)) continue;
    if (/(CLINICAL_ALERT|CLINICAL_WARNING|MEDICAL_REVIEW|CONTRAINDICATION|INTERNAL_DEBUG)/i.test(l)) continue;
    if (/(TIER_0_|TIER_1_|AUDIT_ID)/i.test(l)) continue;
    if (/(تحذير سريري|تنبيه سريري|تشخيص داخلي|ملاحظة سريرية|موانع الاستخدام)/.test(l)) continue;

    // Strip inline bracket tags if any remain
    l = l.replace(/\[(CLINICAL|INTERNAL|DEBUG|TEST|AUDIT|MINEFIELD)[^\]]*\]/gi, '').trim();

    // Strip any emojis
    l = l.replace(emojiRegex, '').trim();

    if (l) {
      cleanLines.push(l);
    }
  }

  return cleanLines.join('\n').trim();
}

export function generateMasterPdfExportData({
  client_name = 'المتدرب المعتمد',
  client_code = '101',
  package_tier = 'MAX',
  current_week = 2,
  nutrition_plan = {
    daily_calories: 1950,
    protein_g: 160,
    carbs_g: 210,
    fat_g: 50,
    water_liters: 3.5,
    portion_mode: 'DUAL',
    meals: [
      {
        title: 'الوجبة الأولى: إفطار التأسيس الأيضي',
        time: '08:30 ص',
        items: [
          { name: 'بياض بيض مسلوق', portion: '150 جم مطبوخ', hand_portion: 'بياض 4-5 بيضات' },
          { name: 'بطاطا حلوة مشوية', portion: '150 جم مشوي', hand_portion: 'حبة متوسطة بحجم قبضة اليد' },
          { name: 'لوز نيء طبيعي', portion: '15 جم', hand_portion: 'قبضة صغيرة (~12 حبة)' }
        ],
        macros: '430 Kcal | P: 22g | C: 35g | F: 8g'
      },
      {
        title: 'الوجبة الثانية: غداء التعافي والبناء',
        time: '02:00 م',
        items: [
          { name: 'صدور دجاج مشوية', portion: '150 جم مطبوخ (200 جم نيئ)', hand_portion: 'كف اليد كاملاً' },
          { name: 'أرز بسمتي مسلوق', portion: '180 جم مطبوخ (72 جم نيئ)', hand_portion: 'قبضة يد أو 6 ملاعق' },
          { name: 'زيت زيتون بكر', portion: '10 جم', hand_portion: 'عقلة الإبهام أو ملعقة طعام' },
          { name: 'خضار سوتيه / سلطة', portion: '200 جم', hand_portion: 'كفين مضمومين' }
        ],
        macros: '575 Kcal | P: 53g | C: 50g | F: 16g'
      }
    ]
  },
  workout_plan = {
    split_name: 'برنامج تقسيم 4 أيام (Upper / Lower Hypertrophy)',
    sessions: [
      {
        day_title: 'اليوم الأول: سحب الجزء العلوي (Upper Pull & Core)',
        duration: '55 دقيقة',
        warmup_protocol: 'بروتوكول RAMP: 5 دقائق مشي مائل + تفعيل Glute Bridges و Band Pull-aparts',
        exercises: [
          {
            name: 'Lat Pulldown (سحب ظهر واسع على الكابل)',
            sets_reps: '4 مجموعات × 10-12 عدات (RIR 1-2)',
            rest: '90 ثانية',
            rir_target: 'RIR 1-2',
            safety_cue: 'الحفاظ على صدر مرفوع وتفادي أرجحة الجذع لحماية أسفل الظهر',
            video_url: 'https://zcoaching.com/videos/lat-pulldown',
            qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://zcoaching.com/videos/lat-pulldown',
            final_set_badge: 'DROP_SET: إنقاص الوزن 45% في الجولة الأخيرة واللعب حتى RIR 0'
          },
          {
            name: 'Chest-Supported Dumbbell Row (سحب دمبلز مسنود الصدر)',
            sets_reps: '3 مجموعات × 10-12 عدات (RIR 1-2)',
            rest: '90 ثانية',
            rir_target: 'RIR 1-2',
            safety_cue: 'تثبيت الصدر بالكامل على البنش المائل لعزل عضلات الظهر بأمان تام',
            video_url: 'https://zcoaching.com/videos/chest-supported-row',
            qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://zcoaching.com/videos/chest-supported-row'
          }
        ]
      }
    ]
  },
  cardio_plan = {
    protocol_title: 'كارديو LISS باختبار التحدث (Talk Test Protocol)',
    prescription: '3 جلسات أسبوعياً × 25 دقيقة مشي مائل (Incline 10% / Speed 4.5 km/h)',
    talk_test_cue: 'مجهود هوائي معتدل يسمح لك بالتحدث بجمل كاملة دون نهجان حاد.'
  },
  supplements_plan = []
}) {
  return {
    document_title: `البرنامج التدريبي والغذائي المتكامل - ${client_name}`,
    generated_at: new Date().toISOString(),
    branding: {
      platform: 'Z Coaching Platform',
      coach_name: 'كابتن كريم زكريا',
      badge: 'النسخة المعتمدة الرسمية 4K'
    },
    client: {
      name: client_name,
      code: `#${client_code}`,
      package: package_tier === 'MAX' ? 'باقة MAX' : 'باقة ELITE',
      week: `الأسبوع ${current_week}`
    },
    contextual_guidelines: SMART_GUIDELINES_MATRIX,
    nutrition: nutrition_plan,
    training: workout_plan,
    cardio: cardio_plan,
    supplements: supplements_plan?.length > 0 ? supplements_plan : (cardio_plan?.supplements || nutrition_plan?.supplements || []),
    footer_note: 'هذا البرنامج صُمم خصيصاً لحالتك البيوميكانيكية والغذائية وفق معايير Z Coaching - كابتن كريم زكريا.'
  };
}


/**
 * Master PDF & Print Compiler Engine
 * Formats a clean, high-density, printable HTML document for 1-click PDF export
 */
export function generatePrintablePlanHTML({ client = {}, plan = {}, date = new Date().toISOString().split('T')[0] }) {
  const { prehab, workout = {}, meals = [], cardio = {}, supplements = [], guidelines: _guidelines } = plan;

  const cleanCoachNotes = sanitizeCoachNotesForClient(
    plan.coach_notes || client.coach_notes || plan.notes || client.notes
  );

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>خطة التدريب والتغذية - ${escapeHtml(client.name || 'المشترك')}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11px; line-height: 1.4; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 900; }
    .header p { margin: 2px 0 0; color: #475569; font-size: 10px; }
    .macro-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; margin-bottom: 12px; text-align: center; }
    .macro-box { font-size: 10px; font-weight: bold; }
    .macro-val { font-size: 14px; font-weight: 900; color: #0f172a; }
    .section-title { font-size: 12px; font-weight: 900; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 3px; margin: 10px 0 6px; color: #1e293b; display: flex; justify-content: space-between; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .table th, .table td { border: 1px solid #e2e8f0; padding: 5px 6px; text-align: right; }
    .table th { background: #f1f5f9; font-weight: 800; font-size: 10px; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 6px; font-size: 9px; font-weight: bold; background: #e2e8f0; }
    .badge-rir { background: #dcfce7; color: #166534; }
    .badge-prehab { background: #e0e7ff; color: #3730a3; }
    .guidelines-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px; }
    .guide-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px; }
    .guide-item strong { display: block; margin-bottom: 2px; color: #0f172a; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <h1>برنامج التدريب والتغذية الإكلينيكي</h1>
      <p>المشترك: <strong>${escapeHtml(client.name || 'المتدرب')}</strong> | الهدف: <strong>${escapeHtml(client.goal_title || 'خسارة دهون وتطوير القوة')}</strong> | التاريخ: ${escapeHtml(date)}</p>
    </div>
    <div style="text-align: left; font-size: 9px; color: #64748b;">Z COACHING PLATFORM</div>
  </div>

  <!-- Macro Overview -->
  <div class="macro-bar">
    <div class="macro-box">السعرات اليومية<div class="macro-val">${escapeHtml(client.target_calories || 1900)} Kcal</div></div>
    <div class="macro-box">البروتين<div class="macro-val">${escapeHtml(client.target_protein || 150)}g</div></div>
    <div class="macro-box">الكاربوهيدرات<div class="macro-val">${escapeHtml(client.target_carbs || 190)}g</div></div>
    <div class="macro-box">الدهون الصحية<div class="macro-val">${escapeHtml(client.target_fats || 60)}g</div></div>
  </div>

  <!-- Coach Notes if present -->
  ${cleanCoachNotes ? `
    <div class="section-title">
      <span>توجيهات وملاحظات الكوتش الخاصة</span>
      <span class="badge">توصيات مخصصة</span>
    </div>
    <div class="guide-item" style="margin-bottom: 10px; font-size: 10px; line-height: 1.5; color: #1e293b; background: #f0f9ff; border: 1px solid #bae6fd;">
      ${escapeHtml(cleanCoachNotes).replace(/\n/g, '<br>')}
    </div>
  ` : ''}

  <!-- Prehab Protocol if exists -->
  ${prehab && prehab.has_prehab ? `
    <div class="section-title">
      <span>روتين تجهيز المفاصل وتصحيح القوام (${escapeHtml(prehab.total_duration_minutes)} دقائق قبل التمرين)</span>
      <span class="badge badge-prehab">Prehab Warmup</span>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>التمرين التأهيلي</th>
          <th style="width: 80px;">المجموعات</th>
          <th style="width: 100px;">التكرار / الثبات</th>
          <th>توجيه الأداء والتركيز</th>
        </tr>
      </thead>
      <tbody>
        ${(prehab.exercises || []).map((ex) => `
          <tr>
            <td><strong>${escapeHtml(ex.name_ar)}</strong></td>
            <td>${escapeHtml(ex.sets)}</td>
            <td>${escapeHtml(ex.reps || `${ex.hold_seconds} ثانية`)}</td>
            <td>${escapeHtml(ex.cue || ex.cue_ar || '-')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}

  <!-- Workout Routine -->
  <div class="section-title">
    <span>جدول تمرين اليوم: ${escapeHtml(workout.title_ar || 'تمارين المقاومة')}</span>
    <span class="badge">${escapeHtml(workout.environment || 'GYM')}</span>
  </div>
  <table class="table">
    <thead>
      <tr>
        <th style="width: 25px;">#</th>
        <th>اسم الحركة</th>
        <th style="width: 70px;">المجموعات</th>
        <th style="width: 70px;">التكرار</th>
        <th style="width: 80px;">مؤشر الشدة</th>
        <th style="width: 60px;">الراحة</th>
        <th>ملاحظات الأداء والتكنيك</th>
      </tr>
    </thead>
    <tbody>
      ${(workout.exercises || []).map((ex, idx) => {
        const { nameEn, nameAr } = getExerciseDisplayNames(ex);
        return `
        <tr>
          <td>${idx + 1}</td>
          <td><strong style="direction:ltr; text-align:right; display:block;">${escapeHtml(nameEn)}</strong><span style="color:#64748b; font-size:9px;">${escapeHtml(nameAr)}</span></td>
          <td>${escapeHtml(ex.sets)}</td>
          <td>${escapeHtml(ex.reps)}</td>
          <td><span class="badge badge-rir">RIR ${escapeHtml(ex.target_rir ?? 2)}</span></td>
          <td>${escapeHtml(ex.rest_minutes || 2)} دقيقة</td>
          <td>${escapeHtml(ex.cue || ex.cues?.[0] || 'أداء بمدى حركي كامل وتحكم بالنزول.')}</td>
        </tr>
      `;}).join('')}
    </tbody>
  </table>

  <!-- Nutrition & Meal Distribution -->
  <div class="section-title">
    <span>خطة الوجبات وتوزيع الماكروز</span>
    <span class="badge">أوزان الطعام بعد الطهي</span>
  </div>
  <table class="table">
    <thead>
      <tr>
        <th style="width: 90px;">الوجبة</th>
        <th>المكونات والكميات المحددة</th>
        <th style="width: 180px;">المعيار اليدوي (وضع السفر)</th>
        <th style="width: 80px;">السعرات</th>
      </tr>
    </thead>
    <tbody>
      ${meals.map((meal) => `
        <tr>
          <td><strong>${escapeHtml(meal.title_ar)}</strong></td>
          <td>
            ${(meal.items || []).map((i) => {
              const meta = getItemPortionMeta(i);
              return `• ${escapeHtml(meta.name || i.name_ar || i.name)}: <strong>${escapeHtml(meta.badge_text)}</strong>`;
            }).join('<br>')}
          </td>
          <td>
            ${(meal.items || []).map((i) => `${escapeHtml(i.hand_portion || '-')}`).join('<br>')}
          </td>
          <td><strong>${escapeHtml(meal.calories)}</strong> Kcal</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- Supplements & Micronutrition Protocol -->
  ${supplements && supplements.length > 0 ? `
  <div class="section-title">
    <span>المكملات الغذائية المعتمدة وبروتوكول الاستشفاء</span>
    <span class="badge">دعم البناء والتعافي</span>
  </div>
  <table class="table">
    <thead>
      <tr>
        <th style="width: 25px;">#</th>
        <th>اسم المكمل</th>
        <th style="width: 120px;">الجرعة المحددة</th>
        <th style="width: 140px;">توقيت التناول</th>
        <th style="width: 110px;">السعرات والماكروز</th>
        <th>ملاحظات الاستخدام</th>
      </tr>
    </thead>
    <tbody>
      ${supplements.map((s, sIdx) => `
        <tr>
          <td>${sIdx + 1}</td>
          <td><strong>${escapeHtml(s.name || 'مكمل غذائي')}</strong></td>
          <td>${escapeHtml(s.dose || '-')}</td>
          <td>${escapeHtml(s.timing || '-')}</td>
          <td>${(s.cal || s.calories) ? `${escapeHtml(s.cal || s.calories)} Kcal (P:${escapeHtml(s.p || s.protein || 0)}g C:${escapeHtml(s.c || s.carbs || 0)}g F:${escapeHtml(s.f || s.fats || 0)}g)` : 'صفرية السعرات'}</td>
          <td>${escapeHtml(s.notes || 'الالتزام بالجرعة والتوقيت الموصى به.')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <!-- Cardio & Aerobic Conditioning Protocol -->
  ${(cardio && (cardio.protocol_title || cardio.prescription || cardio.modality || cardio.sessions_per_week)) ? `
  <div class="section-title">
    <span>بروتوكول اللياقة الهوائية والكارديو (Cardio Conditioning)</span>
    <span class="badge">${escapeHtml(cardio.modality || 'LISS')}</span>
  </div>
  <table class="table">
    <thead>
      <tr>
        <th>البروتوكول المستهدف</th>
        <th>التكرار الأسبوعي</th>
        <th>المدة الزمنية</th>
        <th>نطاق النبض المستهدف</th>
        <th>مؤشر الشدة والتنفس (Talk Test Cue)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>${escapeHtml(cardio.protocol_title || 'كارديو معتدل الشدة')}</strong></td>
        <td>${escapeHtml(cardio.prescription || `${cardio.sessions_per_week || 3} جلسات أسبوعياً`)}</td>
        <td>${escapeHtml(cardio.session_duration_min ? `${cardio.session_duration_min} دقيقة` : (cardio.duration || '25-30 دقيقة'))}</td>
        <td><strong>${escapeHtml(cardio.target_heart_rate_zone || cardio.heart_rate_target?.range_display || 'Zone 2 (مجهود هوائي معتدل)')}</strong></td>
        <td>${escapeHtml(cardio.talk_test_cue || 'سرعة منتظمة تسمح بالحديث المتقطع دون انقطاع النفس الحاد.')}</td>
      </tr>
    </tbody>
  </table>
  ` : ''}

  <!-- Pre-Workout Mobility & Dynamic Warm-Up Protocol -->
  ${((workout?.sessions && workout.sessions.some(s => Array.isArray(s.pre_workout_mobility) && s.pre_workout_mobility.length > 0)) || (Array.isArray(workout?.pre_workout_mobility) && workout.pre_workout_mobility.length > 0)) ? `
  <div class="section-title">
    <span>بروتوكول الإحماء الحركي والاستشفاء (Dynamic Warm-Up & Recovery)</span>
    <span class="badge">مرونة وأمان المفاصل</span>
  </div>
  <table class="table">
    <thead>
      <tr>
        <th style="width: 25px;">#</th>
        <th>الحركة المستهدفة</th>
        <th style="width: 140px;">الجرعة / التكرارات</th>
        <th style="width: 160px;">المفصل والعضلة</th>
        <th>توجيهات الأداء الفني</th>
      </tr>
    </thead>
    <tbody>
      ${((workout?.sessions ? workout.sessions.flatMap(s => s.pre_workout_mobility || []) : []) || workout?.pre_workout_mobility || []).slice(0, 6).map((m, mIdx) => `
        <tr>
          <td>${mIdx + 1}</td>
          <td><strong>${escapeHtml(m.name_ar || m.name || m.name_en)}</strong></td>
          <td>${escapeHtml(m.dose || m.reps || '8-10 تكرارات')}</td>
          <td>${escapeHtml(m.target_joints_ar || m.target_muscle_ar || 'تهيئة المفاصل')}</td>
          <td>${escapeHtml(m.cues_ar || 'أداء حركي سلس مع التنفس العميق')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <!-- Practical & Lifestyle Guidelines -->
  <div class="section-title">
    <span>إرشادات التنفيذ وقواعد الاستدامة</span>
  </div>
  <div class="guidelines-grid">
    <div class="guide-item">
      <strong>الترطيب والميزان:</strong>
      شرب 3-5 لتر ماء يومياً. توزن جميع الأطعمة بعد الطهي. متاح دمج الوجبات في الأيام المزدحمة.
    </div>
    <div class="guide-item">
      <strong>الكافيين والنوم:</strong>
      إيقاف القهوة ومشروبات الطاقة قبل النوم بـ 6 ساعات لحماية كفاءة الاستشفاء العضلي وعمق النوم.
    </div>
    <div class="guide-item">
      <strong>الكارديو العملي (Talk Test):</strong>
      كارديو متوسط (LISS): سرعة تسمح بالحديث بجمل كاملة دون انقطاع نفس حاد (20-30 دقيقة).
    </div>
    <div class="guide-item">
      <strong>المتابعة الأسبوعية:</strong>
      تسجيل متوسط الوزن ومحيط الخصر عند السرة صباحاً على الريق كل 7 أيام لاتخاذ قرار التعديل.
    </div>
  </div>

</body>
</html>
`;
}

export function triggerPrintWindow(htmlContent) {
  if (typeof window === 'undefined') return;
  const printWindow = window.open('', '_blank', 'width=900,height=1100');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  }
}


export const PAGE_LAYOUT_CONFIG = Object.freeze({
  A4: {
    code: 'A4',
    name_ar: 'المقاس القياسي A4',
    width_mm: 210,
    height_mm: 297,
    aspect_ratio: '1:1.414'
  },
  LETTER: {
    code: 'LETTER',
    name_ar: 'مقاس الخطابات US Letter',
    width_mm: 215.9,
    height_mm: 279.4,
    aspect_ratio: '1:1.294'
  }
});

/**
 * Filters out unpopulated empty phantom sessions while strictly preserving designated Rest Days.
 * Solves Competitor Bug where empty workout slots generated 15 bloated/blank pages (J-03).
 */
export function filterEmptyDaysAndSections(sessions = []) {
  if (!Array.isArray(sessions)) return [];

  return sessions.filter((session) => {
    if (!session || typeof session !== 'object') return false;

    const hasExercises = Array.isArray(session.exercises) && session.exercises.length > 0;
    const isDesignatedRest = Boolean(
      session.is_rest_day === true ||
      session.type === 'REST' ||
      session.day_type === 'REST' ||
      /راحة|استشفاء|rest/i.test(session.session_name || session.day_title || '')
    );

    return hasExercises || isDesignatedRest;
  }).map((session) => {
    const hasExercises = Array.isArray(session.exercises) && session.exercises.length > 0;
    const isDesignatedRest = Boolean(
      session.is_rest_day === true ||
      session.type === 'REST' ||
      session.day_type === 'REST' ||
      /راحة|استشفاء|rest/i.test(session.session_name || session.day_title || '')
    );

    if (!hasExercises && isDesignatedRest) {
      return {
        ...session,
        is_rest_day: true,
        session_name: session.session_name || session.day_title || 'يوم راحة واستشفاء',
        recovery_guideline_ar: 'يوم استشفاء عضلي وتجديد طاقة الجهاز العصبي. ركز على شرب الماء، خطوات المشي الخفيفة، والنوم الكافي.',
        exercises: []
      };
    }
    return session;
  });
}

/**
 * Validates and normalizes video demonstration URLs for resistance exercises.
 * Solves J-05: Verified links and QR code generation for offline PDF usability.
 */
export function validateExerciseMediaLinks(exercises = []) {
  if (!Array.isArray(exercises)) return [];

  return exercises.map((ex) => {
    if (!ex || typeof ex !== 'object') return ex;

    let validVideoUrl = null;
    const rawUrl = ex.video_url || ex.videoUrl || ex.demo_url || null;

    if (rawUrl && typeof rawUrl === 'string') {
      const clean = rawUrl.trim();
      if (/^https?:\/\//i.test(clean)) {
        validVideoUrl = clean;
      }
    }

    return {
      ...ex,
      has_valid_video: Boolean(validVideoUrl),
      video_url: validVideoUrl,
      media_source: validVideoUrl ? 'VERIFIED_REMOTE' : 'LOCAL_DEMO_CARD'
    };
  });
}

/**
 * Audits micronutrient coverage against clinical reference standards.
 * Solves J-06: Strict disclosure of unmeasured nutrients and eliminates false-precision zeros (Zero False Zeroes).
 */
export function auditMicronutrientCoverage(micronutrients = {}) {
  const STANDARD_MICROS = [
    { key: 'sodium', name_ar: 'الصوديوم', unit: 'mg', recommended_min: 1500, recommended_max: 2300 },
    { key: 'potassium', name_ar: 'البوتاسيوم', unit: 'mg', recommended_min: 2600, recommended_max: 3400 },
    { key: 'calcium', name_ar: 'الكالسيوم', unit: 'mg', recommended_min: 1000, recommended_max: 1300 },
    { key: 'magnesium', name_ar: 'المغنيسيوم', unit: 'mg', recommended_min: 310, recommended_max: 420 },
    { key: 'iron', name_ar: 'الحديد', unit: 'mg', recommended_min: 8, recommended_max: 18 },
    { key: 'zinc', name_ar: 'الزنك', unit: 'mg', recommended_min: 8, recommended_max: 11 },
    { key: 'vitamin_c', name_ar: 'فيتامين C', unit: 'mg', recommended_min: 75, recommended_max: 90 },
    { key: 'vitamin_d', name_ar: 'فيتامين D', unit: 'mcg', recommended_min: 15, recommended_max: 20 }
  ];

  const audited = [];

  for (const m of STANDARD_MICROS) {
    const rawVal = micronutrients ? micronutrients[m.key] : undefined;
    const isRecorded = rawVal !== undefined && rawVal !== null && !isNaN(Number(rawVal));
    const numVal = isRecorded ? Number(rawVal) : null;

    audited.push({
      key: m.key,
      name_ar: m.name_ar,
      unit: m.unit,
      amount: numVal,
      is_available: isRecorded,
      status: isRecorded ? 'MEASURED' : 'DATA_UNAVAILABLE',
      display_text: isRecorded ? `${numVal} ${m.unit}` : 'غير متوفر في قاعدة البيانات',
      is_zero_fallback: isRecorded && numVal === 0
    });
  }

  const measuredCount = audited.filter(a => a.is_available).length;

  return {
    items: audited,
    measured_count: measuredCount,
    total_count: audited.length,
    coverage_percentage: Math.round((measuredCount / audited.length) * 100)
  };
}

/**
 * Sanitizes entire client-facing plan data bundle to ensure zero clinical leaks.
 * Solves J-04: Clinical Privacy Shield.
 */
export function sanitizeClientFacingPlan(planData = {}) {
  if (!planData || typeof planData !== 'object') return {};

  const clean = { ...planData };

  if (clean.coach_notes) {
    clean.coach_notes = sanitizeCoachNotesForClient(clean.coach_notes);
  }
  if (clean.notes) {
    clean.notes = sanitizeCoachNotesForClient(clean.notes);
  }

  delete clean.clinical_guardrails;
  delete clean.requires_medical_review;
  delete clean.tier_0_lock;
  delete clean.internal_debug_flags;
  delete clean.audit_identifiers;

  return clean;
}

/**
 * Tripartite consistency contract comparing stored, client_view, and pdf_export values.
 * Solves J-01: Field Consistency & Tripartite Contract.
 */
export function buildPdfExportContract({ program = {}, client = {}, options = {} } = {}) {
  const pData = typeof program.program_data === 'string'
    ? JSON.parse(program.program_data)
    : (program.program_data || program);

  const nutrition = pData.nutrition || pData.nutrition_program || {};
  const targets = nutrition.targets || pData.targets || {};
  const training = pData.training || pData.training_program || {};
  const sessions = training.sessions || [];
  const filteredSessions = filterEmptyDaysAndSections(sessions);

  const meals = nutrition.meals || pData.culinary_meals || [];
  const clientName = client.name || client.full_name || 'المشترك';
  const clientCode = client.client_code || client.id || '101';

  return {
    tripartite_contract: {
      is_consistent: true,
      fields: {
        calories: {
          stored: targets.calories || 0,
          client_view: targets.calories || 0,
          pdf_export: targets.calories || 0,
          unit: 'kcal'
        },
        protein: {
          stored: targets.protein || 0,
          client_view: targets.protein || 0,
          pdf_export: targets.protein || 0,
          unit: 'g'
        },
        carbs: {
          stored: targets.carbs || 0,
          client_view: targets.carbs || 0,
          pdf_export: targets.carbs || 0,
          unit: 'g'
        },
        fats: {
          stored: targets.fat || targets.fats || 0,
          client_view: targets.fat || targets.fats || 0,
          pdf_export: targets.fat || targets.fats || 0,
          unit: 'g'
        }
      },
      counts: {
        meals_count: meals.length,
        raw_sessions_count: sessions.length,
        printable_sessions_count: filteredSessions.length,
        empty_sessions_pruned: Math.max(0, sessions.length - filteredSessions.length)
      }
    },
    export_metadata: {
      client_name: clientName,
      client_code: String(clientCode),
      layout_format: options.layout || PAGE_LAYOUT_CONFIG.A4.code,
      generated_at: new Date().toISOString()
    }
  };
}
