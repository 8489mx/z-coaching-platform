import fs from 'fs';

const filePath = 'frontend/public/mobile_app_preview.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add CSS rules if not already present
const cssToAdd = `
    /* Apple Health Badges & Segmented Controls for Phase 03 Polish */
    .apple-badge-green {
      background: #E8F8EE;
      color: #248A3D;
      font-weight: 700;
      border-radius: 9999px;
      padding: 2px 8px;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .apple-badge-blue {
      background: #EBF5FF;
      color: #007AFF;
      font-weight: 700;
      border-radius: 9999px;
      padding: 2px 8px;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .apple-badge-orange {
      background: #FFF4E5;
      color: #D97706;
      font-weight: 700;
      border-radius: 9999px;
      padding: 2px 8px;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .apple-badge-red {
      background: #FEECEB;
      color: #E03E3E;
      font-weight: 700;
      border-radius: 9999px;
      padding: 2px 8px;
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .apple-grouped-card {
      background: #FFFFFF;
      border: 1px solid rgba(226, 232, 240, 0.85);
      border-radius: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02), 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    .apple-segment-pill {
      height: 32px;
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 600;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      user-select: none;
      padding: 0 10px;
    }
    .apple-segment-active {
      background: #FFFFFF;
      color: #007AFF;
      font-weight: 700;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .apple-segment-inactive {
      color: #8E8E93;
    }
    .apple-segment-inactive:hover {
      color: #1C1C1E;
    }
`;

if (!content.includes('.apple-badge-orange {')) {
  content = content.replace('</style>', `${cssToAdd}\n  </style>`);
  console.log('Added Apple Health badge & segment styles');
}

// 2. Add Check-in State Switcher to the top toolbar
const stateSwitcherHtml = `
      <!-- Check-in State Switcher (Upcoming / Due / Submitted / Expired) -->
      <div id="checkin-state-toolbar" class="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-1 flex items-center gap-1">
        <span class="text-[11px] font-bold text-[#64748B] px-1.5 hidden sm:inline">حالة المتابعة:</span>
        <button onclick="setCheckinState('due')" id="btn-chk-due" class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#007AFF] text-white shadow-xs transition-all cursor-pointer">
          مستحقة (Due)
        </button>
        <button onclick="setCheckinState('upcoming')" id="btn-chk-upcoming" class="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-all cursor-pointer">
          قادمة (Upcoming)
        </button>
        <button onclick="setCheckinState('submitted')" id="btn-chk-submitted" class="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-all cursor-pointer">
          تم الإرسال (Submitted)
        </button>
        <button onclick="setCheckinState('expired')" id="btn-chk-expired" class="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-all cursor-pointer">
          منتهية (Expired)
        </button>
        <a href="/checkin_apple_polish_comparison.html" target="_blank" class="px-2 py-1.5 rounded-xl text-xs font-bold bg-[#EFF6FF] text-[#007AFF] hover:bg-[#DBEAFE] border border-[#BFDBFE] transition-all flex items-center gap-0.5">
          <span>المقارنة</span>
          <span>&nearr;</span>
        </a>
      </div>
`;

if (!content.includes('id="checkin-state-toolbar"')) {
  // Insert before the device size switcher
  const deviceSizeTag = '<div class="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-1 flex items-center gap-1">\n        <button onclick="setDeviceSize(\'390\')"';
  if (content.includes(deviceSizeTag)) {
    content = content.replace(deviceSizeTag, `${stateSwitcherHtml}\n      ${deviceSizeTag}`);
    console.log('Added Check-in state toolbar to header');
  } else {
    console.warn('Could not find device size switcher anchor');
  }
}

// 3. Replace screen-checkin markup
const checkinStartMarker = '<div id="screen-checkin"';
const checkinEndMarker = '<!-- ========================================== -->\n          <!-- 5. SCREEN: ACCOUNT HUB';

const checkinStartIndex = content.indexOf(checkinStartMarker);
const checkinEndIndex = content.indexOf(checkinEndMarker);

if (checkinStartIndex === -1 || checkinEndIndex === -1) {
  console.error('Could not find checkin boundaries', { checkinStartIndex, checkinEndIndex });
  process.exit(1);
}

