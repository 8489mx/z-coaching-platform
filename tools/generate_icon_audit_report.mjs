import fs from 'fs';

const html = fs.readFileSync('frontend/public/mobile_app_preview.html', 'utf8');

// We want to thoroughly check every icon in the app
// Let's identify every SVG and its human-readable role and status
const svgRegex = /<svg([^>]*)>([\s\S]*?)<\/svg>/g;
let match;
let count = 0;
const report = [];

while ((match = svgRegex.exec(html)) !== null) {
  count++;
  const attrs = match[1];
  const body = match[2].trim();
  const index = match.index;
  const lineNo = html.substring(0, index).split('\n').length;

  const pre = html.substring(Math.max(0, index - 120), index).replace(/\s+/g, ' ');
  const post = html.substring(index + match[0].length, index + match[0].length + 120).replace(/\s+/g, ' ');

  let screen = 'أخرى';
  if (lineNo < 1500) screen = '1. الرئيسية (Home / Today)';
  else if (lineNo < 1960) screen = '2. التمارين (Workout)';
  else if (lineNo < 2280) screen = '3. التغذية (Nutrition)';
  else if (lineNo < 2750) screen = '4. المتابعة (Check-in)';
  else if (lineNo < 3105) screen = '5. حسابي (Account)';
  else if (lineNo < 3195) screen = '6. شريط التنقل السفلي (Bottom Nav)';
  else if (lineNo < 3700) screen = '7. النوافذ المنبثقة (Modals & Sheets)';
  else screen = '8. القوالب البرمجية (Dynamic JS)';

  // Identify icon role
  let role = 'أيقونة';
  if (post.includes('الأوزان قبل الطهي') || pre.includes('الأوزان قبل الطهي')) role = 'شارة تنبيه الأوزان قبل الطهي';
  else if (post.includes('إنهاء التمرين') || pre.includes('btn-finish-workout')) role = 'زر إنهاء التمرين (علامة صح)';
  else if (pre.includes('static-stretch') || post.includes('Static Stretch') || pre.includes('Static Stretch')) role = 'كارت الإطالات (أيقونة البرودة / الثلج)';
  else if (post.includes('عرض الوجبات') || pre.includes('عرض الوجبات')) role = 'سهم الانتقال لعرض الوجبات';
  else if (post.includes('مراجعة الأداء') || pre.includes('مراجعة الأداء')) role = 'سهم مراجعة الأداء';
  else if (post.includes('طريقة الأداء') || pre.includes('طريقة الأداء')) role = 'زر طريقة الأداء (مثلث التشغيل Play)';
  else if (post.includes('البدائل') || pre.includes('البدائل')) role = 'زر بدائل التمرين (أسهم التبديل)';
  else if (post.includes('تبديل') || pre.includes('تبديل')) role = 'زر تبديل الصنف الغذائي';
  else if (post.includes('نسخ السابق') || pre.includes('نسخ السابق')) role = 'زر نسخ أوزان وعدات السابق';
  else if (post.includes('سجل التطور') || pre.includes('سجل التطور')) role = 'زر سجل التطور';
  else if (post.includes('إرسال المتابعة') || pre.includes('إرسال المتابعة')) role = 'زر إرسال المتابعة';
  else if (pre.includes('tab-content-0') || post.includes('اليوم')) role = 'تبويب اليوم (الرئيسية)';
  else if (pre.includes('tab-content-1') || post.includes('التمارين')) role = 'تبويب التمارين';
  else if (pre.includes('tab-content-2') || post.includes('التغذية')) role = 'تبويب التغذية (طبق السلطة)';
  else if (pre.includes('tab-content-3') || post.includes('المتابعة')) role = 'تبويب المتابعة';
  else if (pre.includes('tab-content-4') || post.includes('حسابي')) role = 'تبويب حسابي';
  else if (post.includes('ثابت') || pre.includes('ثابت')) role = 'قفل الصنف الثابت (غير قابل للاستبدال)';
  else if (pre.includes('الإفطار') || post.includes('الإفطار')) role = 'أيقونة وجبة الإفطار (الشمس)';
  else if (pre.includes('الغداء') || post.includes('الغداء')) role = 'أيقونة وجبة الغداء (الملعقة والشوكة)';
  else if (pre.includes('سناك') || post.includes('سناك')) role = 'أيقونة وجبة السناك (الصاعقة)';
  else if (pre.includes('العشاء') || post.includes('العشاء')) role = 'أيقونة وجبة العشاء (الهلال)';
  else if (pre.includes('ملاحظة') || post.includes('ملاحظة')) role = 'أيقونة ملاحظة المدرب (فقاعة الكلام)';
  else if (pre.includes('3.5 لتر') || post.includes('3.5 لتر')) role = 'أيقونة الترطيب والماء (قطرة الماء)';
  else if (post.includes('واتساب') || pre.includes('واتساب')) role = 'أيقونة واتساب المدرب';
  else if (pre.includes('modal') && (body.includes('line x1="18"') || body.includes('polyline points="18"'))) role = 'زر إغلاق النافذة (X)';
  else if (pre.includes('chk-weight-display') || post.includes('chk-weight-display')) role = 'ستبر وزن المتابعة (+ / -)';
  else if (pre.includes('chk-waist-display') || post.includes('chk-waist-display')) role = 'ستبر خصر المتابعة (+ / -)';
  else if (post.includes('حذف الصورة') || pre.includes('حذف الصورة')) role = 'زر حذف صورة المتابعة';
  else if (pre.includes('confirm-action') || post.includes('confirm-action')) role = 'أيقونة تحذير تأكيد الإجراء';
  else if (pre.includes('toast') || post.includes('toast')) role = 'أيقونة الإشعار السريع (Toast)';

  // Analyze defect
  let defect = null;
  const isLine1972 = lineNo === 1972;
  const hasZeroDot = body.includes('h.01') || body.includes('h0') || body.includes('x2="12.01"') || body.includes('x2="12" y2="8"');
  const missingLinecap = (attrs.includes('stroke=') || body.includes('stroke=')) && (!attrs.includes('stroke-linecap=') && !body.includes('stroke-linecap='));

  if (isLine1972) {
    defect = 'بايظة تماماً (الأيقونة التي أشرت إليها): رُسمت بمسار M12 8h.01 ومسار v-4 وبدون stroke-linecap="round" وبحجم صغير جداً w-3 h-3، مما جعلها تظهر كنقطة دائرية مصمتة في المنتصف ⊙ بدلاً من علامة معلومات واضحة.';
  } else if (hasZeroDot && missingLinecap) {
    defect = 'بايظة/مشوهة: نقطة علامة التعجب أو التنبيه تعتمد على طول خط صفري بدون stroke-linecap="round"، مما يجعل النقطة تختفي أو تظهر كشريحة مشوهة.';
  } else if (role.includes('قفل الصنف الثابت') && attrs.includes('w-3 h-3')) {
    defect = 'صغيرة جداً ومطمسة: القفل مرسوم بحجم 12px بسماكة 2px مما يجعل فتحة القفل 1 بكسل فقط وتبدو ككتلة رمادية غير واضحة.';
  } else if (role.includes('بدائل التمرين') && lineNo < 2000 && !attrs.includes('fill-current')) {
    defect = 'عدم تطابق بصري: تستخدم أيقونة سهم دائري منفرد (Reload) بينما الكروت المولدة ديناميكياً تستخدم أسهم التبديل المزدوجة (Swap).';
  } else if (role.includes('ستبر') && attrs.includes('w-3 h-3')) {
    defect = 'خط رفيع وحاد: علامة الزائد والناقص (+) و (-) مرسومة بحجم صغير 12px وبدون انحناء في الأطراف (round linecap).';
  } else if (role.includes('أيقونة الإشعار السريع') && attrs.includes('w-2.5 h-2.5')) {
    defect = 'متناهية الصغر: علامة الصح في التوست بحجم 10px فقط.';
  }

  report.push({ count, lineNo, screen, role, attrs, body: body.substring(0, 60), defect });
}

fs.writeFileSync('tools/icon_detailed_report.json', JSON.stringify(report, null, 2));

const defective = report.filter(r => r.defect !== null);
console.log(`Audited ${report.length} icons.`);
console.log(`Found ${defective.length} defective/problematic icons:`);
defective.forEach((d, i) => {
  console.log(`\n[${i + 1}] السطر ${d.lineNo} في ${d.screen}:`);
  console.log(`    الوظيفة: ${d.role}`);
  console.log(`    الخلل: ${d.defect}`);
});
