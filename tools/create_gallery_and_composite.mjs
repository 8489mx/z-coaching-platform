import fs from 'fs';
import path from 'path';

const screensDir = 'd:/zcc/karim_zakaria_app_screens';

const screenData = [
  { file: '01_Home_Overview.png', section: 'اليوم (Home)', title: 'الصفحة الرئيسية — النظرة الأولى', enTitle: 'Home Screen — First Viewport', desc: 'التقويم الأسبوعي الأفقي، بطاقة بطل تمرين اليوم (Push)، وبطاقة السعرات والماكروز اليومية.' },
  { file: '02_Home_Scrolled.png', section: 'اليوم (Home)', title: 'الصفحة الرئيسية — التمرير السفلي', enTitle: 'Home Screen — Scrolled View', desc: 'بطاقة موعد المتابعة الأسبوعية القادمة، وقائمة المكملات الغذائية اليومية المقررة مع مربعات الاختيار.' },
  { file: '03_Workout_Exercise_Logging.png', section: 'التمارين (Workout)', title: 'شاشة التمارين — تسجيل الأوزان', enTitle: 'Workout — Resistance & Logging', desc: 'تمارين المقاومة بعناوين إنجليزية أساسية، وبطاقة التسجيل الذكية الموحدة (الوزن، العدات، الجهد، وزر زي آخر مرة).' },
  { file: '04_Workout_Cardio_Completion.png', section: 'التمارين (Workout)', title: 'شاشة التمارين — الكارديو والإطالات', enTitle: 'Workout — Cardio & Completion', desc: 'بطاقة المشي على السير الكهربائي المنحدر، إطالات الصدر والبايسبس، وزر إنهاء واعتماد تمرين اليوم.' },
  { file: '05_Workout_Alternative_Sheet.png', section: 'التمارين (Workout)', title: 'شاشة التمارين — بدائل الأجهزة', enTitle: 'Workout — Alternative Machine Sheet', desc: 'النافذة المنبثقة السفلية لاختيار الأجهزة والأدوات البديلة لنفس العضلة المستهدفة بالجيم.' },
  { file: '06_Nutrition_Overview.png', section: 'التغذية (Nutrition)', title: 'شاشة التغذية — ملخص الماكروز والإفطار', enTitle: 'Nutrition — Targets & Breakfast', desc: 'السعرات المستهدفة (2450)، شارة الترطيب الثابتة (ماء 3.5 لتر)، كروت الماكروز الثلاثية النقية، ووجبة الإفطار.' },
  { file: '07_Nutrition_Meals_Food_Rows.png', section: 'التغذية (Nutrition)', title: 'شاشة التغذية — الغداء والسناك', enTitle: 'Nutrition — Lunch & Pre-Workout Snack', desc: 'وجبة الغداء ووجبة السناك مع صور الأطعمة المحققة، الكميات الدقيقة، أزرار التبديل الدائرية، وملاحظة المدرب.' },
  { file: '08_Nutrition_Food_Rows_Continued.png', section: 'التغذية (Nutrition)', title: 'شاشة التغذية — وجبة العشاء', enTitle: 'Nutrition — Dinner & Recovery Cues', desc: 'وجبة العشاء (جبن قريش وتوست أسمر)، تفاصيل السعرات، وتوجيهات الكوتش الخاصة بالاستشفاء العضلي.' },
  { file: '09_Nutrition_Food_Swap_Sheet.png', section: 'التغذية (Nutrition)', title: 'شاشة التغذية — نافذة تبديل الصنف', enTitle: 'Nutrition — Food Swap Bottom Sheet', desc: 'نافذة استبدال الأطعمة الآمنة مع معادلة المطبخ الفورية للجرامات الدقيقة وحماية ملف الحساسيات.' },
  { file: '10_Checkin_Measurements.png', section: 'المتابعة (Check-in)', title: 'شاشة المتابعة — القياسات الأساسية', enTitle: 'Check-in — Weekly Measurements', desc: 'نموذج تسجيل المتابعة الأسبوعية، عداد وزن الجسم، ساعات النوم، ومؤشر الالتزام الأسبوعي.' },
  { file: '11_Checkin_Wellbeing_Photos.png', section: 'المتابعة (Check-in)', title: 'شاشة المتابعة — تقييم الهضم والصور', enTitle: 'Check-in — Digestion & Progress Photos', desc: 'شرائح تقييم راحة الهضم ومستوى النشاط، ومناطق رفع صور التطور من ثلاث زوايا (أمام، جانب، ظهر).' },
  { file: '12_Checkin_Submission.png', section: 'المتابعة (Check-in)', title: 'شاشة المتابعة — الملاحظات والإرسال', enTitle: 'Check-in — Coach Notes & Submit', desc: 'حقل ملاحظات المتدرب وأسئلته للكوتش، وزر إرسال المتابعة للمدرب للاعتماد والتحديث.' },
  { file: '13_Progress_History.png', section: 'المتابعة (Check-in)', title: 'شاشة المتابعة — سجل التطور التاريخي', enTitle: 'Check-in — History & Feedback', desc: 'ملخص التطور التراكمي (نزول الوزن والخصر)، وبطاقات المتابعات المعتمدة السابقة مع ملاحظات الكوتش.' },
  { file: '14_Account_Profile.png', section: 'حسابي (Account)', title: 'شاشة الحساب — الملف الشخصي والاشتراك', enTitle: 'Account — Profile & Subscription', desc: 'الملف الشخصي، رمز المتدرب، شارة الفئة المعتمدة (ELITE / MAX)، وملف الفحوصات والبيانات الصحية.' },
  { file: '15_Account_Units_Notifications.png', section: 'حسابي (Account)', title: 'شاشة الحساب — الوحدات والتنبيهات', enTitle: 'Account — Units & Notifications', desc: 'مفاتيح تبديل وحدات القياس (كجم/باوند، سم/إنش)، وإعدادات التنبيهات الذكية، والدعم الفني المباشر.' },
  { file: '16_Account_Security_Logout.png', section: 'حسابي (Account)', title: 'شاشة الحساب — الأمان والخصوصية', enTitle: 'Account — Security & Sign Out', desc: 'خيارات الأمان، سياسة الخصوصية وحماية البيانات، تسجيل الخروج، وإصدار المنظومة.' }
];