const newCheckinMarkup = `<div id="screen-checkin" class="hidden apple-canvas-bg px-4 py-3.5 space-y-3.5 pb-32 sm:px-5 sm:space-y-4">

            <!-- Apple Large Title Header -->
            <header class="flex items-center justify-between pt-1 pb-0.5 select-none gap-2">
              <div class="space-y-0.5 min-w-0">
                <p class="text-[11.5px] font-semibold text-[#8E8E93] tracking-wide truncate">التقييم الأسبوعي</p>
                <h1 class="text-[25px] font-black text-[#1C1C1E] tracking-tight leading-none mt-1">المتابعة</h1>
              </div>
              <!-- Dynamic Schedule Pill -->
              <div id="chk-header-badge" class="shrink-0">
                <span class="apple-badge-orange whitespace-nowrap text-[10.5px]">مستحقة (48س)</span>
              </div>
            </header>

            <!-- Apple Segmented Switcher (تسجيل المتابعة / سجل التطور) -->
            <nav class="apple-fitness-card p-1 flex gap-1 bg-[#F2F2F7] border border-slate-200/60" aria-label="تبويب المتابعة">
              <button id="chk-tab-form" onclick="toggleCheckinView('form')" class="flex-1 h-[34px] rounded-full text-[12px] font-bold bg-white text-[#007AFF] shadow-xs transition-all text-center flex items-center justify-center cursor-pointer">
                تسجيل المتابعة
              </button>
              <button id="chk-tab-history" onclick="toggleCheckinView('history')" class="flex-1 h-[34px] rounded-full text-[12px] font-semibold text-[#8E8E93] hover:text-[#1C1C1E] transition-all text-center flex items-center justify-center cursor-pointer">
                سجل التطور
              </button>
            </nav>

            <!-- ============================================================= -->
            <!-- VIEW 1: CHECK-IN FORM MODE                                     -->
            <!-- ============================================================= -->
            <div id="checkin-mode-form" class="space-y-3.5">

              <!-- 1. Apple Health Schedule State Banner (Dynamic for 4 states) -->
              <section id="chk-schedule-card" class="apple-fitness-card p-3.5 sm:p-4 transition-all">
                <!-- Rendered dynamically by renderCheckinScheduleCard() -->
              </section>

              <!-- Check-in Form Interactive Content -->
              <div id="chk-interactive-area" class="space-y-3.5">

                <!-- 2. Measurements Section (Grouped Apple Health Style) -->
                <section class="apple-fitness-card p-3.5 sm:p-4 space-y-3">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                      <div class="w-6 h-6 rounded-[8px] bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center shrink-0">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M12 3v18M3 12h18M5 7l14 10M5 17L19 7"/>
                        </svg>
                      </div>
                      <h3 class="text-[13.5px] font-bold text-[#1C1C1E] truncate">القياسات الصباحية</h3>
                    </div>
                    <!-- Unit Switcher Pill -->
                    <div class="flex items-center bg-[#F2F2F7] p-0.5 rounded-full border border-slate-200/50 shrink-0">
                      <button type="button" onclick="toggleCheckinUnits('metric')" id="chk-unit-metric" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#007AFF] shadow-2xs transition-all">كجم / سم</button>
                      <button type="button" onclick="toggleCheckinUnits('imperial')" id="chk-unit-imperial" class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-[#8E8E93] transition-all">LB / IN</button>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2.5">
                    <!-- Weight Card -->
                    <div class="p-3 bg-[#F9FAFB] rounded-[16px] border border-[#F2F2F7] space-y-2 text-center">
                      <span class="text-[11.5px] font-bold text-[#8E8E93] block">الوزن الصباحي</span>

                      <!-- Tactile Stepper Row -->
                      <div class="h-11 bg-white rounded-[14px] border border-slate-200/70 flex items-center justify-between px-1.5 shadow-2xs" dir="ltr">
                        <button type="button" onclick="stepCheckinWeight(-1)" class="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#1C1C1E] active:scale-90 transition-all cursor-pointer shrink-0" aria-label="تقليل الوزن">
                          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                        <div class="flex items-baseline justify-center gap-1 select-none">
                          <span id="chk-weight-display" class="text-[20px] font-black text-[#1C1C1E] font-inter tracking-tight">82.5</span>
                          <span id="chk-weight-unit" class="text-[10.5px] font-bold text-[#8E8E93]">كجم</span>
                        </div>
                        <button type="button" onclick="stepCheckinWeight(1)" class="w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] active:scale-90 transition-all cursor-pointer shrink-0" aria-label="زيادة الوزن">
                          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                      </div>

                      <!-- Baseline & Delta Badge -->
                      <div class="flex items-center justify-between px-0.5 text-[10.5px]">
                        <span class="text-[#8E8E93] truncate">السابق: <strong id="chk-weight-baseline" class="text-[#1C1C1E] font-inter">83.0</strong></span>
                        <span id="chk-weight-delta-badge" class="apple-badge-green text-[9.5px] px-1.5 py-0.5 font-inter font-bold" dir="ltr">-0.5 kg</span>
                      </div>
                    </div>

                    <!-- Waist Card -->
                    <div class="p-3 bg-[#F9FAFB] rounded-[16px] border border-[#F2F2F7] space-y-2 text-center">
                      <span class="text-[11.5px] font-bold text-[#8E8E93] block">محيط الخصر</span>

                      <!-- Tactile Stepper Row -->
                      <div class="h-11 bg-white rounded-[14px] border border-slate-200/70 flex items-center justify-between px-1.5 shadow-2xs" dir="ltr">
                        <button type="button" onclick="stepCheckinWaist(-1)" class="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#1C1C1E] active:scale-90 transition-all cursor-pointer shrink-0" aria-label="تقليل محيط الخصر">
                          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                        <div class="flex items-baseline justify-center gap-1 select-none">
                          <span id="chk-waist-display" class="text-[20px] font-black text-[#1C1C1E] font-inter tracking-tight">84.0</span>
                          <span id="chk-waist-unit" class="text-[10.5px] font-bold text-[#8E8E93]">سم</span>
                        </div>
                        <button type="button" onclick="stepCheckinWaist(1)" class="w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] active:scale-90 transition-all cursor-pointer shrink-0" aria-label="زيادة محيط الخصر">
                          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                      </div>

                      <!-- Baseline & Delta Badge -->
                      <div class="flex items-center justify-between px-0.5 text-[10.5px]">
                        <span class="text-[#8E8E93] truncate">السابق: <strong id="chk-waist-baseline" class="text-[#1C1C1E] font-inter">84.5</strong></span>
                        <span id="chk-waist-delta-badge" class="apple-badge-green text-[9.5px] px-1.5 py-0.5 font-inter font-bold" dir="ltr">-0.5 cm</span>
                      </div>
                    </div>
                  </div>
                </section>

                <!-- 3. Weekly Wellbeing Questionnaire (Clean Segmented Controls) -->
                <section class="apple-fitness-card p-4 space-y-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-[8px] bg-[#34C759]/10 text-[#34C759] flex items-center justify-center">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                        </svg>
                      </div>
                      <h3 class="text-[14px] font-bold text-[#1C1C1E]">العلامات الحيوية والالتزام</h3>
                    </div>
                    <span class="text-[11px] text-[#8E8E93] font-medium">الأسبوع 4</span>
                  </div>

                  <div class="space-y-3.5">
                    <!-- Sleep Hours -->
                    <div class="space-y-1.5">
                      <div class="flex items-center justify-between text-[12px]">
                        <span class="font-bold text-[#1C1C1E]">متوسط ساعات النوم اليومية</span>
                        <span id="chk-sleep-label" class="text-[#007AFF] font-bold font-inter">7 ساعات</span>
                      </div>
                      <div class="grid grid-cols-4 gap-1 bg-[#F2F2F7] p-1 rounded-full border border-slate-200/40">
                        <button type="button" onclick="setCheckinOption('sleep', 6, '6 ساعات', this)" class="apple-segment-pill apple-segment-inactive">6 س</button>
                        <button type="button" onclick="setCheckinOption('sleep', 7, '7 ساعات', this)" class="apple-segment-pill apple-segment-active">7 س</button>
                        <button type="button" onclick="setCheckinOption('sleep', 8, '8 ساعات', this)" class="apple-segment-pill apple-segment-inactive">8 س</button>
                        <button type="button" onclick="setCheckinOption('sleep', 9, '9+ ساعات', this)" class="apple-segment-pill apple-segment-inactive">9+ س</button>
                      </div>
                    </div>

                    <!-- Nutrition Adherence -->
                    <div class="space-y-1.5">
                      <div class="flex items-center justify-between text-[12px]">
                        <span class="font-bold text-[#1C1C1E]">الالتزام بالخطة الغذائية</span>
                        <span id="chk-adherence-label" class="text-[#34C759] font-bold">100% ممتاز</span>
                      </div>
                      <div class="grid grid-cols-3 gap-1 bg-[#F2F2F7] p-1 rounded-[14px] border border-slate-200/40">
                        <button type="button" onclick="setCheckinOption('adherence', 100, '100% ممتاز', this)" class="apple-segment-pill apple-segment-active text-[11px]">100% ممتاز</button>
                        <button type="button" onclick="setCheckinOption('adherence', 90, '90% جيد جداً', this)" class="apple-segment-pill apple-segment-inactive text-[11px]">90% جيد جداً</button>
                        <button type="button" onclick="setCheckinOption('adherence', 80, '80% متوسط', this)" class="apple-segment-pill apple-segment-inactive text-[11px]">80% متوسط</button>
                        <button type="button" onclick="setCheckinOption('adherence', 70, '70% مقبول', this)" class="apple-segment-pill apple-segment-inactive text-[11px]">70% مقبول</button>
                        <button type="button" onclick="setCheckinOption('adherence', 60, '60% ضعيف', this)" class="apple-segment-pill apple-segment-inactive text-[11px]">60% ضعيف</button>
                        <button type="button" onclick="setCheckinOption('adherence', 50, 'أقل من 50%', this)" class="apple-segment-pill apple-segment-inactive text-[11px]">أقل من 50%</button>
                      </div>
                    </div>

                    <!-- Digestion -->
                    <div class="space-y-1.5">
                      <div class="flex items-center justify-between text-[12px]">
                        <span class="font-bold text-[#1C1C1E]">حالة الهضم والقولون</span>
                        <span id="chk-digestion-label" class="text-[#007AFF] font-bold">طبيعي ومريح</span>
                      </div>
                      <div class="grid grid-cols-3 gap-1 bg-[#F2F2F7] p-1 rounded-full border border-slate-200/40">
                        <button type="button" onclick="setCheckinOption('digestion', 'REGULAR', 'طبيعي ومريح', this)" class="apple-segment-pill apple-segment-active text-[11px]">طبيعي</button>
                        <button type="button" onclick="setCheckinOption('digestion', 'CONSTIPATION', 'إمساك', this)" class="apple-segment-pill apple-segment-inactive text-[11px]">إمساك</button>
                        <button type="button" onclick="setCheckinOption('digestion', 'BLOATING', 'غازات / انتفاخ', this)" class="apple-segment-pill apple-segment-inactive text-[11px]">انتفاخ</button>
                      </div>
                    </div>

                    <!-- Hunger / Satiety -->
                    <div class="space-y-1.5">
                      <div class="flex items-center justify-between text-[12px]">
                        <span class="font-bold text-[#1C1C1E]">مستوى الجوع والشهية</span>
                        <span id="chk-hunger-label" class="text-[#007AFF] font-bold">معتدل ومسيطر</span>
                      </div>
                      <div class="grid grid-cols-3 gap-1 bg-[#F2F2F7] p-1 rounded-full border border-slate-200/40">
                        <button type="button" onclick="setCheckinOption('hunger', 'LOW', 'منخفض', this)" class="apple-segment-pill apple-segment-inactive text-[11px]">منخفض</button>
                        <button type="button" onclick="setCheckinOption('hunger', 'MODERATE', 'معتدل ومسيطر', this)" class="apple-segment-pill apple-segment-active text-[11px]">معتدل</button>
                        <button type="button" onclick="setCheckinOption('hunger', 'HIGH', 'مرتفع وصعب', this)" class="apple-segment-pill apple-segment-inactive text-[11px]">مرتفع</button>
                      </div>
                    </div>

                    <!-- Daily Activity (NEAT) -->
                    <div class="space-y-1.5">
                      <div class="flex items-center justify-between text-[12px]">
                        <span class="font-bold text-[#1C1C1E]">النشاط الحركي اليومي</span>
                        <span id="chk-activity-label" class="text-[#007AFF] font-bold">متوسط وروتيني</span>
                      </div>
                      <div class="grid grid-cols-3 gap-1 bg-[#F2F2F7] p-1 rounded-full border border-slate-200/40">
                        <button type="button" onclick="setCheckinOption('activity', 'SEDENTARY', 'مكتبي / قليل', this)" class="apple-segment-pill apple-segment-inactive text-[11px]">مكتبي</button>
                        <button type="button" onclick="setCheckinOption('activity', 'MODERATE', 'متوسط وروتيني', this)" class="apple-segment-pill apple-segment-active text-[11px]">متوسط</button>
                        <button type="button" onclick="setCheckinOption('activity', 'HIGH', 'عالي ونشط', this)" class="apple-segment-pill apple-segment-inactive text-[11px]">عالي</button>
                      </div>
                    </div>

                    <!-- Exceptional Circumstances -->
                    <div class="space-y-1.5">
                      <div class="flex items-center justify-between text-[12px]">
                        <span class="font-bold text-[#1C1C1E]">ظروف استثنائية (اختياري)</span>
                        <span id="chk-circumstances-label" class="text-[#8E8E93] font-bold">لا يوجد (أسبوع روتيني)</span>
                      </div>
                      <div class="grid grid-cols-3 gap-1 bg-[#F2F2F7] p-1 rounded-full border border-slate-200/40">
                        <button type="button" onclick="setCheckinOption('circumstances', 'NONE', 'لا يوجد (أسبوع روتيني)', this)" class="apple-segment-pill apple-segment-active text-[11px]">لا يوجد</button>
                        <button type="button" onclick="setCheckinOption('circumstances', 'TRAVEL', 'سفر وتنقل', this)" class="apple-segment-pill apple-segment-inactive text-[11px]">سفر</button>
                        <button type="button" onclick="setCheckinOption('circumstances', 'STRESS', 'ضغط وسهر عمل', this)" class="apple-segment-pill apple-segment-inactive text-[11px]">ضغط عمل</button>
                      </div>
                    </div>

                    <!-- Female Menstrual Cycle (Conditional Toggle) -->
                    <div id="chk-female-cycle-block" class="pt-2 border-t border-slate-100 space-y-1.5 hidden">
                      <div class="flex items-center justify-between text-[12px]">
                        <div class="flex items-center gap-1.5">
                          <span class="font-bold text-[#1C1C1E]">الدورة الشهرية (خاص بالعميلات)</span>
                          <span class="text-[10px] text-[#8E8E93]">احتباس السوائل</span>
                        </div>
                        <span id="chk-cycle-label" class="text-[#007AFF] font-bold text-[11px]">أيام عادية</span>
                      </div>
                      <div class="grid grid-cols-3 gap-1 bg-[#F2F2F7] p-1 rounded-full border border-slate-200/40">
                        <button type="button" onclick="setCheckinOption('cycle', 'NORMAL', 'أيام عادية', this)" class="apple-segment-pill apple-segment-active text-[11px]">عادية</button>
                        <button type="button" onclick="setCheckinOption('cycle', 'PMS', 'ما قبل الطمث (PMS)', this)" class="apple-segment-pill apple-segment-inactive text-[11px]">PMS</button>
                        <button type="button" onclick="setCheckinOption('cycle', 'PERIOD', 'أسبوع الدورة', this)" class="apple-segment-pill apple-segment-inactive text-[11px]">الدورة</button>
                      </div>
                    </div>
                  </div>
                </section>

                <!-- 4. Progress Photos (Clean Apple Health Upload Tiles) -->
                <section class="apple-fitness-card p-4 space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-[8px] bg-[#AF52DE]/10 text-[#AF52DE] flex items-center justify-center">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                      </div>
                      <h3 class="text-[14px] font-bold text-[#1C1C1E]">صور التطور (3 زوايا)</h3>
                    </div>
                    <span class="text-[10.5px] text-[#8E8E93]">خاصة بالكوتش فقط</span>
                  </div>

                  <div class="grid grid-cols-3 gap-2.5">
                    <!-- Front Tile -->
                    <div id="chk-tile-front" class="relative group p-3 rounded-[16px] border border-dashed border-slate-300 bg-[#F9FAFB] hover:bg-[#F2F4F7] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px]" onclick="triggerCheckinPhoto('front')">
                      <input type="file" id="chk-file-front" accept="image/*" class="hidden" onchange="handleCheckinPhotoFile('front', this)">
                      <div id="chk-preview-front" class="hidden absolute inset-0 rounded-[16px] overflow-hidden bg-cover bg-center">
                        <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <button type="button" onclick="event.stopPropagation(); removeCheckinPhoto('front');" class="p-1 rounded-full bg-red-500 text-white shadow-sm" title="حذف الصورة">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      </div>
                      <div id="chk-placeholder-front" class="flex flex-col items-center space-y-1">
                        <div class="w-8 h-8 rounded-full bg-white shadow-2xs text-[#007AFF] flex items-center justify-center">
                          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                        </div>
                        <span class="text-[12px] font-bold text-[#1C1C1E]">أمامي</span>
                        <span class="text-[10px] text-[#8E8E93]">إرفاق صورة</span>
                      </div>
                    </div>

                    <!-- Side Tile -->
                    <div id="chk-tile-side" class="relative group p-3 rounded-[16px] border border-dashed border-slate-300 bg-[#F9FAFB] hover:bg-[#F2F4F7] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px]" onclick="triggerCheckinPhoto('side')">
                      <input type="file" id="chk-file-side" accept="image/*" class="hidden" onchange="handleCheckinPhotoFile('side', this)">
                      <div id="chk-preview-side" class="hidden absolute inset-0 rounded-[16px] overflow-hidden bg-cover bg-center">
                        <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <button type="button" onclick="event.stopPropagation(); removeCheckinPhoto('side');" class="p-1 rounded-full bg-red-500 text-white shadow-sm" title="حذف الصورة">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      </div>
                      <div id="chk-placeholder-side" class="flex flex-col items-center space-y-1">
                        <div class="w-8 h-8 rounded-full bg-white shadow-2xs text-[#007AFF] flex items-center justify-center">
                          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                        </div>
                        <span class="text-[12px] font-bold text-[#1C1C1E]">جانبي</span>
                        <span class="text-[10px] text-[#8E8E93]">إرفاق صورة</span>
                      </div>
                    </div>

                    <!-- Back Tile -->
                    <div id="chk-tile-back" class="relative group p-3 rounded-[16px] border border-dashed border-slate-300 bg-[#F9FAFB] hover:bg-[#F2F4F7] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px]" onclick="triggerCheckinPhoto('back')">
                      <input type="file" id="chk-file-back" accept="image/*" class="hidden" onchange="handleCheckinPhotoFile('back', this)">
                      <div id="chk-preview-back" class="hidden absolute inset-0 rounded-[16px] overflow-hidden bg-cover bg-center">
                        <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <button type="button" onclick="event.stopPropagation(); removeCheckinPhoto('back');" class="p-1 rounded-full bg-red-500 text-white shadow-sm" title="حذف الصورة">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      </div>
                      <div id="chk-placeholder-back" class="flex flex-col items-center space-y-1">
                        <div class="w-8 h-8 rounded-full bg-white shadow-2xs text-[#007AFF] flex items-center justify-center">
                          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                        </div>
                        <span class="text-[12px] font-bold text-[#1C1C1E]">خلفي</span>
                        <span class="text-[10px] text-[#8E8E93]">إرفاق صورة</span>
                      </div>
                    </div>
                  </div>

                  <p class="text-[11px] text-[#8E8E93] leading-relaxed pt-1">
                    الصور تحفظ بأمان عالي ومخصصة لتحليل التطور العضلي ومقارنة نسبة الدهون من قبل الكوتش كريم فقط.
                  </p>
                </section>

                <!-- 5. Client Notes to Coach -->
                <section class="apple-fitness-card p-4 space-y-2">
                  <label for="chk-client-notes" class="text-[13px] font-bold text-[#1C1C1E] block">ملاحظاتك للكوتش (اختياري)</label>
                  <textarea id="chk-client-notes" rows="2" placeholder="أي تفاصيل أو أسئلة تود توضيحها للكوتش عن هذا الأسبوع..." class="w-full p-3 bg-[#F2F2F7] rounded-[14px] text-[12.5px] text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 resize-none border border-transparent focus:border-slate-300 transition-all"></textarea>
                </section>

                <!-- 6. Apple Primary Action Button -->
                <button type="button" id="chk-submit-btn" onclick="submitCheckinForm()" class="w-full h-[52px] rounded-full apple-btn-primary text-white font-bold text-[15px] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <span>إرسال تقييم المتابعة للمدرب</span>
                  <svg class="w-4 h-4 rtl:rotate-180 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- ============================================================= -->
            <!-- VIEW 2: PROGRESS HISTORY & TRENDS                             -->
            <!-- ============================================================= -->
            <div id="checkin-mode-history" class="hidden space-y-3.5">

              <!-- 1. Cumulative Transformation Summary Card -->
              <section class="apple-fitness-card p-4 space-y-3">
                <div class="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span class="text-[12px] font-bold text-[#34C759]">ملخص التطور التراكمي المعتمد</span>
                  <span class="apple-badge-green text-[10px]">3 أسابيع نشطة</span>
                </div>

                <div class="grid grid-cols-2 divide-x divide-x-reverse divide-slate-100 pt-1">
                  <div class="px-2 text-center flex flex-col items-center">
                    <span class="text-[11px] font-semibold text-[#8E8E93] mb-1">نزول الوزن الكلي</span>
                    <div class="flex items-baseline justify-center gap-1" dir="ltr">
                      <span id="prog-weight-loss" class="text-[24px] font-black text-[#1C1C1E] font-inter leading-none" style="unicode-bidi: isolate;">-3.5</span>
                      <span id="prog-weight-unit" class="text-[11px] font-bold text-[#8E8E93] leading-none">كجم</span>
                    </div>
                    <span id="prog-weight-sub" class="text-[10px] text-[#34C759] font-bold mt-1" dir="ltr" style="unicode-bidi: isolate;">86.0 → 82.5 kg</span>
                  </div>

                  <div class="px-2 text-center flex flex-col items-center">
                    <span class="text-[11px] font-semibold text-[#8E8E93] mb-1">نزول محيط الخصر</span>
                    <div class="flex items-baseline justify-center gap-1" dir="ltr">
                      <span id="prog-waist-loss" class="text-[24px] font-black text-[#1C1C1E] font-inter leading-none" style="unicode-bidi: isolate;">-4.0</span>
                      <span id="prog-waist-unit" class="text-[11px] font-bold text-[#8E8E93] leading-none">سم</span>
                    </div>
                    <span id="prog-waist-sub" class="text-[10px] text-[#34C759] font-bold mt-1" dir="ltr" style="unicode-bidi: isolate;">88.0 → 84.0 cm</span>
                  </div>
                </div>
              </section>

              <!-- 2. Clean Apple Health Weight Trend Sparkline (Real historical data: 86.0 -> 83.8 -> 83.0 -> 82.5) -->
              <section class="apple-fitness-card p-4 space-y-2.5">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-[13.5px] font-bold text-[#1C1C1E]">مسار نزول الوزن (كجم)</h3>
                    <p class="text-[10.5px] text-[#8E8E93]">قراءات حقيقية مثبتة من المتابعات الأسبوعية</p>
                  </div>
                  <span class="apple-badge-blue text-[10.5px] font-inter font-bold" dir="ltr">-1.2 kg/wk</span>
                </div>

                <!-- Real SVG Trend Graphic in LTR -->
                <div class="h-28 w-full bg-[#F9FAFB] rounded-[14px] p-2 flex flex-col justify-between border border-slate-100" dir="ltr">
                  <div class="flex justify-between text-[10px] font-inter font-bold text-[#8E8E93] px-1">
                    <span>86.0 كجم (البداية)</span>
                    <span>82.5 كجم (الحالي)</span>
                  </div>

                  <svg viewBox="0 0 300 70" class="w-full h-14 overflow-visible">
                    <!-- Gradient Area -->
                    <defs>
                      <linearGradient id="preview-trend-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#007AFF" stop-opacity="0.22"/>
                        <stop offset="100%" stop-color="#007AFF" stop-opacity="0.0"/>
                      </linearGradient>
                    </defs>
                    <polygon points="10,65 10,12 105,38 200,48 290,56 290,65" fill="url(#preview-trend-grad)"/>
                    <!-- Trend Line -->
                    <polyline fill="none" stroke="#007AFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="10,12 105,38 200,48 290,56"/>
                    <!-- Data Points with Real Readings -->
                    <circle cx="10" cy="12" r="4" fill="#007AFF" stroke="#FFFFFF" stroke-width="2"/>
                    <circle cx="105" cy="38" r="4" fill="#007AFF" stroke="#FFFFFF" stroke-width="2"/>
                    <circle cx="200" cy="48" r="4" fill="#007AFF" stroke="#FFFFFF" stroke-width="2"/>
                    <circle cx="290" cy="56" r="4" fill="#007AFF" stroke="#FFFFFF" stroke-width="2"/>
                  </svg>

                  <div class="flex justify-between text-[9.5px] font-semibold text-[#8E8E93] px-1">
                    <span>البداية (25 سبت)</span>
                    <span>الأسبوع 1</span>
                    <span>الأسبوع 2</span>
                    <span>الأسبوع 3 (9 أكت)</span>
                  </div>
                </div>
              </section>

              <!-- 3. Coach Feedback Card (Latest approved review) -->
              <section class="apple-fitness-card p-4 space-y-2.5">
                <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-[#007AFF] text-white flex items-center justify-center text-[10px] font-bold">
                      KZ
                    </div>
                    <span class="text-[13.5px] font-bold text-[#1C1C1E]">توجيه الكوتش كريم</span>
                  </div>
                  <span class="apple-badge-blue">متابعة الأسبوع 3</span>
                </div>
                <p class="text-[12px] text-[#3A3A3C] leading-relaxed">
                  تطور استثنائي يا أحمد، التزامك بالأوزان والعدات ممتاز والخصر في نزول مستمر وثابت بدون خسارة طاقة. سنحافظ على نفس عجز السعرات للأسبوع القادم مع التركيز على استقرار النوم 7 ساعات يومياً.
                </p>
                <div class="text-[10px] text-[#8E8E93] text-left" dir="ltr">
                  الجمعة 9 أكتوبر 2026 — 02:45 م
                </div>
              </section>

              <!-- 4. Grouped Past Submissions (Apple Health List Rows) -->
              <section class="space-y-2">
                <h3 class="text-[13px] font-bold text-[#8E8E93] px-1">سجل المتابعات المعتمدة</h3>

                <!-- Week 3 Row -->
                <div class="apple-fitness-card p-3.5 space-y-2">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-[13.5px] font-bold text-[#1C1C1E] block">الأسبوع 3</span>
                      <span class="text-[11px] text-[#8E8E93]">الجمعة 9 أكتوبر 2026</span>
                    </div>
                    <span class="apple-badge-green">معتمدة</span>
                  </div>
                  <div class="flex items-center gap-2 pt-0.5">
                    <span class="px-2.5 py-1 bg-[#F2F2F7] rounded-full text-[11px] font-bold text-[#1C1C1E]">
                      الوزن: <span class="font-inter">83.0 كجم</span>
                    </span>
                    <span class="px-2.5 py-1 bg-[#F2F2F7] rounded-full text-[11px] font-bold text-[#1C1C1E]">
                      الخصر: <span class="font-inter">84.5 سم</span>
                    </span>
                    <span class="px-2.5 py-1 bg-[#F2F2F7] rounded-full text-[11px] font-bold text-[#34C759]">
                      الالتزام: 100%
                    </span>
                  </div>
                </div>

                <!-- Week 2 Row -->
                <div class="apple-fitness-card p-3.5 space-y-2">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-[13.5px] font-bold text-[#1C1C1E] block">الأسبوع 2</span>
                      <span class="text-[11px] text-[#8E8E93]">الجمعة 2 أكتوبر 2026</span>
                    </div>
                    <span class="apple-badge-green">معتمدة</span>
                  </div>
                  <div class="flex items-center gap-2 pt-0.5">
                    <span class="px-2.5 py-1 bg-[#F2F2F7] rounded-full text-[11px] font-bold text-[#1C1C1E]">
                      الوزن: <span class="font-inter">83.8 كجم</span>
                    </span>
                    <span class="px-2.5 py-1 bg-[#F2F2F7] rounded-full text-[11px] font-bold text-[#1C1C1E]">
                      الخصر: <span class="font-inter">85.5 سم</span>
                    </span>
                    <span class="px-2.5 py-1 bg-[#F2F2F7] rounded-full text-[11px] font-bold text-[#007AFF]">
                      الالتزام: 90%
                    </span>
                  </div>
                </div>

                <!-- Week 1 Row -->
                <div class="apple-fitness-card p-3.5 space-y-2">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-[13.5px] font-bold text-[#1C1C1E] block">الأسبوع 1</span>
                      <span class="text-[11px] text-[#8E8E93]">البداية 25 سبتمبر 2026</span>
                    </div>
                    <span class="apple-badge-green">معتمدة</span>
                  </div>
                  <div class="flex items-center gap-2 pt-0.5">
                    <span class="px-2.5 py-1 bg-[#F2F2F7] rounded-full text-[11px] font-bold text-[#1C1C1E]">
                      الوزن: <span class="font-inter">86.0 كجم</span>
                    </span>
                    <span class="px-2.5 py-1 bg-[#F2F2F7] rounded-full text-[11px] font-bold text-[#1C1C1E]">
                      الخصر: <span class="font-inter">88.0 سم</span>
                    </span>
                    <span class="px-2.5 py-1 bg-[#F2F2F7] rounded-full text-[11px] font-bold text-[#34C759]">
                      الالتزام: 100%
                    </span>
                  </div>
                </div>
              </section>

            </div>

            <div class="h-4"></div>
          </div>\n\n          `;

