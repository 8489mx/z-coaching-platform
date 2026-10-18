import fs from 'fs';

// Read mobile_app_preview.html
const mobileHtml = fs.readFileSync('frontend/public/mobile_app_preview.html', 'utf8');

// Extract CSS styles from mobileHtml
const startStyleIdx = mobileHtml.indexOf('<style>') + 7;
const endStyleIdx = mobileHtml.indexOf('</style>');
const baseStyles = mobileHtml.substring(startStyleIdx, endStyleIdx);

// Extract screen-today markup exactly
const startTodayIdx = mobileHtml.indexOf('<div id="screen-today"');
const endTodayIdx = mobileHtml.indexOf('<!-- ========================================== -->\n          <!-- 2. SCREEN: WORKOUT');
const screenTodayHtml = mobileHtml.substring(startTodayIdx, endTodayIdx).trim();

// Extract bottom nav markup
const startNavIdx = mobileHtml.indexOf('<nav id="floating-bottom-nav"');
const endNavIdx = mobileHtml.indexOf('</nav>', startNavIdx) + 6;
const bottomNavHtml = mobileHtml.substring(startNavIdx, endNavIdx).trim();

console.log('Base styles length:', baseStyles.length);
console.log('Screen Today length:', screenTodayHtml.length);
console.log('Bottom Nav length:', bottomNavHtml.length);

// ============================================================
// BUILD THE HIGH-PRECISION "AFTER" TACTILE FINISH
// Strictly preserving layout, hierarchy, and content, while
// upgrading surface quality, diffused shadows, squircle curves,
// comfortable internal padding, and high-contrast typography.
// ============================================================

