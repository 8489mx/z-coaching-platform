import fs from 'fs';

const filePath = 'frontend/public/mobile_app_preview.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace screen-nutrition
const screenNutritionStartTag = '<div id="screen-nutrition"';
const screenNutritionEndTag = '<div id="screen-checkin"';

const startIndex = content.indexOf(screenNutritionStartTag);
const endIndex = content.indexOf(screenNutritionEndTag);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not locate screen-nutrition boundaries');
  process.exit(1);
}

const newScreenNutrition = `<div id="screen-nutrition" class="hidden apple-canvas-bg px-4 py-3.5 space-y-3.5 pb-32 sm:px-5 sm:space-y-4">

            <!-- Header (Apple Large Title Style) -->
            <section class="flex items-center justify-between pt-1 pb-0.5 select-none">
              <h1 class="text-[25px] font-black text-[#1C1C1E] tracking-tight leading-tight">التغذية</h1>
              <span class="apple-badge-tint apple-badge-tint-blue text-[11px] font-bold px-3 py-1 rounded-full border border-[#007AFF]/15">4 وجبات مقررة</span>
            </section>

            <!-- Cooking Weight Policy Banner (Soft Apple Tactile Strip) -->
            <div class="flex items-center gap-2.5 bg-white rounded-[14px] px-3.5 py-2.5 text-[11px] font-medium text-[#48484A] shadow-2xs border border-slate-100">
              <div class="w-5 h-5 rounded-full bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center shrink-0">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              </div>
              <span class="leading-relaxed">جميع أوزان الأطعمة محسوبة ومسجلة قبل الطهي (نيئة) مالم يُذكر خلاف ذلك.</span>
            </div>

            <!-- Macro Targets Summary (Apple Health Style - Unified Visual Strip) -->
            <section class="apple-fitness-card p-4 space-y-3.5 bg-white rounded-[20px] shadow-2xs border border-slate-100/70">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-[30px] font-black text-[#1C1C1E] leading-none font-inter tracking-tight">2,450</div>
                  <div class="text-[11px] font-medium text-[#8E8E93] mt-1">سعرة حرارية مقررة</div>
                </div>
                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#007AFF]/8 text-[#007AFF] text-[11.5px] font-bold border border-[#007AFF]/15">
                  <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                  <span>ماء 3.5 لتر/اليوم</span>
                </div>
              </div>

              <!-- UNIFIED MACRO STRIP (Zero Nested Cards) -->
              <div class="bg-[#F8FAFC] rounded-[14px] p-2.5 flex items-center divide-x divide-x-reverse divide-slate-200/80 border border-slate-100">
                <!-- Protein -->
                <div class="flex-1 text-center px-1">
                  <div class="text-[11px] font-bold text-[#007AFF] mb-0.5">البروتين</div>
                  <div class="text-[17px] font-black text-[#1C1C1E] font-inter leading-none">180<span class="text-[10px] font-semibold text-[#8E8E93] mr-0.5">جم</span></div>
                </div>
                <!-- Carbs -->
                <div class="flex-1 text-center px-1">
                  <div class="text-[11px] font-bold text-[#FF2D55] mb-0.5">الكارب</div>
                  <div class="text-[17px] font-black text-[#1C1C1E] font-inter leading-none">250<span class="text-[10px] font-semibold text-[#8E8E93] mr-0.5">جم</span></div>
                </div>
                <!-- Fats -->
                <div class="flex-1 text-center px-1">
                  <div class="text-[11px] font-bold text-[#AF52DE] mb-0.5">الدهون</div>
                  <div class="text-[17px] font-black text-[#1C1C1E] font-inter leading-none">81<span class="text-[10px] font-semibold text-[#8E8E93] mr-0.5">جم</span></div>
                </div>
              </div>
            </section>

            <!-- Meals List: Apple Inset Grouped Sections -->
            <section class="space-y-3.5">

              <!-- Meal 1: الإفطار (580 سعرة) -->
              <article class="apple-fitness-card bg-white rounded-[20px] p-3.5 shadow-2xs border border-slate-100/70 space-y-2.5">
                <div class="flex items-center justify-between pb-2 border-b border-[#F2F2F7] select-none">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                    </div>
                    <h3 class="text-[14.5px] font-black text-[#1C1C1E] tracking-tight">الإفطار</h3>
                  </div>
                  <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#48484A] font-inter">580 سعرة</span>
                </div>

                <div class="space-y-1">
                  <!-- Food Item 1 -->
                  <div class="py-2.5 flex items-center justify-between gap-3 group">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <img src="assets/food/oats.jpg" alt="شوفان كامل الحبة" class="w-12 h-12 rounded-[12px] object-cover shrink-0 border border-slate-100 shadow-2xs">
                      <div class="min-w-0 flex-1">
                        <div class="text-[13.5px] font-bold text-[#1C1C1E] leading-snug" id="food-m1-item1">شوفان كامل الحبة</div>
                        <div class="text-[12px] font-bold text-[#1C1C1E] font-inter mt-0.5 leading-snug">80 جم</div>
                        <div class="text-[11px] font-normal text-[#8E8E93] mt-0.5 leading-snug font-inter">350 سعرة · 55g كارب</div>
                      </div>
                    </div>
                    <button onclick="openSwapModal('شوفان كامل الحبة', 'food-m1-item1', 'carb')" aria-label="تبديل الصنف" class="h-8 px-2.5 rounded-full bg-[#007AFF]/10 hover:bg-[#007AFF]/20 active:scale-95 text-[#007AFF] flex items-center gap-1 text-[11px] font-bold border border-[#007AFF]/20 shrink-0 self-center transition-all cursor-pointer">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                      <span>تبديل</span>
                    </button>
                  </div>

                  <div class="border-b border-[#F2F2F7] mr-[60px]"></div>

                  <!-- Food Item 2 -->
                  <div class="py-2.5 flex items-center justify-between gap-3 group">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <img src="assets/food/eggs.jpg" alt="بياض بيض + بيضة كاملة" class="w-12 h-12 rounded-[12px] object-cover shrink-0 border border-slate-100 shadow-2xs">
                      <div class="min-w-0 flex-1">
                        <div class="text-[13.5px] font-bold text-[#1C1C1E] leading-snug" id="food-m1-item2">بياض بيض + بيضة كاملة</div>
                        <div class="text-[12px] font-bold text-[#1C1C1E] font-inter mt-0.5 leading-snug">200 جم</div>
                        <div class="text-[11px] font-normal text-[#8E8E93] mt-0.5 leading-snug font-inter">230 سعرة · 30g بروتين</div>
                      </div>
                    </div>
                    <button onclick="openSwapModal('بياض بيض + بيضة كاملة', 'food-m1-item2', 'protein')" aria-label="تبديل الصنف" class="h-8 px-2.5 rounded-full bg-[#007AFF]/10 hover:bg-[#007AFF]/20 active:scale-95 text-[#007AFF] flex items-center gap-1 text-[11px] font-bold border border-[#007AFF]/20 shrink-0 self-center transition-all cursor-pointer">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                      <span>تبديل</span>
                    </button>
                  </div>
                </div>

                <!-- Soft Inline Coach Note -->
                <div class="pt-1">
                  <div class="bg-[#F8FAFC] rounded-[12px] px-3 py-2 flex items-start gap-2 border border-slate-100">
                    <svg class="w-3.5 h-3.5 text-[#007AFF] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <p class="text-[11px] text-[#475569] leading-relaxed">
                      <strong class="font-bold text-[#1C1C1E]">توجيه الكوتش:</strong> ينفع الشوفان مع حليب اللوز أو الماء المغلي مع رشة قرفة.
                    </p>
                  </div>
                </div>
              </article>

              <!-- Meal 2: الغداء (850 سعرة) -->
              <article class="apple-fitness-card bg-white rounded-[20px] p-3.5 shadow-2xs border border-slate-100/70 space-y-2.5">
                <div class="flex items-center justify-between pb-2 border-b border-[#F2F2F7] select-none">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 11v11"/><path d="M6 2v20"/><path d="M9 2v4a3 3 0 0 1-3 3"/></svg>
                    </div>
                    <h3 class="text-[14.5px] font-black text-[#1C1C1E] tracking-tight">الغداء</h3>
                  </div>
                  <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#48484A] font-inter">850 سعرة</span>
                </div>

                <div class="space-y-1">
                  <!-- Food 1 -->
                  <div class="py-2.5 flex items-center justify-between gap-3 group">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <img src="assets/food/chicken.jpg" alt="صدور دجاج مشوية" class="w-12 h-12 rounded-[12px] object-cover shrink-0 border border-slate-100 shadow-2xs">
                      <div class="min-w-0 flex-1">
                        <div class="text-[13.5px] font-bold text-[#1C1C1E] leading-snug" id="food-m2-item1">صدور دجاج مشوية</div>
                        <div class="text-[12px] font-bold text-[#1C1C1E] font-inter mt-0.5 leading-snug">250 جم</div>
                        <div class="text-[11px] font-normal text-[#8E8E93] mt-0.5 leading-snug font-inter">330 سعرة · 55g بروتين</div>
                      </div>
                    </div>
                    <button onclick="openSwapModal('صدور دجاج مشوية', 'food-m2-item1', 'protein')" aria-label="تبديل الصنف" class="h-8 px-2.5 rounded-full bg-[#007AFF]/10 hover:bg-[#007AFF]/20 active:scale-95 text-[#007AFF] flex items-center gap-1 text-[11px] font-bold border border-[#007AFF]/20 shrink-0 self-center transition-all cursor-pointer">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                      <span>تبديل</span>
                    </button>
                  </div>

                  <div class="border-b border-[#F2F2F7] mr-[60px]"></div>

                  <!-- Food 2 -->
                  <div class="py-2.5 flex items-center justify-between gap-3 group">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <img src="assets/food/rice.jpg" alt="أرز بسمتي مسلوق" class="w-12 h-12 rounded-[12px] object-cover shrink-0 border border-slate-100 shadow-2xs">
                      <div class="min-w-0 flex-1">
                        <div class="text-[13.5px] font-bold text-[#1C1C1E] leading-snug" id="food-m2-item2">أرز بسمتي مسلوق</div>
                        <div class="text-[12px] font-bold text-[#1C1C1E] font-inter mt-0.5 leading-snug">280 جم</div>
                        <div class="text-[11px] font-normal text-[#8E8E93] mt-0.5 leading-snug font-inter">380 سعرة · 80g كارب</div>
                      </div>
                    </div>
                    <button onclick="openSwapModal('أرز بسمتي مسلوق', 'food-m2-item2', 'carb')" aria-label="تبديل الصنف" class="h-8 px-2.5 rounded-full bg-[#007AFF]/10 hover:bg-[#007AFF]/20 active:scale-95 text-[#007AFF] flex items-center gap-1 text-[11px] font-bold border border-[#007AFF]/20 shrink-0 self-center transition-all cursor-pointer">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                      <span>تبديل</span>
                    </button>
                  </div>

                  <div class="border-b border-[#F2F2F7] mr-[60px]"></div>

                  <!-- Food 3 (Locked Essential Item) -->
                  <div class="py-2.5 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <img src="assets/food/veggies_oil.jpg" alt="زيت زيتون وخضار" class="w-12 h-12 rounded-[12px] object-cover shrink-0 border border-slate-100 shadow-2xs">
                      <div class="min-w-0 flex-1">
                        <div class="text-[13.5px] font-bold text-[#1C1C1E] leading-snug">زيت زيتون بكر وخضار مشكل</div>
                        <div class="text-[12px] font-bold text-[#1C1C1E] mt-0.5 leading-snug">10 جم زيت + 150 جم خضار</div>
                        <div class="text-[11px] font-normal text-[#8E8E93] mt-0.5 leading-snug font-inter">صنف أساسي · 140 سعرة</div>
                      </div>
                    </div>
                    <div onclick="showLockedFoodNotice('زيت زيتون بكر وخضار مشكل')" class="h-8 px-2.5 rounded-full bg-slate-100 hover:bg-amber-50 active:scale-95 text-slate-400 hover:text-amber-600 flex items-center gap-1 text-[10.5px] font-semibold shrink-0 self-center border border-slate-200/50 cursor-pointer select-none transition-all" title="صنف أساسي غير قابل للاستبدال (انقر للتفاصيل)">
                      <svg class="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <span>ثابت</span>
                    </div>
                  </div>
                </div>

                <!-- Coach Note -->
                <div class="pt-1">
                  <div class="bg-[#F8FAFC] rounded-[12px] px-3 py-2 flex items-start gap-2 border border-slate-100">
                    <svg class="w-3.5 h-3.5 text-[#007AFF] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <p class="text-[11px] text-[#475569] leading-relaxed">
                      <strong class="font-bold text-[#1C1C1E]">توجيه الكوتش:</strong> وزن صدور الدجاج بعد التشفية وقبل الشوي مع بهارات خالية من الصوديوم.
                    </p>
                  </div>
                </div>
              </article>

              <!-- Meal 3: سناك قبل التمرين (420 سعرة) -->
              <article class="apple-fitness-card bg-white rounded-[20px] p-3.5 shadow-2xs border border-slate-100/70 space-y-2.5">
                <div class="flex items-center justify-between pb-2 border-b border-[#F2F2F7] select-none">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    </div>
                    <h3 class="text-[14.5px] font-black text-[#1C1C1E] tracking-tight">سناك قبل التمرين</h3>
                  </div>
                  <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#48484A] font-inter">420 سعرة</span>
                </div>

                <div class="space-y-1">
                  <div class="py-2.5 flex items-center justify-between gap-3 group">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <img src="assets/food/toast_almond.jpg" alt="توست بني" class="w-12 h-12 rounded-[12px] object-cover shrink-0 border border-slate-100 shadow-2xs">
                      <div class="min-w-0 flex-1">
                        <div class="text-[13.5px] font-bold text-[#1C1C1E] leading-snug" id="food-m3-item1">توست بني وزبدة لوز طبيعية</div>
                        <div class="text-[12px] font-bold text-[#1C1C1E] mt-0.5 leading-snug">2 شريحة + 25 جم زبدة</div>
                        <div class="text-[11px] font-normal text-[#8E8E93] mt-0.5 leading-snug font-inter">320 سعرة · 32g كارب</div>
                      </div>
                    </div>
                    <button onclick="openSwapModal('توست بني وزبدة لوز طبيعية', 'food-m3-item1', 'carb')" aria-label="تبديل الصنف" class="h-8 px-2.5 rounded-full bg-[#007AFF]/10 hover:bg-[#007AFF]/20 active:scale-95 text-[#007AFF] flex items-center gap-1 text-[11px] font-bold border border-[#007AFF]/20 shrink-0 self-center transition-all cursor-pointer">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                      <span>تبديل</span>
                    </button>
                  </div>

                  <div class="border-b border-[#F2F2F7] mr-[60px]"></div>

                  <div class="py-2.5 flex items-center justify-between gap-3 group">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <img src="assets/food/banana.jpg" alt="موز طازج" class="w-12 h-12 rounded-[12px] object-cover shrink-0 border border-slate-100 shadow-2xs">
                      <div class="min-w-0 flex-1">
                        <div class="text-[13.5px] font-bold text-[#1C1C1E] leading-snug" id="food-m3-item2">موز طازج</div>
                        <div class="text-[12px] font-bold text-[#1C1C1E] mt-0.5 leading-snug">موزة متوسطة (120 جم)</div>
                        <div class="text-[11px] font-normal text-[#8E8E93] mt-0.5 leading-snug font-inter">100 سعرة · 25g كارب</div>
                      </div>
                    </div>
                    <button onclick="openSwapModal('موز طازج', 'food-m3-item2', 'carb')" aria-label="تبديل الصنف" class="h-8 px-2.5 rounded-full bg-[#007AFF]/10 hover:bg-[#007AFF]/20 active:scale-95 text-[#007AFF] flex items-center gap-1 text-[11px] font-bold border border-[#007AFF]/20 shrink-0 self-center transition-all cursor-pointer">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                      <span>تبديل</span>
                    </button>
                  </div>
                </div>

                <!-- Coach Note -->
                <div class="pt-1">
                  <div class="bg-[#F8FAFC] rounded-[12px] px-3 py-2 flex items-start gap-2 border border-slate-100">
                    <svg class="w-3.5 h-3.5 text-[#007AFF] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <p class="text-[11px] text-[#475569] leading-relaxed">
                      <strong class="font-bold text-[#1C1C1E]">توجيه الكوتش:</strong> تناول الموز مع زبدة اللوز قبل بدء التمرين بـ 45 دقيقة لإمداد الجسم بالطاقة.
                    </p>
                  </div>
                </div>
              </article>

              <!-- Meal 4: العشاء (600 سعرة) -->
              <article class="apple-fitness-card bg-white rounded-[20px] p-3.5 shadow-2xs border border-slate-100/70 space-y-2.5">
                <div class="flex items-center justify-between pb-2 border-b border-[#F2F2F7] select-none">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    </div>
                    <h3 class="text-[14.5px] font-black text-[#1C1C1E] tracking-tight">العشاء</h3>
                  </div>
                  <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#48484A] font-inter">600 سعرة</span>
                </div>

                <div class="space-y-1">
                  <div class="py-2.5 flex items-center justify-between gap-3 group">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <img src="assets/food/cottage_cheese.jpg" alt="جبن قريش" class="w-12 h-12 rounded-[12px] object-cover shrink-0 border border-slate-100 shadow-2xs">
                      <div class="min-w-0 flex-1">
                        <div class="text-[13.5px] font-bold text-[#1C1C1E] leading-snug" id="food-m4-item1">جبن قريش خالي من اللاكتوز وخضار</div>
                        <div class="text-[12px] font-bold text-[#1C1C1E] mt-0.5 leading-snug">250 جم قريش + خضار</div>
                        <div class="text-[11px] font-normal text-[#8E8E93] mt-0.5 leading-snug font-inter">350 سعرة · 36g بروتين</div>
                      </div>
                    </div>
                    <button onclick="openSwapModal('جبن قريش خالي من اللاكتوز وخضار', 'food-m4-item1', 'protein')" aria-label="تبديل الصنف" class="h-8 px-2.5 rounded-full bg-[#007AFF]/10 hover:bg-[#007AFF]/20 active:scale-95 text-[#007AFF] flex items-center gap-1 text-[11px] font-bold border border-[#007AFF]/20 shrink-0 self-center transition-all cursor-pointer">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                      <span>تبديل</span>
                    </button>
                  </div>

                  <div class="border-b border-[#F2F2F7] mr-[60px]"></div>

                  <div class="py-2.5 flex items-center justify-between gap-3 group">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <img src="assets/food/toast_almond.jpg" alt="توست أسمر" class="w-12 h-12 rounded-[12px] object-cover shrink-0 border border-slate-100 shadow-2xs">
                      <div class="min-w-0 flex-1">
                        <div class="text-[13.5px] font-bold text-[#1C1C1E] leading-snug" id="food-m4-item2">توست أسمر حبوب كاملة</div>
                        <div class="text-[12px] font-bold text-[#1C1C1E] mt-0.5 leading-snug">2 شريحة توست (60 جم)</div>
                        <div class="text-[11px] font-normal text-[#8E8E93] mt-0.5 leading-snug font-inter">250 سعرة · 45g كارب</div>
                      </div>
                    </div>
                    <button onclick="openSwapModal('توست أسمر حبوب كاملة', 'food-m4-item2', 'carb')" aria-label="تبديل الصنف" class="h-8 px-2.5 rounded-full bg-[#007AFF]/10 hover:bg-[#007AFF]/20 active:scale-95 text-[#007AFF] flex items-center gap-1 text-[11px] font-bold border border-[#007AFF]/20 shrink-0 self-center transition-all cursor-pointer">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                      <span>تبديل</span>
                    </button>
                  </div>
                </div>

                <!-- Coach Note -->
                <div class="pt-1">
                  <div class="bg-[#F8FAFC] rounded-[12px] px-3 py-2 flex items-start gap-2 border border-slate-100">
                    <svg class="w-3.5 h-3.5 text-[#007AFF] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <p class="text-[11px] text-[#475569] leading-relaxed">
                      <strong class="font-bold text-[#1C1C1E]">توجيه الكوتش:</strong> جبن قريش خالي من اللاكتوز غني بالكازين بطيء الامتصاص لدعم الاستشفاء العضلي أثناء النوم.
                    </p>
                  </div>
                </div>
              </article>

            </section>

            <div class="h-4"></div>
          </div>

          <!-- ========================================== -->
          <!-- 4. SCREEN: CHECK-IN (المتابعة)             -->
          <!-- ========================================== -->
          `;

