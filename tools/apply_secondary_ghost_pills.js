import fs from 'fs';

console.log('--- Applying Secondary Ghost Pill Buttons ---');

const cssRules = `
    /* =========================================================================
       Design System Button Hierarchy
       Tier 1: Primary Filled Button
       Tier 2: Secondary Ghost Pill Button (.btn-ghost-pill)
       Tier 3: Tertiary Text Button
       ========================================================================= */
    .btn-ghost-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4.5px;
      height: 26px;
      padding: 0 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      color: #284C7C;
      background-color: #F8FBFF;
      border: 1px solid #D9E7F5;
      text-decoration: none !important;
      cursor: pointer;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
      white-space: nowrap;
      line-height: 1;
      position: relative;
      -webkit-tap-highlight-color: transparent;
      outline: none;
      box-shadow: none;
    }

    .btn-ghost-pill:hover {
      background-color: #EBF4FE;
      border-color: #C5DBF0;
      color: #0F172A;
    }

    .btn-ghost-pill:active {
      background-color: #E1EFFD;
      border-color: #B4D3EC;
      color: #0F172A;
      transform: scale(0.97);
    }

    .btn-ghost-pill:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(40, 76, 124, 0.15);
    }

    /* Expanding touch area to guarantee >= 44x44px touch target on touch devices */
    .btn-ghost-pill::after {
      content: '';
      position: absolute;
      top: -9px;
      bottom: -9px;
      left: -6px;
      right: -6px;
    }

    .btn-ghost-pill-sm {
      height: 24px;
      padding: 0 8px;
      font-size: 10.5px;
      gap: 3.5px;
    }
  </style>`;

// Process mobile_app_preview.html
let previewHtml = fs.readFileSync('frontend/public/mobile_app_preview.html', 'utf8');

if (!previewHtml.includes('.btn-ghost-pill {')) {
  previewHtml = previewHtml.replace('  </style>', cssRules);
}

// 1. "عرض الوجبات" in static card
previewHtml = previewHtml.replace(
  /<button onclick="switchTab\(2\)" class="text-\[11\.5px\] font-semibold text-\[#0284C7\] hover:text-\[#0369A1\] transition-colors flex items-center gap-1 leading-none" aria-label="عرض الوجبات">[\s\S]*?<\/button>/,
  `<button onclick="switchTab(2)" class="btn-ghost-pill" aria-label="عرض الوجبات">
                  <span>عرض الوجبات</span>
                  <svg class="w-3.5 h-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>`
);

// 2. "عرض الوجبات" in renderNutritionCard (Styles A, B, C)
const oldNutrBtn = `<button onclick="switchTab(2)" class="text-[11.5px] font-semibold text-[#0284C7] hover:text-[#0369A1] transition-colors flex items-center gap-1 leading-none" aria-label="عرض الوجبات">
              <span>عرض الوجبات</span>
              <span class="text-[11px] leading-none">&larr;</span>
            </button>`;

const newNutrBtn = `<button onclick="switchTab(2)" class="btn-ghost-pill" aria-label="عرض الوجبات">
              <span>عرض الوجبات</span>
              <svg class="w-3.5 h-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>`;

previewHtml = previewHtml.replaceAll(oldNutrBtn, newNutrBtn);

// 3. "المتابعات السابقة" in static checkin card
previewHtml = previewHtml.replace(
  /<button onclick="switchTab\(3\)" class="text-\[11\.5px\] font-semibold text-\[#0284C7\] hover:underline flex items-center gap-1 leading-none" aria-label="المتابعات السابقة">[\s\S]*?<\/button>/,
  `<button onclick="switchTab(3)" class="btn-ghost-pill" aria-label="المتابعات السابقة">
                  <span>المتابعات السابقة</span>
                  <svg class="w-3.5 h-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>`
);

// 4. "زي آخر مرة" in Exercise Card 1
previewHtml = previewHtml.replace(
  /<button onclick="fillLastDynamic\(1\)" class="h-5\.5 px-2\.5 rounded-full bg-\[#F0F7FF\] hover:bg-\[#E0F2FE\] text-\[#0284C7\] text-\[10\.5px\] font-semibold transition-colors flex items-center gap-1">[\s\S]*?<\/button>/,
  `<button onclick="fillLastDynamic(1)" class="btn-ghost-pill btn-ghost-pill-sm">
                      <svg class="w-3.5 h-3.5 text-[#284C7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                      <span>زي آخر مرة</span>
                      <span id="last-perf-1" class="text-[#64748B] text-[11px] font-medium">· 45 كجم × 10</span>
                    </button>`
);