content = content.slice(0, checkinStartIndex) + newCheckinMarkup + content.slice(checkinEndIndex);
console.log('Replaced checkin screen markup with Phase 03 Apple Health polish');

// 4. Replace Checkin JavaScript functions
const jsStartMarker = '// Checkin Screen Actions';
const jsEndMarker = 'function openAccountModal() {';

const jsStartIndex = content.indexOf(jsStartMarker);
const jsEndIndex = content.indexOf(jsEndMarker);

if (jsStartIndex === -1 || jsEndIndex === -1) {
  console.error('Could not find JS checkin markers', { jsStartIndex, jsEndIndex });
  process.exit(1);
}

const newCheckinJs = `// Checkin Screen Actions & State Management (Phase 03 Apple Health Polish)
    let currentCheckinState = 'due'; // upcoming | due | submitted | expired
    let currentCheckinUnit = 'metric';      // metric (kg/cm) | imperial (lb/in)
    let checkinBodyWeight = 82.5;
    let checkinWaistCircumference = 84.0;
    const checkinBaselineWeight = 83.0;
    const checkinBaselineWaist = 84.5;

    function toggleCheckinView(mode) {
      const tabForm = document.getElementById('chk-tab-form');
      const tabHist = document.getElementById('chk-tab-history');
      const modeForm = document.getElementById('checkin-mode-form');
      const modeHist = document.getElementById('checkin-mode-history');

      if (mode === 'form') {
        if (tabForm) tabForm.className = "flex-1 h-[34px] rounded-full text-[12px] font-bold bg-white text-[#007AFF] shadow-xs transition-all text-center flex items-center justify-center cursor-pointer";
        if (tabHist) tabHist.className = "flex-1 h-[34px] rounded-full text-[12px] font-semibold text-[#8E8E93] hover:text-[#1C1C1E] transition-all text-center flex items-center justify-center cursor-pointer";
        if (modeForm) modeForm.classList.remove('hidden');
        if (modeHist) modeHist.classList.add('hidden');
      } else {
        if (tabHist) tabHist.className = "flex-1 h-[34px] rounded-full text-[12px] font-bold bg-white text-[#007AFF] shadow-xs transition-all text-center flex items-center justify-center cursor-pointer";
        if (tabForm) tabForm.className = "flex-1 h-[34px] rounded-full text-[12px] font-semibold text-[#8E8E93] hover:text-[#1C1C1E] transition-all text-center flex items-center justify-center cursor-pointer";
        if (modeForm) modeForm.classList.add('hidden');
        if (modeHist) modeHist.classList.remove('hidden');
      }
    }

    function setCheckinState(state) {
      currentCheckinState = state;
      ['due', 'upcoming', 'submitted', 'expired'].forEach(s => {
        const btn = document.getElementById('btn-chk-' + s);
        if (btn) {
          if (s === state) {
            btn.className = "px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#007AFF] text-white shadow-xs transition-all cursor-pointer";
          } else {
            btn.className = "px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-all cursor-pointer";
          }
        }
      });

      renderCheckinScheduleCard();

      // If checkin tab is not active, switch to it so user sees the change
      if (activeTab !== 3) {
        switchTab(3);
      }
    }

    function renderCheckinScheduleCard() {
      const container = document.getElementById('chk-schedule-card');
      const headerBadge = document.getElementById('chk-header-badge');
      const interactiveArea = document.getElementById('chk-interactive-area');
      const submitBtn = document.getElementById('chk-submit-btn');

      if (!container) return;

      if (currentCheckinState === 'upcoming') {
        if (headerBadge) headerBadge.innerHTML = \`<span class="apple-badge-green whitespace-nowrap text-[10.5px]">متبقي 6 أيام</span>\`;
        container.innerHTML = \`
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-[8px] bg-[#34C759]/10 text-[#34C759] flex items-center justify-center">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <span class="text-[13px] font-bold text-[#1C1C1E]">موعد المتابعة القادمة</span>
              </div>
              <span class="apple-badge-green font-inter text-[10.5px]">متبقي 6 أيام</span>
            </div>
            <div>
              <h3 class="text-[16px] font-black text-[#1C1C1E] tracking-tight">الجمعة 23 أكتوبر 2026</h3>
              <p class="text-[12px] text-[#8E8E93] mt-1 leading-relaxed">
                الاستمارة تفتح تلقائياً في موعد الاستحقاق لمدة 72 ساعة لتسجيل قياسات الصباح. يمكنك مراجعة سجلك التراكمي في أي وقت.
              </p>
            </div>
            <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span class="text-[11.5px] text-[#8E8E93]">الخطة: MAX (أسبوعية)</span>
              <button type="button" onclick="toggleCheckinView('history')" class="text-[12px] font-bold text-[#007AFF] hover:underline cursor-pointer">
                عرض سجل التطور ←
              </button>
            </div>
          </div>
        \`;
        if (interactiveArea) interactiveArea.classList.add('opacity-40', 'pointer-events-none');
      } 
      else if (currentCheckinState === 'due') {
        if (headerBadge) headerBadge.innerHTML = \`<span class="apple-badge-orange whitespace-nowrap text-[10.5px]">مستحقة (48س)</span>\`;
        container.innerHTML = \`
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-[8px] bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <span class="text-[13px] font-bold text-[#1C1C1E]">نافذة المتابعة مفتوحة الآن</span>
              </div>
              <span class="apple-badge-orange font-inter text-[10.5px]">متبقي 48 ساعة</span>
            </div>
            <div>
              <h3 class="text-[15.5px] font-black text-[#1C1C1E] tracking-tight">متابعة الأسبوع 4 — الجمعة 16 أكتوبر</h3>
              <p class="text-[11.5px] text-[#48484A] mt-1 leading-relaxed">
                يرجى تسجيل وزن الصباح ومحيط الخصر على الريق قبل تناول وجبة الإفطار لمطابقة تطورك بدقة مع الكوتش.
              </p>
            </div>
          </div>
        \`;
        if (interactiveArea) interactiveArea.classList.remove('opacity-40', 'pointer-events-none');
        if (submitBtn) {
          submitBtn.innerHTML = \`
            <span>إرسال تقييم المتابعة للمدرب</span>
            <svg class="w-4 h-4 rtl:rotate-180 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          \`;
          submitBtn.className = "w-full h-[52px] rounded-full apple-btn-primary text-white font-bold text-[15px] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer";
        }
      } 
      else if (currentCheckinState === 'submitted') {
        if (headerBadge) headerBadge.innerHTML = \`<span class="apple-badge-blue whitespace-nowrap text-[10.5px]">تم الإرسال</span>\`;
        container.innerHTML = \`
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-[8px] bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span class="text-[13px] font-bold text-[#1C1C1E]">تأكيد استلام المتابعة من السيرفر</span>
              </div>
              <span class="apple-badge-blue text-[10.5px]">قيد المراجعة</span>
            </div>
            <div>
              <h3 class="text-[15.5px] font-black text-[#1C1C1E] tracking-tight">تم إرسال متابعة الأسبوع 4 بنجاح</h3>
              <p class="text-[11.5px] text-[#48484A] mt-1 leading-relaxed">
                بياناتك وقياساتك وصورك وصلت إلى استوديو الكوتش كريم زكريا. سيتم مراجعة التطور واعتماد أي تعديل على الخطة خلال 24 ساعة.
              </p>
            </div>
            <div class="p-2.5 bg-[#F2F2F7] rounded-[12px] text-[10.5px] text-[#636366] flex items-center justify-between">
              <span>كود الإرسال: #CHK-20261016</span>
              <span class="font-inter">16/10/2026 — 08:30 ص</span>
            </div>
          </div>
        \`;
        if (interactiveArea) interactiveArea.classList.add('opacity-40', 'pointer-events-none');
        if (submitBtn) {
          submitBtn.innerHTML = \`<span>تم إرسال المتابعة مسبقاً (غير مكرر)</span>\`;
          submitBtn.className = "w-full h-[52px] rounded-full bg-slate-200 text-slate-500 font-bold text-[14px] cursor-not-allowed flex items-center justify-center gap-2";
        }
      } 
      else if (currentCheckinState === 'expired') {
        if (headerBadge) headerBadge.innerHTML = \`<span class="apple-badge-red whitespace-nowrap text-[10.5px]">منتهية</span>\`;
        container.innerHTML = \`
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-[8px] bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <span class="text-[13px] font-bold text-[#1C1C1E]">انتهت نافذة تسجيل المتابعة</span>
              </div>
              <span class="apple-badge-red text-[10.5px]">نافذة منتهية</span>
            </div>
            <div>
              <h3 class="text-[15.5px] font-black text-[#1C1C1E] tracking-tight">تجاوزت فترة السماح (72 ساعة)</h3>
              <p class="text-[11.5px] text-[#48484A] mt-1 leading-relaxed">
                أُغلقت استمارة متابعة الأسبوع الحالي تلقائياً. لفتح استثناء أو إبلاغ الكوتش بظروفك الخاصة، يمكنك التواصل المباشر عبر واتساب.
              </p>
            </div>
            <a href="https://wa.me/201001060503?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D9%83%D9%88%D8%AA%D8%B4%20%D9%83%D8%B1%D9%8A%D9%85%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D9%81%D8%AA%D8%AD%20%D8%A7%D8%B3%D8%AA%D8%AB%D9%86%D8%A7%D8%A1%20%D9%84%D8%AA%D8%B3%D8%AC%D9%8A%D9%84%20%D8%A7%D9%84%D9%85%D8%AA%D8%A7%D8%A8%D8%B9%D8%A9" target="_blank" class="w-full h-10 rounded-full bg-[#25D366] text-white font-bold text-[12px] flex items-center justify-center gap-2 shadow-2xs hover:bg-[#1EBE5D] transition-all">
              <span>تواصل مع الكوتش كريم عبر واتساب</span>
              <svg class="w-4 h-4 rtl:rotate-180" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2Z"/></svg>
            </a>
          </div>
        \`;
        if (interactiveArea) interactiveArea.classList.add('opacity-40', 'pointer-events-none');
      }
    }

    function toggleCheckinUnits(unit) {
      if (currentCheckinUnit === unit) return;
      currentCheckinUnit = unit;

      const btnMetric = document.getElementById('chk-unit-metric');
      const btnImperial = document.getElementById('chk-unit-imperial');

      if (unit === 'metric') {
        if (btnMetric) btnMetric.className = "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#007AFF] shadow-2xs transition-all";
        if (btnImperial) btnImperial.className = "px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-[#8E8E93] transition-all";
        checkinBodyWeight = 82.5;
        checkinWaistCircumference = 84.0;
      } else {
        if (btnImperial) btnImperial.className = "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#007AFF] shadow-2xs transition-all";
        if (btnMetric) btnMetric.className = "px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-[#8E8E93] transition-all";
        checkinBodyWeight = 181.9;
        checkinWaistCircumference = 33.1;
      }

      updateCheckinMeasurementDisplays();
    }

    function stepCheckinWeight(dir) {
      const step = currentCheckinUnit === 'metric' ? 0.2 : 0.5;
      checkinBodyWeight = Math.max(30, Math.min(300, Number((checkinBodyWeight + (dir * step)).toFixed(1))));
      updateCheckinMeasurementDisplays();
    }

    function stepCheckinWaist(dir) {
      const step = currentCheckinUnit === 'metric' ? 0.5 : 0.2;
      checkinWaistCircumference = Math.max(20, Math.min(200, Number((checkinWaistCircumference + (dir * step)).toFixed(1))));
      updateCheckinMeasurementDisplays();
    }

    function updateCheckinMeasurementDisplays() {
      const wDisplay = document.getElementById('chk-weight-display');
      const waistDisplay = document.getElementById('chk-waist-display');
      const wUnit = document.getElementById('chk-weight-unit');
      const waistUnit = document.getElementById('chk-waist-unit');
      const wBase = document.getElementById('chk-weight-baseline');
      const waistBase = document.getElementById('chk-waist-baseline');
      const wBadge = document.getElementById('chk-weight-delta-badge');
      const waistBadge = document.getElementById('chk-waist-delta-badge');

      const isMetric = currentCheckinUnit === 'metric';
      const uW = isMetric ? 'كجم' : 'lb';
      const uWaist = isMetric ? 'سم' : 'in';
      const baseW = isMetric ? 83.0 : 183.0;
      const baseWaist = isMetric ? 84.5 : 33.3;

      if (wDisplay) wDisplay.innerText = checkinBodyWeight.toFixed(1);
      if (waistDisplay) waistDisplay.innerText = checkinWaistCircumference.toFixed(1);
      if (wUnit) wUnit.innerText = uW;
      if (waistUnit) waistUnit.innerText = uWaist;
      if (wBase) wBase.innerText = baseW.toFixed(1);
      if (waistBase) waistBase.innerText = baseWaist.toFixed(1);

      const weightDiff = Number((checkinBodyWeight - baseW).toFixed(1));
      const waistDiff = Number((checkinWaistCircumference - baseWaist).toFixed(1));

      if (wBadge) {
        if (weightDiff < 0) {
          wBadge.className = "apple-badge-green text-[9.5px] px-1.5 py-0.5 font-inter font-bold whitespace-nowrap";
          wBadge.innerText = \`\${weightDiff} \${isMetric ? 'kg' : 'lb'}\`;
        } else if (weightDiff > 0) {
          wBadge.className = "apple-badge-orange text-[9.5px] px-1.5 py-0.5 font-inter font-bold whitespace-nowrap";
          wBadge.innerText = \`+\${weightDiff} \${isMetric ? 'kg' : 'lb'}\`;
        } else {
          wBadge.className = "apple-badge-tint apple-badge-tint-gray text-[9.5px] px-1.5 py-0.5 font-inter font-bold whitespace-nowrap";
          wBadge.innerText = "ثابت";
        }
      }

      if (waistBadge) {
        if (waistDiff < 0) {
          waistBadge.className = "apple-badge-green text-[9.5px] px-1.5 py-0.5 font-inter font-bold whitespace-nowrap";
          waistBadge.innerText = \`\${waistDiff} \${isMetric ? 'cm' : 'in'}\`;
        } else if (waistDiff > 0) {
          waistBadge.className = "apple-badge-orange text-[9.5px] px-1.5 py-0.5 font-inter font-bold whitespace-nowrap";
          waistBadge.innerText = \`+\${waistDiff} \${isMetric ? 'cm' : 'in'}\`;
        } else {
          waistBadge.className = "apple-badge-tint apple-badge-tint-gray text-[9.5px] px-1.5 py-0.5 font-inter font-bold whitespace-nowrap";
          waistBadge.innerText = "ثابت";
        }
      }
    }

    function setCheckinOption(cat, val, label, btn) {
      if (!btn) return;
      btn.parentElement.querySelectorAll('button').forEach(b => {
        b.className = b.className.replace('apple-segment-active', 'apple-segment-inactive');
      });
      btn.className = btn.className.replace('apple-segment-inactive', 'apple-segment-active');

      const labelMap = {
        'sleep': 'chk-sleep-label',
        'adherence': 'chk-adherence-label',
        'digestion': 'chk-digestion-label',
        'hunger': 'chk-hunger-label',
        'activity': 'chk-activity-label',
        'circumstances': 'chk-circumstances-label',
        'cycle': 'chk-cycle-label'
      };

      const lblEl = document.getElementById(labelMap[cat]);
      if (lblEl) lblEl.innerText = label;
    }

    function triggerCheckinPhoto(pose) {
      const fileInput = document.getElementById('chk-file-' + pose);
      if (fileInput) fileInput.click();
    }

    function handleCheckinPhotoFile(pose, input) {
      if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const preview = document.getElementById('chk-preview-' + pose);
          const placeholder = document.getElementById('chk-placeholder-' + pose);
          if (preview) {
            preview.style.backgroundImage = \`url('\${e.target.result}')\`;
            preview.classList.remove('hidden');
          }
          if (placeholder) placeholder.classList.add('hidden');
          showToast(\`تم إرفاق صورة \${pose === 'front' ? 'الزاوية الأمامية' : (pose === 'side' ? 'الجانبية' : 'الخلفية')} بنجاح\`);
        };
        reader.readAsDataURL(input.files[0]);
      }
    }

    function removeCheckinPhoto(pose) {
      const preview = document.getElementById('chk-preview-' + pose);
      const placeholder = document.getElementById('chk-placeholder-' + pose);
      const fileInput = document.getElementById('chk-file-' + pose);
      if (preview) preview.classList.add('hidden');
      if (placeholder) placeholder.classList.remove('hidden');
      if (fileInput) fileInput.value = '';
    }

    function submitCheckinForm() {
      showToast('جاري إرسال المتابعة الأسبوعية إلى الكوتش كريم...');
      setTimeout(() => {
        setCheckinState('submitted');
        showToast('تم استلام المتابعة بنجاح وحفظها في قاعدة البيانات (#CHK-20261016)');
      }, 700);
    }

    `;

content = content.slice(0, jsStartIndex) + newCheckinJs + content.slice(jsEndIndex);
console.log('Replaced checkin JavaScript functions');

// 5. Update initialization to call renderCheckinScheduleCard
if (!content.includes('renderCheckinScheduleCard();')) {
  content = content.replace('renderNutritionCard();', 'renderNutritionCard();\n        renderCheckinScheduleCard();');
  console.log('Hooked renderCheckinScheduleCard into init');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated mobile_app_preview.html with Phase 03 Apple Health Polish!');