let screenTodayAfterHtml = screenTodayHtml
  // 1. Remove hard border classes from cards and sub-containers
  .replace(/border border-\[#E7EEF3\]/g, 'border-none')
  .replace(/border border-\[#E2E8F0\]/g, 'border-none')
  
  // 2. Upgrade Card Surface classes to tactile tokens
  .replace(/soft-card-shadow/g, 'tactile-card-surface')
  .replace(/card-shadow/g, 'tactile-card-hero')
  .replace(/btn-primary-premium/g, 'tactile-btn-primary')
  .replace(/btn-ghost-pill/g, 'tactile-ghost-pill')
  .replace(/premium-page-bg/g, 'tactile-canvas-bg')

  // 3. Squircle Curvature: Upgrade rounded-[20px] and rounded-[22px] to rounded-[26px]
  .replace(/rounded-\[20px\]/g, 'rounded-[26px]')
  .replace(/rounded-\[22px\]/g, 'rounded-[26px]')

  // 4. Comfortable Breathing Room (Padding Refinements)
  .replace(/p-3 sm:p-3\.5/g, 'p-4 sm:p-4.5')
  .replace(/p-3\.5 sm:p-4/g, 'p-4 sm:p-4.5')
  .replace(/p-4\.5 sm:p-5/g, 'p-5 sm:p-5.5')

  // 5. Typography Scale Disparity (Big Numbers, Soft Quiet Units)
  // Nutrition Donut:
  .replace(
    '<span class="text-[18px] font-extrabold text-[#0F172A] font-inter leading-none tracking-tight">2,450</span>\n                    <span class="text-[10px] font-medium text-[#94A3B8] leading-none mt-1">سعرة</span>',
    '<span class="text-[21px] font-extrabold text-[#0F172A] font-inter leading-none tracking-tight">2,450</span>\n                    <span class="text-[9.5px] font-semibold text-[#94A3B8] leading-none mt-1 uppercase tracking-wider">سعرة</span>'
  )
  // Macro Columns Numbers & Units:
  .replace(
    '<span class="text-[15.5px] font-bold text-[#0F172A] font-inter block leading-none">250g</span>',
    '<div class="flex items-baseline justify-center gap-0.5"><span class="text-[17px] font-extrabold text-[#0F172A] font-inter leading-none">250</span><span class="text-[10px] font-semibold text-[#94A3B8] leading-none">g</span></div>'
  )
  .replace(
    '<span class="text-[15.5px] font-bold text-[#0F172A] font-inter block leading-none">180g</span>',
    '<div class="flex items-baseline justify-center gap-0.5"><span class="text-[17px] font-extrabold text-[#0F172A] font-inter leading-none">180</span><span class="text-[10px] font-semibold text-[#94A3B8] leading-none">g</span></div>'
  )
  .replace(
    '<span class="text-[15.5px] font-bold text-[#0F172A] font-inter block leading-none">81g</span>',
    '<div class="flex items-baseline justify-center gap-0.5"><span class="text-[17px] font-extrabold text-[#0F172A] font-inter leading-none">81</span><span class="text-[10px] font-semibold text-[#94A3B8] leading-none">g</span></div>'
  )
  .replace(
    '<span class="text-[15.5px] font-bold text-[#0F172A] font-inter block leading-none">3.5L</span>',
    '<div class="flex items-baseline justify-center gap-0.5"><span class="text-[17px] font-extrabold text-[#0F172A] font-inter leading-none">3.5</span><span class="text-[10px] font-semibold text-[#94A3B8] leading-none">L</span></div>'
  )
  // Workout Hero Metadata:
  .replace(
    '<span id="home-workout-duration">45 دقيقة</span>',
    '<span id="home-workout-duration"><strong class="font-extrabold text-[#0F172A] font-inter text-[13px]">45</strong> <span class="text-[10.5px] text-[#94A3B8]">دقيقة</span></span>'
  )
  .replace(
    '<span id="home-workout-ex-count">5 تمارين</span>',
    '<span id="home-workout-ex-count"><strong class="font-extrabold text-[#0F172A] font-inter text-[13px]">5</strong> <span class="text-[10.5px] text-[#94A3B8]">تمارين</span></span>'
  )
  // Supplements Row Units:
  .replace(
    '<span class="text-[11px] text-[#64748B] block leading-tight mt-1">5 جم مع 300 مل ماء</span>',
    '<span class="text-[11px] text-[#64748B] block leading-tight mt-1"><strong class="text-[#0F172A] font-semibold">5</strong> <span class="text-[10px] text-[#94A3B8]">جم</span> مع <strong class="text-[#0F172A] font-semibold">300</strong> <span class="text-[10px] text-[#94A3B8]">مل</span> ماء</span>'
  )
  .replace(
    '<span class="text-[11px] text-[#64748B] block leading-tight mt-1">2 كبسولة مع الوجبة</span>',
    '<span class="text-[11px] text-[#64748B] block leading-tight mt-1"><strong class="text-[#0F172A] font-semibold">2</strong> <span class="text-[10px] text-[#94A3B8]">كبسولة</span> مع الوجبة</span>'
  )
  .replace(
    '<span class="text-[11px] text-[#64748B] block leading-tight mt-1">5000 وحدة دولية</span>',
    '<span class="text-[11px] text-[#64748B] block leading-tight mt-1"><strong class="text-[#0F172A] font-semibold">5000</strong> <span class="text-[10px] text-[#94A3B8]">وحدة دولية</span></span>'
  )
  // Supplements Sub-row styling:
  .replace(
    /bg-\[#F8FAFC\] border-none rounded-\[12px\]/g,
    'tactile-sub-surface rounded-[16px]'
  )
  // CTA Button Height:
  .replace(
    /h-\[38px\]/g,
    'h-[40px]'
  );

// Ensure unique IDs in BEFORE and AFTER so JavaScript doesn't collide
const screenTodayBeforeClean = screenTodayHtml.replace(/id="([^"]+)"/g, 'id="before-$1"');
const screenTodayAfterClean = screenTodayAfterHtml.replace(/id="([^"]+)"/g, 'id="after-$1"');

// Build the standalone comparison page
const comparisonHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Z Coaching Platform — مقارنة التجسيم الفاخر المعزولة (BEFORE vs AFTER)</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
${baseStyles}

    /* ============================================================ */
    /* MASTER TACTILE SURFACE DESIGN TOKENS (VISUAL FINISH ONLY)    */
    /* ============================================================ */

    /* 1. Canvas Background: Soft, warm, calm neutral finish */
    .tactile-canvas-bg {
      background-color: #EFF2F6 !important;
    }

    /* 2. Tactile Standard Card Surface:
          - Pure white ceramic/acrylic surface
          - Zero hard borders (border: none)
          - Multi-layered diffused soft ambient elevation
          - Subtle top light bevel highlight (inset)
          - Squircle 26px smooth curvature */
    .tactile-card-surface {
      background-color: #FFFFFF !important;
      border: none !important;
      border-radius: 26px !important;
      box-shadow: 
        0 2px 4px 0 rgba(15, 23, 42, 0.012),
        0 8px 20px -2px rgba(15, 23, 42, 0.035),
        0 20px 48px -4px rgba(15, 23, 42, 0.03),
        inset 0 1px 1px 0 rgba(255, 255, 255, 0.98) !important;
      transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .tactile-card-surface:hover {
      box-shadow: 
        0 4px 8px 0 rgba(15, 23, 42, 0.018),
        0 12px 28px -2px rgba(15, 23, 42, 0.05),
        0 24px 56px -4px rgba(15, 23, 42, 0.04),
        inset 0 1px 1px 0 rgba(255, 255, 255, 1) !important;
    }

    /* 3. Tactile Hero Card (Workout Card on Home):
          - Zero hard borders
          - Slightly deeper elevation with soft diffused halo
          - Crisp top micro-highlight
          - Squircle 26px curvature */
    .tactile-card-hero {
      background-color: #FFFFFF !important;
      border: none !important;
      border-radius: 26px !important;
      box-shadow: 
        0 3px 6px 0 rgba(15, 23, 42, 0.015),
        0 12px 28px -3px rgba(15, 23, 42, 0.045),
        0 24px 54px -6px rgba(15, 23, 42, 0.035),
        inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.98) !important;
      transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    /* 4. Tactile Sub-Surface (e.g. Supplement rows):
          - Quiet, calm #F8FAFC
          - Inset soft highlight, zero hard outer border */
    .tactile-sub-surface {
      background-color: #F8FAFC !important;
      border: none !important;
      box-shadow: 
        0 1px 2px 0 rgba(15, 23, 42, 0.02),
        inset 0 1px 0.5px 0 rgba(255, 255, 255, 0.95) !important;
    }

    /* 5. Tactile Primary Button:
          - Deep navy tactical surface
          - Natural tactile raised shadow
          - Subtle bevel light on top rim
          - Full pill radius */
    .tactile-btn-primary {
      background: linear-gradient(180deg, #1B3A5C 0%, #0F2744 100%) !important;
      border: 1px solid rgba(255, 255, 255, 0.18) !important;
      box-shadow: 
        0 2px 5px 0 rgba(15, 23, 42, 0.1),
        0 8px 22px -3px rgba(14, 36, 62, 0.32),
        inset 0 1px 1px 0 rgba(255, 255, 255, 0.32) !important;
      border-radius: 9999px !important;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .tactile-btn-primary:hover {
      background: linear-gradient(180deg, #1E4268 0%, #122B4A 100%) !important;
      box-shadow: 
        0 3px 8px 0 rgba(15, 23, 42, 0.12),
        0 10px 26px -3px rgba(14, 36, 62, 0.38),
        inset 0 1px 1px 0 rgba(255, 255, 255, 0.38) !important;
    }
    .tactile-btn-primary:active {
      transform: scale(0.98) translateY(1px) !important;
      box-shadow: 
        0 1px 2px 0 rgba(15, 23, 42, 0.12),
        0 4px 10px -2px rgba(14, 36, 62, 0.22),
        inset 0 1px 1px 0 rgba(255, 255, 255, 0.15) !important;
    }

    /* 6. Tactile Ghost Pill Buttons:
          - Polished white capsule
          - Soft tactile depth */
    .tactile-ghost-pill {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 4.5px !important;
      height: 26px !important;
      padding: 0 10px !important;
      border-radius: 9999px !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      color: #284C7C !important;
      background-color: #FFFFFF !important;
      border: 1px solid rgba(226, 232, 240, 0.75) !important;
      box-shadow: 
        0 2px 6px -1px rgba(15, 23, 42, 0.04),
        0 1px 2px 0 rgba(15, 23, 42, 0.02),
        inset 0 1px 1px 0 rgba(255, 255, 255, 0.98) !important;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .tactile-ghost-pill-sm {
      height: 24px !important;
      padding: 0 8px !important;
      font-size: 10.5px !important;
      gap: 3.5px !important;
    }
    .tactile-ghost-pill:hover {
      background-color: #F8FAFC !important;
      border-color: #CBD5E1 !important;
      color: #0F172A !important;
      box-shadow: 
        0 3px 8px -1px rgba(15, 23, 42, 0.06),
        inset 0 1px 1px 0 rgba(255, 255, 255, 1) !important;
    }

    /* Phone Shell Chrome for Showcase */
    .showcase-phone-shell {
      width: 390px;
      height: 844px;
      border-radius: 46px;
      box-shadow: 
        0 0 0 11px #1E293B,
        0 0 0 12px #334155,
        0 25px 60px -15px rgba(0, 0, 0, 0.35);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: #FFFFFF;
      transition: width 0.3s ease, height 0.3s ease;
    }

    /* Comparison Slider Styles */
    .split-container {
      position: relative;
      width: 390px;
      height: 844px;
      border-radius: 46px;
      box-shadow: 
        0 0 0 11px #1E293B,
        0 0 0 12px #334155,
        0 25px 60px -15px rgba(0, 0, 0, 0.35);
      overflow: hidden;
      background: #FFFFFF;
    }
    .split-before, .split-after {
      position: absolute;
      top: 0;
      left: 0;
      width: 390px;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .split-after {
      width: 50%;
      border-left: 2px solid #0284C7;
      z-index: 10;
      background: #EFF2F6;
    }
    .split-handle {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 4px;
      margin-left: -2px;
      background: #0284C7;
      cursor: ew-resize;
      z-index: 20;
    }
    .split-handle-button {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 36px;
      height: 36px;
      background: #0284C7;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
      font-size: 13px;
      font-weight: bold;
      user-select: none;
    }
  </style>
</head>
<body class="bg-[#F8FAFC] text-[#0F172A] p-4 sm:p-6 lg:p-8 min-h-screen">

  <div class="max-w-[1600px] mx-auto space-y-6">

    <!-- Header Panel -->
    <header class="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
      <div class="space-y-1 text-center lg:text-right">
        <div class="flex items-center gap-2 justify-center lg:justify-start">
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            Z Coaching Platform · اختبار التجسيم البصري
          </span>
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Strict UI Preservation · Visual Finish Only
          </span>
        </div>
        <h1 class="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
          لوحة المقارنة الثلاثية المعتمدة (BEFORE vs AFTER vs REFERENCE)
        </h1>
        <p class="text-xs text-[#64748B]">
          تطبيق البنود التشخيصية الخمسة المعتمدة (إلغاء الحدود الصريحة، ظلال متعددة الطبقات، هوامش تنفسية رحبة، تباين طباعي للأرقام، ونعومة الزوايا 26px) مع الحفاظ الحرفي على نفس الهيكل بنسبة 100%.
        </p>
      </div>

      <!-- Controls: Viewport & View Mode -->
      <div class="flex flex-wrap items-center gap-2.5 justify-center">
        <!-- Viewport Switcher -->
        <div class="bg-[#F1F5F9] border border-[#E2E8F0] rounded-2xl p-1 flex items-center gap-1">
          <span class="text-[11px] font-bold text-[#64748B] px-2 hidden sm:inline">المقاس:</span>
          <button onclick="setViewport(375, 812, this)" class="vp-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-all cursor-pointer">
            375px (Compact)
          </button>
          <button onclick="setViewport(390, 844, this)" class="vp-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0F172A] text-white shadow-sm transition-all cursor-pointer">
            390px (Standard)
          </button>
          <button onclick="setViewport(430, 932, this)" class="vp-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-all cursor-pointer">
            430px (Max)
          </button>
        </div>

        <!-- Mode Switcher -->
        <div class="bg-[#F1F5F9] border border-[#E2E8F0] rounded-2xl p-1 flex items-center gap-1">
          <button onclick="setViewMode('sideBySide', this)" class="mode-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0284C7] text-white shadow-sm transition-all cursor-pointer">
            مقارنة جنباً إلى جنب
          </button>
          <button onclick="setViewMode('slider', this)" class="mode-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-all cursor-pointer">
            سلايدر التبديل التفاعلي
          </button>
        </div>

        <a href="/mobile_app_preview.html" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-[#0F172A] border border-[#CBD5E1] hover:bg-[#F8FAFC] shadow-2xs transition-all flex items-center gap-1">
          <span>فتح المحاكي الرئيسي</span>
          <span>&larr;</span>
        </a>
      </div>
    </header>

    <!-- 5 Pillars Fulfillment Banner -->
    <div class="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-2xs grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
      <div class="border-b md:border-b-0 md:border-l border-[#F1F5F9] pb-2 md:pb-0 md:pl-2">
        <span class="text-[10.5px] font-semibold text-[#64748B] block">1. إلغاء الحدود الصريحة</span>
        <span class="text-xs font-bold text-emerald-700 mt-0.5 block">Zero Hard Borders</span>
        <span class="text-[9.5px] text-[#94A3B8]">أسطح طافية بنقاء</span>
      </div>
      <div class="border-b md:border-b-0 md:border-l border-[#F1F5F9] pb-2 md:pb-0 md:pl-2">
        <span class="text-[10.5px] font-semibold text-[#64748B] block">2. ظلال متعددة الطبقات</span>
        <span class="text-xs font-bold text-[#0284C7] mt-0.5 block">Diffused Ambient Halo</span>
        <span class="text-[9.5px] text-[#94A3B8]">خامة سيراميك بلمعة علوية</span>
      </div>
      <div class="border-b md:border-b-0 md:border-l border-[#F1F5F9] pb-2 md:pb-0 md:pl-2">
        <span class="text-[10.5px] font-semibold text-[#64748B] block">3. راحة وتنفس داخلي</span>
        <span class="text-xs font-bold text-emerald-700 mt-0.5 block">Breathing Room</span>
        <span class="text-[9.5px] text-[#94A3B8]">هوامش فندقية متزنة</span>
      </div>
      <div class="border-b md:border-b-0 md:border-l border-[#F1F5F9] pb-2 md:pb-0 md:pl-2">
        <span class="text-[10.5px] font-semibold text-[#64748B] block">4. تباين الأرقام والوحدات</span>
        <span class="text-xs font-bold text-[#0284C7] mt-0.5 block">Typography Contrast</span>
        <span class="text-[9.5px] text-[#94A3B8]">أرقام بارزة ووحدات مجهرية</span>
      </div>
      <div>
        <span class="text-[10.5px] font-semibold text-[#64748B] block">5. نعومة الزوايا العضوية</span>
        <span class="text-xs font-bold text-emerald-700 mt-0.5 block">26px Squircle</span>
        <span class="text-[9.5px] text-[#94A3B8]">انحناء أملس كحجر النرد</span>
      </div>
    </div>

    <!-- MAIN COMPARISON SECTION -->

    <!-- MODE 1: Side by Side (3 Columns) -->
    <div id="view-side-by-side" class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start justify-items-center">

      <!-- COLUMN 1: BEFORE (Original Baseline) -->
      <div class="flex flex-col items-center gap-3 w-full max-w-[430px]">
        <div class="flex items-center justify-between w-full px-2">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-slate-400"></span>
            <span class="text-sm font-bold text-[#0F172A]">1. الواجهة الأصلية الحالية (BEFORE)</span>
          </div>
          <span class="text-[11px] font-bold text-[#64748B] bg-[#F1F5F9] border border-[#E2E8F0] px-2 py-0.5 rounded-full">الأساس المعتمد</span>
        </div>
        <p class="text-[11.5px] text-[#64748B] w-full px-2 leading-relaxed">
          الواجهة الحالية بالحدود الرمادية الكلاسيكية (#E7EEF3) والظلال الخفيفة والأرقام ذات النمط المعتاد.
        </p>

        <!-- Phone Shell Before -->
        <div class="showcase-phone-shell phone-viewport">
          <!-- Status Bar -->
          <div class="h-11 bg-transparent px-6 flex items-center justify-between shrink-0 select-none z-20">
            <span class="text-[13px] font-semibold font-inter text-[#0F172A]">9:41</span>
            <div class="w-24 h-4 bg-black rounded-full mx-auto -mt-1"></div>
            <div class="flex items-center gap-1.5 text-[#0F172A]">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z"/></svg>
              <span class="text-[11px] font-bold font-inter">5G</span>
              <div class="w-5 h-2.5 border border-current rounded-xs p-0.5 flex items-center">
                <div class="h-full w-full bg-current rounded-2xs"></div>
              </div>
            </div>
          </div>

          <!-- Phone Content Scroll Area -->
          <div class="flex-1 overflow-y-auto no-scrollbar relative">
            ${screenTodayBeforeClean}
          </div>

          <!-- Bottom Navigation -->
          <div class="relative shrink-0 pointer-events-none">
            ${bottomNavHtml}
          </div>
        </div>
      </div>

      <!-- COLUMN 2: AFTER (Tactile Depth & Material Polish) -->
      <div class="flex flex-col items-center gap-3 w-full max-w-[430px]">
        <div class="flex items-center justify-between w-full px-2">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-[#0284C7] ring-4 ring-sky-100"></span>
            <span class="text-sm font-bold text-[#0F172A]">2. نفس الواجهة بالتجسيم الفاخر (AFTER)</span>
          </div>
          <span class="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">Tactile Surface Finish</span>
        </div>
        <p class="text-[11.5px] text-[#64748B] w-full px-2 leading-relaxed">
          نفس المكونات بالمللي: كروت عائمة بدون إطارات رمادية، ظلال هوائية منتشرة، انحناءات 26px ناعمة، مساحات تنفس رحبة، وأرقام عريضة بارزة.
        </p>

        <!-- Phone Shell After -->
        <div class="showcase-phone-shell phone-viewport ring-2 ring-[#0284C7]/20">
          <!-- Status Bar -->
          <div class="h-11 bg-transparent px-6 flex items-center justify-between shrink-0 select-none z-20">
            <span class="text-[13px] font-semibold font-inter text-[#0F172A]">9:41</span>
            <div class="w-24 h-4 bg-black rounded-full mx-auto -mt-1"></div>
            <div class="flex items-center gap-1.5 text-[#0F172A]">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z"/></svg>
              <span class="text-[11px] font-bold font-inter">5G</span>
              <div class="w-5 h-2.5 border border-current rounded-xs p-0.5 flex items-center">
                <div class="h-full w-full bg-current rounded-2xs"></div>
              </div>
            </div>
          </div>

          <!-- Phone Content Scroll Area -->
          <div class="flex-1 overflow-y-auto no-scrollbar relative">
            ${screenTodayAfterClean}
          </div>

          <!-- Bottom Navigation -->
          <div class="relative shrink-0 pointer-events-none">
            ${bottomNavHtml}
          </div>
        </div>
      </div>

      <!-- COLUMN 3: REFERENCE (Master Image) -->
      <div class="flex flex-col items-center gap-3 w-full max-w-[430px]">
        <div class="flex items-center justify-between w-full px-2">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span class="text-sm font-bold text-[#0F172A]">3. الصورة المرجعية المرفقة (REFERENCE)</span>
          </div>
          <span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">مرجع الخامة فقط</span>
        </div>
        <p class="text-[11.5px] text-[#64748B] w-full px-2 leading-relaxed">
          المرجع البصري المعتمد لاستلهام خامة الأسطح السيراميكية، ونعومة الحواف، وتدرج الظلال، ونقاء المساحات.
        </p>

        <!-- Reference Image Container -->
        <div class="showcase-phone-shell phone-viewport overflow-hidden bg-[#ECEEF2] p-2 flex items-center justify-center">
          <img src="/reference_tactile_master.png" alt="Reference Master" class="w-full h-full object-contain rounded-[38px] shadow-sm">
        </div>
      </div>

    </div>

    <!-- MODE 2: Interactive Slider (Split View) -->
    <div id="view-slider" class="hidden flex-col items-center justify-center py-6">
      <div class="text-center mb-4">
        <span class="text-sm font-bold text-[#0F172A]">سلايدر السحب التفاعلي (اسحب المقبض لليمين واليسار)</span>
        <p class="text-xs text-[#64748B] mt-1">حرّك الخط الفاصل لترى التحول الفوري بين الواجهة الأصلية (يمين) والتجسيم الفاخر (يسار) على نفس البكسل بالضبط.</p>
      </div>

      <div class="split-container phone-viewport" id="split-box">
        <!-- Before layer (full width behind) -->
        <div class="split-before phone-viewport">
          <div class="h-11 bg-transparent px-6 flex items-center justify-between shrink-0 select-none">
            <span class="text-[13px] font-semibold font-inter text-[#0F172A]">9:41</span>
            <div class="w-24 h-4 bg-black rounded-full mx-auto -mt-1"></div>
            <span class="text-[11px] font-bold font-inter text-[#0F172A]">BEFORE</span>
          </div>
          ${screenTodayBeforeClean}
        </div>

        <!-- After layer (clipped with width) -->
        <div class="split-after phone-viewport" id="split-after-layer">
          <div class="h-11 bg-transparent px-6 flex items-center justify-between shrink-0 select-none">
            <span class="text-[13px] font-semibold font-inter text-[#0F172A]">9:41</span>
            <div class="w-24 h-4 bg-black rounded-full mx-auto -mt-1"></div>
            <span class="text-[11px] font-bold font-inter text-[#0284C7]">AFTER</span>
          </div>
          ${screenTodayAfterClean}
        </div>

        <!-- Handle -->
        <div class="split-handle" id="split-handle-bar">
          <div class="split-handle-button">&harr;</div>
        </div>
      </div>
    </div>

    <!-- Engineering Details Table -->
    <section class="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-4">
      <div class="border-b border-[#F1F5F9] pb-3">
        <h3 class="text-base font-bold text-[#0F172A]">التفاصيل الهندسية لتطبيق البنود الخمسة (Tactile Tokens Matrix)</h3>
        <p class="text-xs text-[#64748B] mt-0.5">جدول الفروقات البصرية الدقيقة بين كود BEFORE وكود AFTER لإثبات الالتزام الصارم بشرط عدم المساس بالهيكل:</p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-right text-xs">
          <thead>
            <tr class="border-b border-[#E2E8F0] text-[#64748B] bg-[#F8FAFC]">
              <th class="py-2.5 px-3 font-semibold">البند التشخيصي</th>
              <th class="py-2.5 px-3 font-semibold">الخامة السابقة (BEFORE)</th>
              <th class="py-2.5 px-3 font-semibold text-[#0284C7]">التجسيم الجديد (AFTER)</th>
              <th class="py-2.5 px-3 font-semibold">الحالة الهندسية والأبعاد</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F1F5F9] text-[#1E293B]">
            <tr>
              <td class="py-3 px-3 font-bold">1. إلغاء الحدود الصريحة</td>
              <td class="py-3 px-3 font-mono text-[11px] text-[#64748B]">border: 1px solid #E7EEF3</td>
              <td class="py-3 px-3 font-mono text-[11px] text-[#0284C7]">border: none مع لمعة سيراميك علوية خافتة</td>
              <td class="py-3 px-3 font-semibold text-emerald-700">تخلص تام من شكل الأقفاص والجداول</td>
            </tr>
            <tr>
              <td class="py-3 px-3 font-bold">2. الظلال والتجسيم اللمسي</td>
              <td class="py-3 px-3 font-mono text-[11px] text-[#64748B]">soft-card-shadow خفيف مسطح</td>
              <td class="py-3 px-3 font-mono text-[11px] text-[#0284C7]">3 طبقات هوائية منتشرة (2px / 8px / 20px)</td>
              <td class="py-3 px-3 font-semibold text-emerald-700">عوم ناعم وهادئ يحاكي المرجع بالضبط</td>
            </tr>
            <tr>
              <td class="py-3 px-3 font-bold">3. راحة وتنفس الكارت الداخلي</td>
              <td class="py-3 px-3 font-mono text-[11px] text-[#64748B]">p-3 / p-3.5 ضيق نسبياً</td>
              <td class="py-3 px-3 font-mono text-[11px] text-[#0284C7]">p-4 / p-4.5 / p-5 مدروس ومريح</td>
              <td class="py-3 px-3 font-semibold text-emerald-700">وقار بصري دون أي زيادة غير مبررة في السكرول</td>
            </tr>
            <tr>
              <td class="py-3 px-3 font-bold">4. تباين الأرقام والوحدات</td>
              <td class="py-3 px-3 font-mono text-[11px] text-[#64748B]">أرقام 15.5px ووحدات ملتصقة</td>
              <td class="py-3 px-3 font-mono text-[11px] text-[#0284C7]">أرقام 17px/21px ExtraBold ووحدات مجهرية هادئة</td>
              <td class="py-3 px-3 font-semibold text-emerald-700">بروز وثقة بصرية في مؤشرات الأداء</td>
            </tr>
            <tr>
              <td class="py-3 px-3 font-bold">5. زوايا الكروت (Squircle)</td>
              <td class="py-3 px-3 font-mono text-[11px] text-[#64748B]">rounded-[20px] و rounded-[22px]</td>
              <td class="py-3 px-3 font-mono text-[11px] text-[#0284C7]">rounded-[26px] انسيابية فائقة</td>
              <td class="py-3 px-3 font-semibold text-emerald-700">ملمس حجري ناعم مطابق لروح المرجع</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

  </div>

  <script>
    function setViewport(w, h, btn) {
      document.querySelectorAll('.vp-btn').forEach(b => {
        b.className = "vp-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-all cursor-pointer";
      });
      btn.className = "vp-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0F172A] text-white shadow-sm transition-all cursor-pointer";

      document.querySelectorAll('.phone-viewport').forEach(shell => {
        shell.style.width = w + 'px';
        shell.style.height = h + 'px';
      });

      // Update split layers
      const splitBefore = document.querySelector('.split-before');
      const splitAfter = document.querySelector('.split-after');
      if (splitBefore) splitBefore.style.width = w + 'px';
      if (splitAfter) splitAfter.style.width = (w / 2) + 'px';
      const handle = document.getElementById('split-handle-bar');
      if (handle) handle.style.left = '50%';
    }

    function setViewMode(mode, btn) {
      document.querySelectorAll('.mode-btn').forEach(b => {
        b.className = "mode-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-all cursor-pointer";
      });
      btn.className = "mode-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0284C7] text-white shadow-sm transition-all cursor-pointer";

      const sideBySide = document.getElementById('view-side-by-side');
      const slider = document.getElementById('view-slider');

      if (mode === 'sideBySide') {
        sideBySide.classList.remove('hidden');
        sideBySide.classList.add('grid');
        slider.classList.add('hidden');
        slider.classList.remove('flex');
      } else {
        sideBySide.classList.add('hidden');
        sideBySide.classList.remove('grid');
        slider.classList.remove('hidden');
        slider.classList.add('flex');
      }
    }

    // Split Slider Dragging Logic
    const splitBox = document.getElementById('split-box');
    const splitAfterLayer = document.getElementById('split-after-layer');
    const handleBar = document.getElementById('split-handle-bar');

    let isDragging = false;

    if (splitBox && handleBar && splitAfterLayer) {
      const updateSplit = (clientX) => {
        const rect = splitBox.getBoundingClientRect();
        let offsetX = clientX - rect.left;
        if (offsetX < 20) offsetX = 20;
        if (offsetX > rect.width - 20) offsetX = rect.width - 20;

        const percentage = (offsetX / rect.width) * 100;
        splitAfterLayer.style.width = offsetX + 'px';
        handleBar.style.left = offsetX + 'px';
      };

      handleBar.addEventListener('mousedown', () => isDragging = true);
      window.addEventListener('mouseup', () => isDragging = false);
      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        updateSplit(e.clientX);
      });

      handleBar.addEventListener('touchstart', () => isDragging = true);
      window.addEventListener('touchend', () => isDragging = false);
      window.addEventListener('touchmove', (e) => {
        if (!isDragging || !e.touches[0]) return;
        updateSplit(e.touches[0].clientX);
      });
    }
  </script>
</body>
</html>
`;

fs.writeFileSync('frontend/public/tactile_visual_finish_comparison.html', comparisonHtml, 'utf8');
console.log('Successfully generated frontend/public/tactile_visual_finish_comparison.html');