// 5. "زي آخر مرة" in Exercise Card 2
previewHtml = previewHtml.replace(
  /<button onclick="fillLastDynamic\(2\)" class="h-5\.5 px-2\.5 rounded-full bg-\[#F0F7FF\] hover:bg-\[#E0F2FE\] text-\[#0284C7\] text-\[10\.5px\] font-semibold transition-colors flex items-center gap-1">[\s\S]*?<\/button>/,
  `<button onclick="fillLastDynamic(2)" class="btn-ghost-pill btn-ghost-pill-sm">
                      <svg class="w-3.5 h-3.5 text-[#284C7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                      <span>زي آخر مرة</span>
                      <span id="last-perf-2" class="text-[#64748B] text-[11px] font-medium">· 20 كجم × 10</span>
                    </button>`
);

// 6. "تعليمات التكنيك والفيديو" in Exercise Card 1
previewHtml = previewHtml.replace(
  /<button onclick="toggleSection\('tech1'\)" class="w-full flex items-center justify-between text-\[#64748B\] hover:text-\[#0284C7\] transition-colors py-0\.5 text-\[11\.5px\] font-medium">[\s\S]*?<\/button>/,
  `<button onclick="toggleSection('tech1')" class="btn-ghost-pill w-full justify-between" aria-label="تعليمات التكنيك والفيديو">
                    <span class="flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5 text-[#284C7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <span>تعليمات التكنيك والفيديو</span>
                    </span>
                    <svg id="tech1-arrow" class="w-3.5 h-3.5 text-[#284C7C] transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
                  </button>`
);

// 7. "تعليمات التكنيك والفيديو" in Exercise Card 2
previewHtml = previewHtml.replace(
  /<button onclick="toggleSection\('tech2'\)" class="w-full flex items-center justify-between text-\[#64748B\] hover:text-\[#0284C7\] transition-colors py-0\.5 text-\[11\.5px\] font-medium">[\s\S]*?<\/button>/,
  `<button onclick="toggleSection('tech2')" class="btn-ghost-pill w-full justify-between" aria-label="تعليمات التكنيك والفيديو">
                    <span class="flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5 text-[#284C7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <span>تعليمات التكنيك والفيديو</span>
                    </span>
                    <svg id="tech2-arrow" class="w-3.5 h-3.5 text-[#284C7C] transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
                  </button>`
);

// 8. "زي آخر مرة" & "تعليمات التكنيك والفيديو" in JS renderSessionCard / selectSession
previewHtml = previewHtml.replace(
  /<button onclick="fillLastDynamic\(\$\{idx\}, \$\{ex\.defaultWeight\}, \$\{ex\.defaultReps\}\)" class="h-5 px-2 rounded-full bg-\[#F0F7FF\] hover:bg-\[#E0F2FE\] text-\[#0284C7\] text-\[10px\] font-semibold transition-colors flex items-center gap-1">[\s\S]*?<\/button>/,
  `<button onclick="fillLastDynamic(\${idx}, \${ex.defaultWeight}, \${ex.defaultReps})" class="btn-ghost-pill btn-ghost-pill-sm">
                <svg class="w-3.5 h-3.5 text-[#284C7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                <span>زي آخر مرة</span>
                <span class="text-[#64748B] text-[10.5px] font-medium">· \${ex.defaultWeight} كجم × \${ex.defaultReps}</span>
              </button>`
);

previewHtml = previewHtml.replace(
  /<button onclick="toggleSection\('tech\$\{idx\}'\)" class="w-full flex items-center justify-between text-\[#64748B\] hover:text-\[#0284C7\] transition-colors py-0\.5 text-\[10\.5px\] font-medium">[\s\S]*?<\/button>/,
  `<button onclick="toggleSection('tech\${idx}')" class="btn-ghost-pill w-full justify-between" aria-label="تعليمات التكنيك والفيديو">
              <span class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-[#284C7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>تعليمات التكنيك والفيديو</span>
              </span>
              <svg id="tech\${idx}-arrow" class="w-3.5 h-3.5 text-[#284C7C] transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
            </button>`
);

// 9. All "تبديل" buttons in Meals tab
previewHtml = previewHtml.replaceAll(
  'class="h-7 px-3 bg-[#F0F7FF] hover:bg-[#E0F2FE] border border-[#E0F2FE] text-[#0284C7] rounded-[8px] text-[11px] font-bold transition-all shadow-2xs">\n                      تبديل\n                    </button>',
  `class="btn-ghost-pill btn-ghost-pill-sm">\n                      <svg class="w-3.5 h-3.5 text-[#284C7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>\n                      <span>تبديل</span>\n                    </button>`
);

