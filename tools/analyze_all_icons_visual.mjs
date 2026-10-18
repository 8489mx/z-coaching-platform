import fs from 'fs';

const html = fs.readFileSync('frontend/public/mobile_app_preview.html', 'utf8');
const data = JSON.parse(fs.readFileSync('tools/audit_report.json', 'utf8'));

// Categorize all 126 icons into screens and functions
const screenSections = [
  { name: '1. شاشة اليوم (Home / Today)', start: 'id="screen-today"', end: 'id="screen-workout"' },
  { name: '2. شاشة التمارين (Workout)', start: 'id="screen-workout"', end: 'id="screen-nutrition"' },
  { name: '3. شاشة التغذية (Nutrition)', start: 'id="screen-nutrition"', end: 'id="screen-checkin"' },
  { name: '4. شاشة المتابعة (Check-in)', start: 'id="screen-checkin"', end: 'id="screen-account"' },
  { name: '5. شاشة الحساب (Account)', start: 'id="screen-account"', end: 'id="floating-bottom-nav"' },
  { name: '6. شريط التنقل السفلي (Bottom Nav)', start: 'id="floating-bottom-nav"', end: '<!-- ========================================== -->\n        <!-- MODAL:' },
  { name: '7. النوافذ المنبثقة والقوائم السفلية (Modals & Sheets)', start: 'id="modal-policy"', end: '<script' },
  { name: '8. القوالب البرمجية الديناميكية (Dynamic JS Renderers)', start: '<script', end: '</body>' }
];

function getSectionName(lineNo) {
  const lineIdx = html.split('\n').slice(0, lineNo).join('\n').length;
  for (let i = 0; i < screenSections.length; i++) {
    const s = screenSections[i];
    const sPos = html.indexOf(s.start);
    const ePos = html.indexOf(s.end);
    if (sPos !== -1 && lineIdx >= sPos && (ePos === -1 || lineIdx < ePos)) {
      return s.name;
    }
  }
  return 'عناصر عامة / أخرى';
}

const classified = data.allIcons.map(icon => {
  const section = getSectionName(icon.lineNo);
  
  // Detect defects
  const defects = [];
  
  // Defect 1: info icon rendered as dot (like line 1972)
  if (icon.body.includes('M12 16v-4') || icon.body.includes('M12 8h.01') || (icon.body.includes('M12 9v2') && icon.body.includes('h.01'))) {
    if (!icon.attrs.includes('stroke-linecap="round"')) {
      defects.push('أيقونة معلومات/تنبيه مشوهة: خطأ في مسار النقطة h.01 وغياب stroke-linecap="round" مما يجعلها تظهر كنقطة مصمتة أو مشوهة (مثل أيقونة الأوزان قبل الطهي).');
    }
  }

  // Defect 2: Extremely tiny stroke icons (w-2.5, w-3)
  if (icon.cls.match(/\bw-2\.5\b|\bw-3\b/) && (icon.attrs.includes('stroke=') || icon.body.includes('stroke='))) {
    defects.push(`حجم أيقونة متناهي الصغر (${icon.cls}) مع خطوط دقيقة مما يفقدها الوضوح أو يطمس معالمها عند العرض.`);
  }

  // Defect 3: Stroke without stroke-linecap="round" stroke-linejoin="round"
  if ((icon.attrs.includes('stroke=') || icon.body.includes('stroke=')) && (!icon.attrs.includes('stroke-linecap="round"') && !icon.body.includes('stroke-linecap="round"'))) {
    // some polygons or rects don't need linecap
    if (icon.body.includes('<path') || icon.body.includes('<line') || icon.body.includes('<polyline')) {
      defects.push('غياب stroke-linecap="round" و stroke-linejoin="round" في أيقونة تعتمد على المسارات الخطية مما يسبب نهايات حادة أو نقاط غير دائرية.');
    }
  }

  // Defect 4: Inconsistent chevron direction or broken chevron
  if (icon.body.includes('M9 18l6-6-6-6') && !icon.cls.includes('rtl:rotate-180') && !icon.cls.includes('rotate-180') && !icon.cls.includes('chevron')) {
    // Check if this chevron should be flipped in RTL
    if (icon.pre.includes('hover:') || icon.post.includes('</button>') || icon.post.includes('</a>')) {
      // might be an arrow
    }
  }

  return {
    ...icon,
    section,
    defects
  };
});

const defectiveIcons = classified.filter(x => x.defects.length > 0);
console.log(`Classified ${classified.length} icons across screens.`);
console.log(`Found ${defectiveIcons.length} icons with visual or technical defects.\n`);

const grouped = {};
classified.forEach(item => {
  if (!grouped[item.section]) grouped[item.section] = [];
  grouped[item.section].push(item);
});

for (const [sec, items] of Object.entries(grouped)) {
  const bad = items.filter(x => x.defects.length > 0);
  console.log(`=== ${sec} (إجمالي: ${items.length} أيقونة - معيبة/تحتاج تدقيق: ${bad.length}) ===`);
  bad.forEach(b => {
    console.log(`  * [السطر ${b.lineNo}] الكلاس: "${b.cls}"`);
    console.log(`    السياق: ${b.pre.slice(-40)} ... ${b.post.slice(0, 40)}`);
    console.log(`    الكود: ${b.body.substring(0, 80)}`);
    b.defects.forEach(d => console.log(`    -> العيب: ${d}`));
  });
  console.log('');
}