// 1. Generate HTML Gallery
const galleryHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>Karim Zakaria — معرض شاشات التطبيق الكامل (App Screens Gallery)</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { font-family: -apple-system, BlinkMacSystemFont, "SF Pro", "IBM Plex Sans Arabic", sans-serif; }
    .font-inter { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-slate-100 p-4 md:p-8 text-slate-900 min-h-screen">
  <div class="max-w-7xl mx-auto space-y-6">
    <header class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <span class="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-600 border border-sky-100">Z Coaching Platform · تطبيق كريم زكريا</span>
        <h1 class="text-2xl font-black mt-2">معرض صور وشاشات التطبيق الكاملة (16 شاشة عالية الدقة)</h1>
        <p class="text-xs text-slate-500 mt-1">مرجع بصري موحد لمراجعة كافة الأقسام (اليوم، التمارين، التغذية، المتابعة، حسابي) بجودة Apple-Native.</p>
      </div>
      <div class="text-left font-inter text-xs text-slate-500">
        <div>Total Screens: <strong>16 High-Res Captures</strong></div>
        <div>Format: <strong>Apple iPhone 15 Pro (Retina 2x)</strong></div>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      ${screenData.map((item, idx) => `
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between gap-3">
          <div class="rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-1">
            <img src="${item.file}" alt="${item.title}" class="w-full h-auto object-contain rounded-lg">
          </div>
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10.5px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">${item.section}</span>
              <span class="text-[10px] font-mono font-bold text-slate-400">#${String(idx + 1).padStart(2, '0')}</span>
            </div>
            <h3 class="text-sm font-bold text-slate-800 leading-snug">${item.title}</h3>
            <p class="text-[11px] font-medium text-slate-400 font-inter leading-none">${item.enTitle}</p>
            <p class="text-[11.5px] text-slate-600 leading-relaxed pt-1 border-t border-slate-100 mt-1">${item.desc}</p>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(screensDir, 'screens_gallery.html'), galleryHtml, 'utf8');
console.log('Saved screens_gallery.html');

// 2. Generate Prompt & Documentation README.md for ChatGPT Review
const readmeMd = `# تطبيق كريم زكريا (Karim Zakaria Mobile App) — ملف صور الشاشات الكامل للمراجعة والاستشارة

هذا المجلد يحتوي على **16 لقطة شاشة عالية الدقة (Retina 2x)** تغطي كافة واجهات وأقسام تطبيق المتدرب بالكامل، مخصصة للمراجعة مع ChatGPT لتقييم جودة تجربة المستخدم وتناسق المكونات وفق أعلى معايير Apple (Apple Fitness & Apple Health).

---

## فهرس الشاشات المرفقة (16 لقطة)

${screenData.map((s, i) => `### ${String(i + 1).padStart(2, '0')}. \`${s.file}\`
- **القسم**: ${s.section}
- **العنوان**: ${s.title} (${s.enTitle})
- **الوصف الهندسي**: ${s.desc}
`).join('\n')}

---

## برومبت مقترح لـ ChatGPT عند إرسال الصور:

\`\`\`markdown
أشاركك صور شاشات تطبيق اللياقة البدنية والتدريب الرياضي (Karim Zakaria Coaching Platform).
الهدف البصري: الوصول إلى مستوى إتقان وجودة مكونات Apple Fitness و Apple Health (Apple-Level UI Polish) مع الحفاظ التام على:
1. الهيكل والبيانات وترتيب الأقسام ومسار تنقل المتدرب الحالي كما هو دون أي تغيير وظيفي.
2. شريط التنقل السفلي العائم بالعدسة الزجاجية السائلة (Floating Liquid Glass Bottom Navigation).
3. بطاقة التسجيل الذكية الواحدة لكل تمرين (ExerciseLogCard) بدون أي جداول تفاعلية للجولات الفردية.
4. هدف الترطيب الثابت اليومي (3.5 لتر/اليوم) بدون أي عدادات أو مؤقتات تفاعلية.
5. النعومة اللمسية والزوايا المنحنية العضوية (Organic Rounded Corners) والظلال الهادئة، وحظر أي نقاط ملونة أو حواف حادة.

يرجى مراجعة الشاشات المرفقة وتقديم تقييم متخصص حول:
- تناسق الكروت والأسطح وتوازن الفراغات (Spacing & Layout Balance).
- تدرج الخطوط ومحاذاة الأرقام الإنجليزية مع الوحدات العربية (Typography & Baselines).
- وضوح التسلسل الهرمي للمعلومات وسهولة استخدام التطبيق أثناء التمرين واليوم العادي.
\`\`\`
`;

fs.writeFileSync(path.join(screensDir, 'README.md'), readmeMd, 'utf8');
console.log('Saved README.md');

// 3. Generate a combined composite layout HTML to capture as 00_ALL_SCREENS_OVERVIEW.png
const compositeHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { background-color: #0F172A; }
  </style>
</head>
<body class="p-8 text-white min-h-screen">
  <div class="max-w-[3600px] mx-auto space-y-6">
    <div class="flex items-center justify-between border-b border-slate-800 pb-4">
      <div>
        <span class="text-sm font-bold text-sky-400">KARIM ZAKARIA PLATFORM · COMPLETE APP SCREENS OVERVIEW</span>
        <h1 class="text-3xl font-black mt-1">جميع شاشات التطبيق الكاملة (16 شاشة — iPhone 15 Pro)</h1>
      </div>
      <div class="text-xs text-slate-400 font-mono">16 RETINA SCREENS · ZERO PRODUCT DRIFT</div>
    </div>
    <div class="grid grid-cols-8 gap-4">
      ${screenData.map((item, idx) => `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex flex-col gap-2">
          <div class="flex items-center justify-between text-[11px] font-bold">
            <span class="text-sky-400">${item.section}</span>
            <span class="text-slate-500 font-mono">#${idx + 1}</span>
          </div>
          <img src="${item.file}" class="w-full h-auto rounded-xl shadow-lg border border-slate-800">
          <div class="text-[11.5px] font-bold text-slate-200 truncate mt-1">${item.title}</div>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(screensDir, 'composite_overview.html'), compositeHtml, 'utf8');
console.log('Saved composite_overview.html');
