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

export function generateMasterPdfExportData({
  client_name = 'المتدرب المعتمد',
  client_code = '101',
  package_tier = 'MAX_VIP',
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
  }
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
      package: package_tier === 'MAX_VIP' ? 'باقة ماكس (VIP)' : 'باقة إيليت',
      week: `الأسبوع ${current_week}`
    },
    contextual_guidelines: SMART_GUIDELINES_MATRIX,
    nutrition: nutrition_plan,
    training: workout_plan,
    cardio: cardio_plan,
    footer_note: 'هذا البرنامج صُمم خصيصاً لحالتك البيوميكانيكية والغذائية وفق معايير Z Coaching - كابتن كريم زكريا.'
  };
}


/**
 * Master PDF & Print Compiler Engine
 * Formats a clean, high-density, printable HTML document for 1-click PDF export
 */
export function generatePrintablePlanHTML({ client = {}, plan = {}, date = new Date().toISOString().split('T')[0] }) {
  const { prehab, workout = {}, meals = [], guidelines } = plan;

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>خطة التدريب والتغذية - ${client.name || 'المشترك'}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11px; line-height: 1.4; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 900; }
    .header p { margin: 2px 0 0; color: #475569; font-size: 10px; }
    .macro-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; margin-bottom: 12px; text-align: center; }
    .macro-box { font-size: 10px; font-weight: bold; }
    .macro-val { font-size: 14px; font-weight: 900; color: #0f172a; }
    .section-title { font-size: 12px; font-weight: 900; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 3px; margin: 10px 0 6px; color: #1e293b; display: flex; justify-content: space-between; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .table th, .table td { border: 1px solid #e2e8f0; padding: 5px 6px; text-align: right; }
    .table th { background: #f1f5f9; font-weight: 800; font-size: 10px; }
    .badge { display: inline-block; padding: 1px 4px; border-radius: 3px; font-size: 9px; font-weight: bold; background: #e2e8f0; }
    .badge-rir { background: #dcfce7; color: #166534; }
    .badge-prehab { background: #e0e7ff; color: #3730a3; }
    .guidelines-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px; }
    .guide-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; }
    .guide-item strong { display: block; margin-bottom: 2px; color: #0f172a; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <h1>برنامج التدريب والتغذية الإكلينيكي</h1>
      <p>المشترك: <strong>${client.name || 'المتدرب'}</strong> | الهدف: <strong>${client.goal_title || 'خسارة دهون وتطوير القوة'}</strong> | التاريخ: ${date}</p>
    </div>
    <div style="text-align: left; font-size: 9px; color: #64748b;">Z COACHING PLATFORM</div>
  </div>

  <!-- Macro Overview -->
  <div class="macro-bar">
    <div class="macro-box">السعرات اليومية<div class="macro-val">${client.target_calories || 1900} Kcal</div></div>
    <div class="macro-box">البروتين<div class="macro-val">${client.target_protein || 150}g</div></div>
    <div class="macro-box">الكاربوهيدرات<div class="macro-val">${client.target_carbs || 190}g</div></div>
    <div class="macro-box">الدهون الصحية<div class="macro-val">${client.target_fats || 60}g</div></div>
  </div>

  <!-- Prehab Protocol if exists -->
  ${prehab && prehab.has_prehab ? `
    <div class="section-title">
      <span>روتين تجهيز المفاصل وتصحيح القوام (${prehab.total_duration_minutes} دقائق قبل التمرين)</span>
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
        ${prehab.exercises.map((ex) => `
          <tr>
            <td><strong>${ex.name_ar}</strong></td>
            <td>${ex.sets}</td>
            <td>${ex.reps || `${ex.hold_seconds} ثانية`}</td>
            <td>${ex.cue || ex.cue_ar || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}

  <!-- Workout Routine -->
  <div class="section-title">
    <span>جدول تمرين اليوم: ${workout.title_ar || 'تمارين المقاومة'}</span>
    <span class="badge">${workout.environment || 'GYM'}</span>
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
      ${(workout.exercises || []).map((ex, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${ex.name_ar}</strong><br><span style="color:#64748b; font-size:9px;">${ex.name_en || ''}</span></td>
          <td>${ex.sets}</td>
          <td>${ex.reps}</td>
          <td><span class="badge badge-rir">RIR ${ex.target_rir ?? 2}</span></td>
          <td>${ex.rest_minutes || 2} دقيقة</td>
          <td>${ex.cue || ex.cues?.[0] || 'أداء بمدى حركي كامل وتحكم بالنزول.'}</td>
        </tr>
      `).join('')}
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
          <td><strong>${meal.title_ar}</strong></td>
          <td>
            ${meal.items.map((i) => `• ${i.name_ar}: <strong>${i.grams} جم</strong> (أو بديل متكافئ)`).join('<br>')}
          </td>
          <td>
            ${meal.items.map((i) => `${i.hand_portion || '-'}`).join('<br>')}
          </td>
          <td><strong>${meal.calories}</strong> Kcal</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- Clinical & Lifestyle Guidelines -->
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