previewHtml = previewHtml.replaceAll(
  'class="h-7 px-3 bg-[#F0F7FF] hover:bg-[#E0F2FE] border border-[#E0F2FE] text-[#0284C7] rounded-[8px] text-[11px] font-bold transition-all shadow-2xs">\n                    تبديل\n                  </button>',
  `class="btn-ghost-pill btn-ghost-pill-sm">\n                    <svg class="w-3.5 h-3.5 text-[#284C7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>\n                    <span>تبديل</span>\n                  </button>`
);

// 10. Coach notes card: add "سجل الملاحظات"
previewHtml = previewHtml.replace(
  `<div class="flex items-center justify-between pb-1.5 border-b border-[#F8FAFC]">
                  <span class="text-[13.5px] font-bold text-[#0F172A]">ملاحظات الكوتش كريم زكريا:</span>
                  <span class="text-[10.5px] text-[#0284C7] bg-[#F0F7FF] px-2.5 py-0.5 rounded-full font-bold">الأسبوع 3</span>
                </div>`,
  `<div class="flex items-center justify-between pb-1.5 border-b border-[#F8FAFC]">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[13.5px] font-bold text-[#0F172A]">ملاحظات الكوتش</span>
                    <span class="text-[10.5px] text-[#0284C7] bg-[#F0F7FF] px-2 py-0.5 rounded-full font-bold">الأسبوع 3</span>
                  </div>
                  <button onclick="showToast('سجل ملاحظات الكوتش للأسبوع الحالي والأسابيع السابقة')" class="btn-ghost-pill btn-ghost-pill-sm" aria-label="سجل الملاحظات">
                    <svg class="w-3.5 h-3.5 text-[#284C7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <span>سجل الملاحظات</span>
                  </button>
                </div>`
);

// 11. Add "عرض التفاصيل" in History cards
previewHtml = previewHtml.replace(
  `<div class="flex items-center justify-between">
                    <div>
                      <span class="font-bold text-[#0F172A] text-[13.5px] block">الأسبوع 3</span>
                      <span class="text-[11px] text-[#64748B] font-normal block mt-0.5">الجمعة 9 أكتوبر 2026</span>
                    </div>
                    <span class="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">معتمدة</span>
                  </div>`,
  `<div class="flex items-center justify-between">
                    <div>
                      <span class="font-bold text-[#0F172A] text-[13.5px] block">الأسبوع 3</span>
                      <span class="text-[11px] text-[#64748B] font-normal block mt-0.5">الجمعة 9 أكتوبر 2026</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">معتمدة</span>
                      <button onclick="showToast('عرض تفاصيل متابعة الأسبوع 3 (القياسات والصور)')" class="btn-ghost-pill btn-ghost-pill-sm" aria-label="عرض التفاصيل">
                        <span>عرض التفاصيل</span>
                        <svg class="w-3.5 h-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                      </button>
                    </div>
                  </div>`
);

previewHtml = previewHtml.replace(
  `<div class="flex items-center justify-between">
                    <div>
                      <span class="font-bold text-[#0F172A] text-[13.5px] block">الأسبوع 2</span>
                      <span class="text-[11px] text-[#64748B] font-normal block mt-0.5">الجمعة 2 أكتوبر 2026</span>
                    </div>
                    <span class="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">معتمدة</span>
                  </div>`,
  `<div class="flex items-center justify-between">
                    <div>
                      <span class="font-bold text-[#0F172A] text-[13.5px] block">الأسبوع 2</span>
                      <span class="text-[11px] text-[#64748B] font-normal block mt-0.5">الجمعة 2 أكتوبر 2026</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">معتمدة</span>
                      <button onclick="showToast('عرض تفاصيل متابعة الأسبوع 2 (القياسات والصور)')" class="btn-ghost-pill btn-ghost-pill-sm" aria-label="عرض التفاصيل">
                        <span>عرض التفاصيل</span>
                        <svg class="w-3.5 h-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                      </button>
                    </div>
                  </div>`
);

fs.writeFileSync('frontend/public/mobile_app_preview.html', previewHtml, 'utf8');
console.log('Updated mobile_app_preview.html successfully.');

// Also update mobile_home_pure.html
let pureHtml = fs.readFileSync('frontend/public/mobile_home_pure.html', 'utf8');
if (!pureHtml.includes('.btn-ghost-pill {')) {
  pureHtml = pureHtml.replace('  </style>', cssRules);
}

pureHtml = pureHtml.replace(
  /<button onclick="switchTab\(2\)" class="text-\[11\.5px\] font-semibold text-\[#0284C7\] hover:text-\[#0369A1\] transition-colors flex items-center gap-1 leading-none" aria-label="عرض الوجبات">[\s\S]*?<\/button>/,
  `<button onclick="switchTab(2)" class="btn-ghost-pill" aria-label="عرض الوجبات">
            <span>عرض الوجبات</span>
            <svg class="w-3.5 h-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>`
);

