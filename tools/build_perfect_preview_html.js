import fs from 'fs';

// Read mobile_app_preview.html
const mobileHtml = fs.readFileSync('frontend/public/mobile_app_preview.html', 'utf8');

// Extract device shell from mobileHtml (from <div id="device-shell" to </div> just before </section> </main>)
const startShellIdx = mobileHtml.indexOf('<div id="device-shell"');
const endMainIdx = mobileHtml.indexOf('</main>', startShellIdx);
const finalShellCloseIdx = mobileHtml.lastIndexOf('</div>', endMainIdx) + 6;

const shellHtml = mobileHtml.substring(startShellIdx, finalShellCloseIdx);

// Extract CSS styles from mobileHtml
const startStyleIdx = mobileHtml.indexOf('<style>') + 7;
const endStyleIdx = mobileHtml.indexOf('</style>');
const mobileStyles = mobileHtml.substring(startStyleIdx, endStyleIdx);

// Extract JS functions from mobileHtml that handle app state
const startJsIdx = mobileHtml.indexOf('<script>') + 8;
const endJsIdx = mobileHtml.lastIndexOf('</script>');
const mobileJs = mobileHtml.substring(startJsIdx, endJsIdx);

console.log('Shell HTML extracted, length:', shellHtml.length);
console.log('Styles extracted, length:', mobileStyles.length);
console.log('Mobile JS extracted, length:', mobileJs.length);

// Build the complete unified preview.html
const previewHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Z Coaching Platform — استوديو المعاينة المركزي الموحد</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
${mobileStyles}

    input[type=range] {
      accent-color: #0284C7;
    }
  </style>