content = content.substring(0, startIndex) + newScreenNutrition + content.substring(endIndex + '<div id="screen-checkin"'.length);

// 2. Replace modal-swap-sheet
const modalStartTag = '<div id="modal-swap-sheet"';
const modalEndTag = '<div id="modal-exercise-alt-sheet"';

const mStartIndex = content.indexOf(modalStartTag);
const mEndIndex = content.indexOf(modalEndTag);

if (mStartIndex === -1 || mEndIndex === -1) {
  console.error('Could not locate modal-swap-sheet boundaries');
  process.exit(1);
}

const newModalSwapSheet = `<div id="modal-swap-sheet" class="hidden absolute inset-0 bg-slate-900/50 backdrop-blur-[3px] z-50 flex flex-col justify-end transition-all cursor-pointer" onclick="closeSwapModal()">
          <div onclick="event.stopPropagation()" class="bg-white cursor-default rounded-t-[28px] p-5 sheet-shadow space-y-4 max-h-[85%] overflow-y-auto">
            
            <!-- iOS Drag Indicator Handle -->
            <div class="w-9 h-1.5 bg-slate-200 rounded-full mx-auto"></div>
            
            <!-- Sheet Header -->
            <div class="flex items-center justify-between pb-1 border-b border-slate-100">
              <div>
                <h3 class="text-[16px] font-black text-[#1C1C1E]">تبديل الصنف الغذائي</h3>
                <p class="text-[11.5px] font-medium text-[#8E8E93] mt-0.5">بدائل متكافئة غذائياً محسوبة لليوم فقط</p>
              </div>
              <button onclick="closeSwapModal()" aria-label="إغلاق" class="w-8 h-8 rounded-full bg-[#F2F4F7] hover:bg-slate-200 active:scale-95 text-[#64748B] flex items-center justify-center transition-all cursor-pointer">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <!-- Current Food + Immediate Kitchen Formula Callout -->
            <div class="bg-[#F8FAFC] rounded-[16px] p-3.5 border border-slate-200/70 space-y-2">
              <div class="flex items-center justify-between text-[11px] text-[#8E8E93]">
                <span>الصنف المستبدل:</span>
                <span class="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">مفحوص صحياً ومستبعد المسببات</span>
              </div>
              <div class="text-[14px] font-bold text-[#1C1C1E]" id="swap-current-label">صدور دجاج مشوية</div>
              
              <div class="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span class="text-[11.5px] font-medium text-[#007AFF]">معادلة المطبخ الفورية:</span>
                <span class="text-[12.5px] font-black text-[#1C1C1E] font-inter" id="swap-kitchen-equiv-text">اختر الصنف البديل أدناه</span>
              </div>
            </div>

            <!-- Options List -->
            <div class="space-y-2" id="swap-options-list"></div>

            <!-- Apply Button -->
            <button onclick="confirmSwapSelection()" class="w-full h-11 bg-[#007AFF] hover:bg-[#0071E3] active:scale-[0.98] text-white rounded-full text-[13.5px] font-bold transition-all shadow-xs cursor-pointer">
              اعتماد التبديل لليوم
            </button>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- MODAL: MACHINE ALTERNATIVE SHEET (Apple Curved Bottom Sheet) -->
        <!-- ========================================== -->
        `;

content = content.substring(0, mStartIndex) + newModalSwapSheet + content.substring(mEndIndex + '<div id="modal-exercise-alt-sheet"'.length);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated mobile_app_preview.html with refined Nutrition Screen and Swap Sheet!');