pureHtml = pureHtml.replace(
  /<button onclick="switchTab\(3\)" class="text-\[10\.5px\] font-semibold text-\[#0284C7\] hover:underline flex items-center gap-1">[\s\S]*?<\/button>/,
  `<button onclick="switchTab(3)" class="btn-ghost-pill" aria-label="المتابعات السابقة">
            <span>المتابعات السابقة</span>
            <svg class="w-3.5 h-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>`
);

// Exercise repeat in pureHtml
pureHtml = pureHtml.replaceAll(
  /<button onclick="fillLastDynamic\(1, 45, 10\)" class="h-5 px-2 rounded-full bg-\[#F0F7FF\] hover:bg-\[#E0F2FE\] text-\[#0284C7\] text-\[10px\] font-semibold transition-colors flex items-center gap-1">[\s\S]*?<\/button>/g,
  `<button onclick="fillLastDynamic(1, 45, 10)" class="btn-ghost-pill btn-ghost-pill-sm">
                <svg class="w-3.5 h-3.5 text-[#284C7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                <span>زي آخر مرة</span>
                <span class="text-[#64748B] text-[10.5px] font-medium">· 45 كجم × 10</span>
              </button>`
);

pureHtml = pureHtml.replaceAll(
  /<button onclick="fillLastDynamic\(2, 20, 10\)" class="h-5 px-2 rounded-full bg-\[#F0F7FF\] hover:bg-\[#E0F2FE\] text-\[#0284C7\] text-\[10px\] font-semibold transition-colors flex items-center gap-1">[\s\S]*?<\/button>/g,
  `<button onclick="fillLastDynamic(2, 20, 10)" class="btn-ghost-pill btn-ghost-pill-sm">
                <svg class="w-3.5 h-3.5 text-[#284C7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                <span>زي آخر مرة</span>
                <span class="text-[#64748B] text-[10.5px] font-medium">· 20 كجم × 10</span>
              </button>`
);

// Technique buttons in pureHtml
pureHtml = pureHtml.replace(
  /<button onclick="openTechniqueSheet\('Machine Chest Press'[\s\S]*?<\/button>/,
  `<button onclick="openTechniqueSheet('Machine Chest Press', 'دفع صدر بالجهاز', 'ثبات لوحي الكتف على المقعد، والنزول بالمقابض بمدى حركي كامل ومتحكم به حتى خط الصدر مع تجنب قفل المفاصل في الصعود.', '/exercises/CHEST_PRESS_MACHINE/0.jpg')" class="btn-ghost-pill w-full justify-between" aria-label="تعليمات التكنيك والفيديو">
              <span class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-[#284C7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>تعليمات التكنيك والفيديو</span>
              </span>
              <svg class="w-3.5 h-3.5 text-[#284C7C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
            </button>`
);

pureHtml = pureHtml.replace(
  /<button onclick="openTechniqueSheet\('Incline Dumbbell Bench Press'[\s\S]*?<\/button>/,
  `<button onclick="openTechniqueSheet('Incline Dumbbell Bench Press', 'دفع بالدمبل بنش عالي', 'ضبط زاوية المقعد على 30 درجة، دفع الدمبل للأعلى بمسار مقوس خفيف والنزول في 2-3 ثوانٍ لتحفيز التمدد العضلي بأمان دون طقطقة أو ارتطام.', '/exercises/INCLINE_DUMBBELL_BENCH_PRESS/0.jpg')" class="btn-ghost-pill w-full justify-between" aria-label="تعليمات التكنيك والفيديو">
              <span class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-[#284C7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>تعليمات التكنيك والفيديو</span>
              </span>
              <svg class="w-3.5 h-3.5 text-[#284C7C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
            </button>`
);

// All "تبديل" buttons in pureHtml meals
pureHtml = pureHtml.replaceAll(
  'class="h-7 px-3 bg-[#F0F7FF] hover:bg-[#E0F2FE] border border-[#E0F2FE] text-[#0284C7] rounded-[8px] text-[11px] font-bold transition-all shadow-2xs">\n                تبديل\n              </button>',
  `class="btn-ghost-pill btn-ghost-pill-sm">\n                <svg class="w-3.5 h-3.5 text-[#284C7C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>\n                <span>تبديل</span>\n              </button>`
);

fs.writeFileSync('frontend/public/mobile_home_pure.html', pureHtml, 'utf8');
console.log('Updated mobile_home_pure.html successfully.');