</head>
<body class="p-3 md:p-6 flex flex-col items-center justify-start min-h-screen">

  <div class="w-full max-w-7xl flex flex-col gap-5">

    <!-- MASTER TOP HEADER -->
    <header class="bg-white border border-[#E2E8F0] rounded-3xl p-4 md:p-5 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            Z Coaching Platform · استوديو المعاينة المركزي
          </span>
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            مظهر مريح للعين (Light Theme)
          </span>
        </div>
        <h1 class="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          لوحة الفحص والاعتماد الموحدة — تطبيق الموبايل وشريط التنقل
        </h1>
        <p class="text-xs text-slate-500 mt-0.5">
          شاشات التطبيق الكاملة الحقيقية متصلة بالكامل بشريط التنقل خماسي التبويبات بالعدسة الزجاجية السائلة، مع لوحة المقارنة الثلاثية والمواصفات.
        </p>
      </div>

      <!-- MASTER STUDIO TABS SWITCHER -->
      <nav class="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 shrink-0">
        <button onclick="switchStudioView('app-simulator', this)" class="studio-tab-btn active px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap">
          <span>محاكي التطبيق (العدسة الزجاجية)</span>
        </button>
        <button onclick="switchStudioView('benchmark-3way', this)" class="studio-tab-btn px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap">
          <span>لوحة المقارنة الثلاثية</span>
        </button>
        <button onclick="switchStudioView('flutter-specs', this)" class="studio-tab-btn px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap">
          <span>المواصفات وكود Flutter</span>
        </button>
      </nav>
    </header>

    <!-- ========================================================================= -->
    <!-- VIEW 1: THE REAL APP SIMULATOR WITH LIQUID GLASS (محاكي التطبيق الحقيقي) -->
    <!-- ========================================================================= -->
    <section id="view-app-simulator" class="studio-view grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      
      <!-- LEFT: Live Interactive Mobile Device (iPhone Shell) -->
      <div class="xl:col-span-5 flex flex-col items-center gap-3">
        
        <!-- Device Size Switcher Bar -->
        <div class="bg-white border border-[#E2E8F0] rounded-2xl p-1 flex items-center gap-1 shadow-2xs">
          <button onclick="setDeviceSize('390')" id="btn-dev-390" class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#0F172A] text-white shadow-xs transition-all">
            390px
          </button>
          <button onclick="setDeviceSize('375')" id="btn-dev-375" class="px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#64748B] hover:text-[#0F172A] transition-all">
            375px
          </button>
          <button onclick="setDeviceSize('430')" id="btn-dev-430" class="px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#64748B] hover:text-[#0F172A] transition-all">
            430px
          </button>
          <a href="/mobile_app_preview.html" target="_blank" class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#F0F7FF] text-[#0284C7] hover:bg-[#E0F2FE] border border-[#BAE6FD] transition-all flex items-center gap-1">
            <span>فتح المحاكي المستقل</span>
            <span>&nearr;</span>
          </a>
        </div>

        <!-- The Phone Shell -->
        ${shellHtml}

      </div>

      <!-- RIGHT: Interactive Physics Control Studio -->
      <div class="xl:col-span-7 bg-white border border-[#E2E8F0] rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="text-sm font-bold text-slate-900">مختبر المعايرة البصرية والفيزيائية</h3>
            <p class="text-[11px] text-slate-500">تحكم لحظي متصل بشاشات التطبيق الكاملة وشريط التنقل خماسي التبويبات بالعدسة الزجاجية.</p>
          </div>
          <span id="status-chip" class="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-xl">
            مستقر عند: «اليوم»
          </span>
        </div>

        <!-- 1. Quick Tab Switcher Buttons (5 TABS) -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-700 block">الانتقال المباشر بين الشاشات والتبويبات (5 تبويبات):</label>
          <div class="grid grid-cols-5 gap-1.5">
            <button onclick="switchTab(0)" id="studio-tab-btn-0" class="py-2 px-1 rounded-xl border border-sky-500 bg-sky-50 text-xs font-bold text-sky-700 transition-all text-center">
              اليوم (0)
            </button>
            <button onclick="switchTab(1)" id="studio-tab-btn-1" class="py-2 px-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold text-slate-700 hover:text-sky-700 transition-all text-center">
              التمارين (1)
            </button>
            <button onclick="switchTab(2)" id="studio-tab-btn-2" class="py-2 px-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold text-slate-700 hover:text-sky-700 transition-all text-center">
              التغذية (2)
            </button>
            <button onclick="switchTab(3)" id="studio-tab-btn-3" class="py-2 px-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold text-slate-700 hover:text-sky-700 transition-all text-center">
              المتابعة (3)
            </button>
            <button onclick="switchTab(4)" id="studio-tab-btn-4" class="py-2 px-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold text-slate-700 hover:text-sky-700 transition-all text-center">
              حسابي (4)
            </button>
          </div>
        </div>

        <!-- 2. Motion Speed Calibration -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-700 block">معايرة سرعة النابض (Spring Duration):</label>
          <div class="grid grid-cols-4 gap-2">
            <button id="btn-speed-350" onclick="setSpeed(350, this)" class="py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 hover:border-sky-300 transition-all">
              350ms (خفيف)
            </button>
            <button id="btn-speed-400" onclick="setSpeed(400, this)" class="py-2 rounded-xl border border-sky-500 bg-sky-50 text-xs font-bold text-sky-700 transition-all">
              400ms (المعتمدة)
            </button>
            <button id="btn-speed-450" onclick="setSpeed(450, this)" class="py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 hover:border-sky-300 transition-all">
              450ms (متزن)
            </button>
            <button id="btn-speed-slow" onclick="setSpeed(1000, this)" class="py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 hover:border-sky-300 transition-all">
              1000ms (فحص)
            </button>
          </div>
        </div>

        <!-- 3. Visual Labels Toggle -->
        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-slate-900 block">مظهر التبويبات (Labels Toggle):</span>
            <span class="text-[11px] text-slate-500">فحص شكل الشريط بالأيقونات فقط أو مع النصوص</span>
          </div>
          <div class="flex gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button id="btn-labels-show" onclick="toggleLabels(true, this)" class="px-3 py-1 rounded-lg text-xs font-bold bg-sky-600 text-white transition-all">
              أيقونة + نص
            </button>
            <button id="btn-labels-hide" onclick="toggleLabels(false, this)" class="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all">
              أيقونة فقط
            </button>
          </div>
        </div>

        <!-- 4. Manual Frame Scrubber -->
        <div class="space-y-1.5 bg-slate-50 border border-slate-200 rounded-2xl p-3">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-800">شريط الفحص التدريجي (Manual Scrub):</span>
            <span id="scrub-val" class="font-mono-num text-sky-700 font-bold" dir="ltr">0%</span>
          </div>
          <input type="range" id="scrub-slider" min="0" max="100" value="0" oninput="onScrubSlider(this.value)" class="w-full cursor-pointer">
          <div class="flex justify-between text-[10px] text-slate-400 font-mono-num" dir="ltr">
            <span>01 (سكون)</span>
            <span>02 (تمدد)</span>
            <span>03 (قبة بصرية)</span>
            <span>04 (وصول)</span>
            <span>05 (سكون)</span>
          </div>
        </div>

        <!-- 5. Automated 9-Frames Benchmark Runner -->
        <div class="space-y-2">
          <button onclick="run9FrameSequence()" class="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all">
            <span>تشغيل التسلسل الكامل للفريمات التسعة تلقائياً (Auto Walkthrough)</span>
            <span class="text-sky-400">&larr;</span>
          </button>
        </div>

        <!-- 6. Architectural Physics Reference -->
        <div class="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-1.5 text-xs text-slate-600 leading-relaxed">
          <div class="font-bold text-slate-800 mb-1">المعادلات الفيزيائية المطبقة لحظياً:</div>
          <p>• <strong>النابض التوافقي (Damped Spring):</strong> تخامد حرج (معامل 0.85) وتردد طبيعي (7.5) بزمن 400ms مع وصول سريع واستقرار هادئ بدون ارتداد مفرط.</p>
          <p>• <strong>الانكسار الكروي (Convex Meniscus):</strong> تشوه وانكسار حواف الحروف والأيقونات عند عبور محيط العدسة مع تكبير القبة البصرية حتى 1.28x.</p>
          <p>• <strong>كبسولة الاستقرار (Resting Pill):</strong> اختفاء قوس اللمعان والبريق عند السكون وتحوله لكبسولة رمادية هادئة ناعمة مطابقة للمرجع.</p>
        </div>

      </div>

    </section>

    <!-- ========================================================================= -->
    <!-- VIEW 2: 3-WAY BENCHMARK COMPARISON (لوحة المقارنة الثلاثية المباشرة)       -->
    <!-- ========================================================================= -->
    <section id="view-benchmark-3way" class="studio-view hidden bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-6">
      
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h2 class="text-lg font-bold text-slate-900">لوحة المقارنة الثلاثية المباشرة (3-Way Benchmark)</h2>
          <p class="text-xs text-slate-500 mt-0.5">مقارنة فريم-بفريم بين: (1) المرجع الأصلي للفيديو، (2) التنفيذ السابق، (3) التنفيذ المحسن المعتمد.</p>
        </div>
        <span class="px-3 py-1 bg-sky-50 text-sky-700 text-xs font-bold rounded-full border border-sky-200">
          9 فريمات متتابعة
        </span>
      </div>

      <!-- Reference Image Card -->
      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-800">1. الصورة المرجعية الحقيقية (Original Reference Video 9.46s):</span>
          <span class="text-[11px] text-slate-500 font-inter">Frame-by-Frame Optical Capture</span>
        </div>
        <div class="rounded-xl overflow-hidden border border-slate-200 bg-white">
          <img src="/media_1791801560233_c44488ff.png" alt="9-Frames Reference" onerror="this.parentElement.innerHTML='<div class=\\'p-8 text-center text-xs text-slate-400 font-bold\\'>الصورة المرجعية للفريمات التسعة</div>'" class="w-full h-auto object-contain">
        </div>
      </div>

      <!-- Comparative Table Matrix -->
      <div class="space-y-3">
        <h3 class="text-xs font-bold text-slate-800">2. جدول التدقيق البصري والهندسي المباشر:</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-right text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th class="p-3">الفريم والمرحلة</th>
                <th class="p-3">المرجع الأصلي (الفيديو)</th>
                <th class="p-3">التنفيذ السابق</th>
                <th class="p-3 bg-sky-50 text-sky-900">التنفيذ المحسن المعتمد</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 text-slate-600">
              <tr class="hover:bg-slate-50/50">
                <td class="p-3 font-bold text-slate-900">01. السكون عند التبويب</td>
                <td class="p-3">كبسولة رمادية هادئة بدون بريق</td>
                <td class="p-3 text-rose-600">بلور ثابت وخطوط زرقاء</td>
                <td class="p-3 font-semibold text-emerald-700 bg-sky-50/50">كبسولة رمادية هادئة (Settled Pill) بدون بريق</td>
              </tr>
              <tr class="hover:bg-slate-50/50">
                <td class="p-3 font-bold text-slate-900">02. انطلاق العدسة السائلة</td>
                <td class="p-3">تمدد بيضاوي مع لمعان علوي وقوس بريق</td>
                <td class="p-3 text-rose-600">انتقال جامد بنفس الحجم</td>
                <td class="p-3 font-semibold text-emerald-700 bg-sky-50/50">تمدد انسيابي في اتجاه الحركة + قوس بريق حقيقي</td>
              </tr>
              <tr class="hover:bg-slate-50/50">
                <td class="p-3 font-bold text-slate-900">03. تكبير القبة البصرية</td>
                <td class="p-3">تكبير وتشوّه وانكسار العناصر العابرة (1.28x)</td>
                <td class="p-3 text-rose-600">عناصر ثابتة خلف الزجاج</td>
                <td class="p-3 font-semibold text-emerald-700 bg-sky-50/50">انكسار كروي وتكبير وتحدب بصري ديناميكي لحظي</td>
              </tr>
              <tr class="hover:bg-slate-50/50">
                <td class="p-3 font-bold text-slate-900">04. وصول واستقرار النابض</td>
                <td class="p-3">تخامد حرج هادئ (Critical Damping) بدون ارتداد</td>
                <td class="p-3 text-rose-600">حركة خطية بطيئة</td>
                <td class="p-3 font-semibold text-emerald-700 bg-sky-50/50">نابض توافقي بزمن 400ms واستقرار فوري ناعم</td>
              </tr>
              <tr class="hover:bg-slate-50/50">
                <td class="p-3 font-bold text-slate-900">05. السكون النهائي</td>
                <td class="p-3">كبسولة هادئة رمادية مريحة للعين</td>
                <td class="p-3 text-rose-600">استمرار تأثير البلور الزجاجي الفاقع</td>
                <td class="p-3 font-semibold text-emerald-700 bg-sky-50/50">تلاشي قوس اللمعان والتحول لكبسولة سكون مهدئة</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </section>

    <!-- ========================================================================= -->
    <!-- VIEW 3: FLUTTER NATIVE SPECIFICATIONS & SHADERS (المواصفات وكود Flutter)    -->
    <!-- ========================================================================= -->
    <section id="view-flutter-specs" class="studio-view hidden bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-sm space-y-6">
      
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h2 class="text-lg font-bold text-slate-900">المواصفات الهندسية وكود Flutter المقترح</h2>
          <p class="text-xs text-slate-500 mt-0.5">معمارية التنفيذ بـ Flutter Fragment Shader و SpringSimulation (قيد الاعتماد النهائي قبل النقل).</p>
        </div>
        <span class="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
          بانتظار الاعتماد النهائي
        </span>
      </div>

      <!-- Specs Card 1 -->
      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs leading-relaxed text-slate-700">
        <h3 class="font-bold text-slate-900">1. محرك الانكسار البصري (Optical Refraction Engine):</h3>
        <p>
          الاعتماد على <code class="font-mono text-sky-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">BackdropFilter</code> بمفرده لا يوفر تأثيراً كروياً حقيقياً (Convex Meniscus)، بل يقتصر على التمويه الضبابي (Gaussian Blur). لتحقيق نفس الانكسار البصري الموجود في الفيديو المرجعي، يتم توظيف <code class="font-mono text-sky-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">FragmentProgram</code> في Flutter عبر ملف شادر GLSL <code class="font-mono text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">shaders/liquid_glass.frag</code>.
        </p>
      </div>

      <!-- Specs Card 2 -->
      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs leading-relaxed text-slate-700">
        <h3 class="font-bold text-slate-900">2. فيزياء النابض التوافقي (Damped Spring Physics):</h3>
        <p>
          يتم تحريك العدسة الزجاجية بواسطة <code class="font-mono text-sky-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">SpringSimulation</code> بالمواصفات التالية:
        </p>
        <ul class="list-disc list-inside space-y-1 font-mono text-[11px] text-slate-800 bg-white p-3 rounded-xl border border-slate-200" dir="ltr">
          <li>SpringDescription(mass: 1.0, stiffness: 180.0, damping: 20.0);</li>
          <li>Duration target: ~380ms - 420ms (Settling without overshoot wobble)</li>
          <li>Resting Width: 52.0 - 58.0 px (Dynamic based on tab index)</li>
          <li>Peak Stretch: +32.0 px at max velocity</li>
        </ul>
      </div>

      <!-- Specs Card 3 -->
      <div class="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-900 leading-relaxed space-y-1">
        <span class="font-bold block">التزام حوكمة الكود:</span>
        <p>
          لن يتم نقل أي سطر برمجي إلى مشروع Flutter Native حتى صدور الموافقة والاعتماد الصريح من صاحب المشروع على النموذج التفاعلي الحالي.
        </p>
      </div>

    </section>

  </div>

  <script>
    // Studio View Switcher
    function switchStudioView(viewId, btn) {
      document.querySelectorAll('.studio-view').forEach(v => v.classList.add('hidden'));
      const target = document.getElementById('view-' + viewId);
      if (target) target.classList.remove('hidden');

      document.querySelectorAll('.studio-tab-btn').forEach(b => {
        b.classList.remove('active');
      });
      if (btn) btn.classList.add('active');

      if (viewId === 'app-simulator') {
        setTimeout(initLensPosition, 80);
      }
    }

    // Spring Duration state
    let globalDuration = 400;

    function setSpeed(ms, btn) {
      globalDuration = ms;
      ['btn-speed-350', 'btn-speed-400', 'btn-speed-450', 'btn-speed-slow'].forEach(id => {
        const b = document.getElementById(id);
        if (b) {
          b.className = "py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 hover:border-sky-300 transition-all";
        }
      });
      if (btn) {
        btn.className = "py-2 rounded-xl border border-sky-500 bg-sky-50 text-xs font-bold text-sky-700 transition-all";
      }
    }

    function toggleLabels(show, btn) {
      const labels = document.querySelectorAll('.nav-tab-label');
      labels.forEach(l => {
        if (show) l.classList.remove('hidden');
        else l.classList.add('hidden');
      });

      const btnShow = document.getElementById('btn-labels-show');
      const btnHide = document.getElementById('btn-labels-hide');
      if (show) {
        btnShow.className = "px-3 py-1 rounded-lg text-xs font-bold bg-sky-600 text-white transition-all";
        btnHide.className = "px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all";
      } else {
        btnHide.className = "px-3 py-1 rounded-lg text-xs font-bold bg-sky-600 text-white transition-all";
        btnShow.className = "px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all";
      }
      setTimeout(initLensPosition, 50);
    }

    function onScrubSlider(val) {
      document.getElementById('scrub-val').innerText = val + '%';
      const p = val / 100;
      const lensEl = document.getElementById('liquid-lens');
      if (!lensEl) return;

      const mStart = getTabMetrics(0);
      const mEnd = getTabMetrics(1);
      const totalDist = mEnd.center - mStart.center;

      lensEl.classList.remove('settled');

      const currentCenter = mStart.center + totalDist * p;
      const maxStretch = 36;
      const stretchAmount = maxStretch * Math.sin(Math.PI * p);
      const restingWidth = Math.max(mEnd.width - 6, 48);
      const currentWidth = restingWidth + stretchAmount;

      lensEl.style.left = \`\${currentCenter - currentWidth / 2}px\`;
      lensEl.style.width = \`\${currentWidth}px\`;

      updateOptics(currentCenter, currentWidth, p > 0.05 && p < 0.95);

      if (p === 0 || p === 1) {
        lensEl.classList.add('settled');
      }
    }

    async function run9FrameSequence() {
      const slider = document.getElementById('scrub-slider');
      for (let i = 0; i <= 100; i += 2) {
        slider.value = i;
        onScrubSlider(i);
        await new Promise(r => setTimeout(r, 18));
      }
      switchTab(1);
    }

    function updateStudioStatusChip(tabIndex) {
      const chip = document.getElementById('status-chip');
      if (!chip) return;
      const names = ['اليوم', 'التمارين', 'التغذية', 'المتابعة', 'حسابي'];
      chip.innerText = 'مستقر عند: «' + (names[tabIndex] || 'اليوم') + '»';

      for (let i = 0; i < 5; i++) {
        const btn = document.getElementById('studio-tab-btn-' + i);
        if (btn) {
          if (i === tabIndex) {
            btn.className = "py-2 px-1 rounded-xl border border-sky-500 bg-sky-50 text-xs font-bold text-sky-700 transition-all text-center";
          } else {
            btn.className = "py-2 px-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold text-slate-700 hover:text-sky-700 transition-all text-center";
          }
        }
      }
    }

    ${mobileJs}

    // Wrap switchTab to update studio controls status chip
    const origSwitchTab = switchTab;
    switchTab = function(index) {
      origSwitchTab(index);
      updateStudioStatusChip(index);
    };

  </script>
</body>
</html>
`;

fs.writeFileSync('frontend/public/preview.html', previewHtml, 'utf8');
console.log('Successfully generated frontend/public/preview.html');
