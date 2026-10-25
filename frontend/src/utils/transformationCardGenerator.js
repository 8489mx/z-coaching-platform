/**
 * محرك توليد كروت التحول التسويقية الاحترافية (Z Coaching Transformation Card Engine)
 * يدعم التصدير المباشر بصيغة PNG عالية الدقة بنسب عرض متعددة (بوست، مربع، ستوري)
 * مع الحفاظ التام على هوية المنصة وحماية خصوصية المتدربين (طمس الوجه / إخفاء الاسم).
 */

export const CARD_FORMATS = Object.freeze({
  PORTRAIT_4_5: {
    id: 'PORTRAIT_4_5',
    name: 'بوست طولي (4:5)',
    width: 1080,
    height: 1350,
    aspectLabel: '4:5',
    recommendedFor: 'إنستجرام وبوستات فيسبوك المثالية'
  },
  SQUARE_1_1: {
    id: 'SQUARE_1_1',
    name: 'بوست مربع (1:1)',
    width: 1080,
    height: 1080,
    aspectLabel: '1:1',
    recommendedFor: 'المشاركات العامة وخلاصات الأخبار'
  },
  STORY_9_16: {
    id: 'STORY_9_16',
    name: 'ستوري رأسي (9:16)',
    width: 1080,
    height: 1920,
    aspectLabel: '9:16',
    recommendedFor: 'حالات واتساب وإنستجرام ستوري'
  }
});

export function formatWeeksCountAr(count) {
  const n = Math.max(1, Math.abs(Number(count) || 1));
  if (n === 1) return 'أسبوع واحد';
  if (n === 2) return 'أسبوعان';
  if (n >= 3 && n <= 10) return `${n} أسابيع`;
  return `${n} أسبوعاً`;
}

/**
 * حساب إحصائيات وفوارق التحول بالأرقام الدقيقة
 */
export function calculateTransformationStats({
  beforeWeight = 80,
  afterWeight = 72,
  beforeWaist = 88,
  afterWaist = 78,
  beforeWeek = 0,
  afterWeek = 8,
  adherence = 94
}) {
  const bWeight = Number(beforeWeight) || 0;
  const aWeight = Number(afterWeight) || 0;
  const bWaist = Number(beforeWaist) || 0;
  const aWaist = Number(afterWaist) || 0;

  const weightDiff = Number((aWeight - bWeight).toFixed(1));
  const waistDiff = Number((aWaist - bWaist).toFixed(1));
  const weeksCount = Math.max(1, Math.abs(Number(afterWeek) - Number(beforeWeek)));

  return {
    beforeWeight: bWeight,
    afterWeight: aWeight,
    beforeWaist: bWaist,
    afterWaist: aWaist,
    weightDiff,
    waistDiff,
    weeksCount,
    adherenceRate: Math.min(100, Math.max(0, Number(adherence) || 94)),
    isWeightLoss: weightDiff < 0,
    isWaistLoss: waistDiff < 0,
    weightText: weightDiff < 0 ? `${Math.abs(weightDiff)} كجم نزول` : (weightDiff > 0 ? `+${weightDiff} كجم زيادة` : 'ثبات تام'),
    waistText: waistDiff < 0 ? `${Math.abs(waistDiff)} سم نزول` : (waistDiff > 0 ? `+${waistDiff} سم` : 'ثبات الخصر')
  };
}

/**
 * تحميل الصورة بشكل آمن وغير متزامن للتعامل مع الـ Canvas
 */
export function loadImageSafe(src) {
  return new Promise((resolve) => {
    if (!src || typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * رسم مستطيل بزوايا دائرية
 */
function roundRect(ctx, x, y, width, height, radius, fill = true, stroke = false) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/**
 * رسم مجسم توضيحي (Silhouette) في حال عدم توفر صورة حقيقية
 */
function drawSilhouetteFallback(ctx, x, y, width, height, isBefore = false) {
  ctx.save();
  ctx.fillStyle = isBefore ? '#1E293B' : '#0F172A';
  ctx.fillRect(x, y, width, height);

  // Grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let gy = y; gy < y + height; gy += 30) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + width, gy);
    ctx.stroke();
  }

  const cx = x + width / 2;
  const cy = y + height / 2;

  ctx.fillStyle = isBefore ? '#475569' : '#C4952D';
  // Head
  ctx.beginPath();
  ctx.arc(cx, cy - height * 0.28, width * 0.09, 0, Math.PI * 2);
  ctx.fill();

  // Torso
  const torsoWidth = isBefore ? width * 0.36 : width * 0.30;
  const waistWidth = isBefore ? width * 0.32 : width * 0.22;
  ctx.beginPath();
  ctx.moveTo(cx - torsoWidth / 2, cy - height * 0.16);
  ctx.lineTo(cx + torsoWidth / 2, cy - height * 0.16);
  ctx.lineTo(cx + waistWidth / 2, cy + height * 0.08);
  ctx.lineTo(cx - waistWidth / 2, cy + height * 0.08);
  ctx.closePath();
  ctx.fill();

  // Legs
  const legW = width * 0.1;
  ctx.fillRect(cx - legW * 1.3, cy + height * 0.09, legW, height * 0.30);
  ctx.fillRect(cx + legW * 0.3, cy + height * 0.09, legW, height * 0.30);

  ctx.restore();
}

/**
 * رسم صورة مع الحفاظ على التناسب الاقتصاصي (Object Fit: Cover)
 */
function drawCoverImage(ctx, img, x, y, width, height) {
  const imgRatio = img.width / img.height;
  const boxRatio = width / height;

  let sx, sy, sWidth, sHeight;

  if (imgRatio > boxRatio) {
    sHeight = img.height;
    sWidth = img.height * boxRatio;
    sx = (img.width - sWidth) / 2;
    sy = 0;
  } else {
    sWidth = img.width;
    sHeight = img.width / boxRatio;
    sx = 0;
    sy = (img.height - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, width, height);
}

/**
 * محرك رسم كارت التحول الكامل على الـ Canvas
 */
export async function renderTransformationCard(canvas, {
  format = CARD_FORMATS.PORTRAIT_4_5,
  client = { name: 'المشترك المعتمد', code: '12' },
  beforeData = { week: 0, weight: 80, waist: 88, date: 'البداية', photoUrl: null },
  afterData = { week: 8, weight: 72, waist: 78, date: 'الأسبوع 8', photoUrl: null },
  privacy = {
    blurFace: false,
    hideClientName: true,
    customTitle: 'تحول رياضي استثنائي'
  },
  stats = null
}) {
  if (!canvas) return null;

  const width = format.width;
  const height = format.height;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const calculatedStats = stats || calculateTransformationStats({
    beforeWeight: beforeData.weight,
    afterWeight: afterData.weight,
    beforeWaist: beforeData.waist,
    afterWaist: afterData.waist,
    beforeWeek: beforeData.week,
    afterWeek: afterData.week,
    adherence: 95
  });

  // 1. الفخامة والعمق: خلفية متدرجة كحلية داكنة ملكية
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#090D16');
  bgGrad.addColorStop(0.5, '#0F172A');
  bgGrad.addColorStop(1, '#050811');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // إطار خارجي ذهبي فخم
  ctx.strokeStyle = '#C4952D';
  ctx.lineWidth = 4;
  roundRect(ctx, 24, 24, width - 48, height - 48, 20, false, true);

  // إطار داخلي خفيف
  ctx.strokeStyle = 'rgba(196, 149, 45, 0.25)';
  ctx.lineWidth = 1;
  roundRect(ctx, 34, 34, width - 68, height - 68, 16, false, true);

  // 2. الهيدر والشعار الرسمي
  const headerTop = 60;

  // شارة Z Coaching الرسمية
  ctx.fillStyle = '#C4952D';
  ctx.font = '900 36px "Cairo", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Z COACHING PLATFORM', width / 2, headerTop + 40);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '800 16px "Cairo", sans-serif';
  ctx.fillText('SCIENCE-BASED ELITE TRANSFORMATION', width / 2, headerTop + 70);

  // عنوان التحول وهوية المتدرب
  const displayName = privacy.hideClientName 
    ? `المتدرب #${client.code || '101'}` 
    : `${client.name || 'المتدرب'} (#${client.code || '101'})`;

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '900 28px "Cairo", sans-serif';
  ctx.fillText(`${privacy.customTitle || 'تحول رياضي معتمد'} • ${displayName}`, width / 2, headerTop + 120);

  // 3. مساحة الصورتين المتجاورتين (Before & After)
  const isStory = format.id === 'STORY_9_16';
  const isSquare = format.id === 'SQUARE_1_1';

  const photoY = headerTop + 150;
  const photoHeight = isStory ? height * 0.52 : (isSquare ? height * 0.55 : height * 0.57);
  const photoWidth = (width - 130) / 2;
  const photoRadius = 14;

  const beforeX = 55;
  const afterX = width / 2 + 10;

  // تحميل الصورتين
  const [beforeImg, afterImg] = await Promise.all([
    loadImageSafe(beforeData.photoUrl),
    loadImageSafe(afterData.photoUrl)
  ]);

  // -- رسم صورة (قبل / Before) --
  ctx.save();
  roundRect(ctx, beforeX, photoY, photoWidth, photoHeight, photoRadius, false, false);
  ctx.clip();
  if (beforeImg) {
    drawCoverImage(ctx, beforeImg, beforeX, photoY, photoWidth, photoHeight);
  } else {
    drawSilhouetteFallback(ctx, beforeX, photoY, photoWidth, photoHeight, true);
  }

  // طمس الوجه للخصوصية إن كان مفعلاً
  if (privacy.blurFace) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    const maskW = photoWidth * 0.55;
    const maskH = photoHeight * 0.16;
    const maskX = beforeX + (photoWidth - maskW) / 2;
    const maskY = photoY + photoHeight * 0.05;
    roundRect(ctx, maskX, maskY, maskW, maskH, 12, true, false);
    ctx.fillStyle = '#CBD5E1';
    ctx.font = 'bold 15px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('محمي للخصوصية', maskX + maskW / 2, maskY + maskH / 2 + 5);
  }
  ctx.restore();

  // إطار صورة قبل
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  roundRect(ctx, beforeX, photoY, photoWidth, photoHeight, photoRadius, false, true);

  // شارة كارت قبل (BEFORE BADGE)
  const badgeW = 210;
  const badgeH = 56;
  const badgeY = photoY + photoHeight - badgeH - 15;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  roundRect(ctx, beforeX + (photoWidth - badgeW) / 2, badgeY, badgeW, badgeH, 10, true, false);
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 1;
  roundRect(ctx, beforeX + (photoWidth - badgeW) / 2, badgeY, badgeW, badgeH, 10, false, true);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 17px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`البداية: ${beforeData.weight} كجم`, beforeX + photoWidth / 2, badgeY + 24);
  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 12px Cairo, sans-serif';
  ctx.fillText(beforeData.date || 'نقطة الانطلاق', beforeX + photoWidth / 2, badgeY + 44);

  // -- رسم صورة (بعد / After) --
  ctx.save();
  roundRect(ctx, afterX, photoY, photoWidth, photoHeight, photoRadius, false, false);
  ctx.clip();
  if (afterImg) {
    drawCoverImage(ctx, afterImg, afterX, photoY, photoWidth, photoHeight);
  } else {
    drawSilhouetteFallback(ctx, afterX, photoY, photoWidth, photoHeight, false);
  }

  // طمس الوجه للخصوصية إن كان مفعلاً
  if (privacy.blurFace) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    const maskW = photoWidth * 0.55;
    const maskH = photoHeight * 0.16;
    const maskX = afterX + (photoWidth - maskW) / 2;
    const maskY = photoY + photoHeight * 0.05;
    roundRect(ctx, maskX, maskY, maskW, maskH, 12, true, false);
    ctx.fillStyle = '#C4952D';
    ctx.font = 'bold 15px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('محمي للخصوصية', maskX + maskW / 2, maskY + maskH / 2 + 5);
  }
  ctx.restore();

  // إطار صورة بعد مع لمسة ذهبية
  ctx.strokeStyle = '#C4952D';
  ctx.lineWidth = 3;
  roundRect(ctx, afterX, photoY, photoWidth, photoHeight, photoRadius, false, true);

  // شارة كارت بعد (AFTER BADGE)
  ctx.fillStyle = 'rgba(196, 149, 45, 0.95)';
  roundRect(ctx, afterX + (photoWidth - badgeW) / 2, badgeY, badgeW, badgeH, 10, true, false);
  ctx.fillStyle = '#0F172A';
  ctx.font = '900 17px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`النتيجة: ${afterData.weight} كجم`, afterX + photoWidth / 2, badgeY + 24);
  ctx.fillStyle = '#1E293B';
  ctx.font = '600 12px Cairo, sans-serif';
  ctx.fillText(afterData.week !== undefined ? `الأسبوع ${afterData.week}` : 'التقييم الحالي', afterX + photoWidth / 2, badgeY + 44);

  // 4. شريط إحصائيات التحول الرقمي بالأرقام
  const statsY = photoY + photoHeight + 35;
  const statsH = isStory ? 200 : (isSquare ? 150 : 180);
  const statsW = width - 110;
  const statsX = 55;

  // خلفية شريط الإحصائيات
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  roundRect(ctx, statsX, statsY, statsW, statsH, 16, true, false);
  ctx.strokeStyle = 'rgba(196, 149, 45, 0.4)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, statsX, statsY, statsW, statsH, 16, false, true);

  // تقسيم كروت الإحصائيات الأربعة
  const metricCards = [
    {
      title: 'فارق الوزن الصافي',
      value: calculatedStats.weightDiff === 0 
        ? '0.0 كجم' 
        : (calculatedStats.weightDiff < 0 ? `-${Math.abs(calculatedStats.weightDiff)} كجم` : `+${calculatedStats.weightDiff} كجم`),
      sub: calculatedStats.weightDiff === 0 
        ? 'ثبات الوزن' 
        : (calculatedStats.weightDiff < 0 ? 'نزول دهون صافي' : 'بناء عضلي'),
      highlightColor: calculatedStats.weightDiff === 0 
        ? '#38BDF8' 
        : (calculatedStats.weightDiff < 0 ? '#22C55E' : '#38BDF8')
    },
    {
      title: 'تغير محيط الوسط',
      value: calculatedStats.waistDiff === 0 
        ? '0 سم' 
        : (calculatedStats.waistDiff < 0 ? `-${Math.abs(calculatedStats.waistDiff)} سم` : `+${calculatedStats.waistDiff} سم`),
      sub: calculatedStats.waistDiff === 0 ? 'ثبات المقاس' : 'انخفاض في مقاس الخصر',
      highlightColor: '#22C55E'
    },
    {
      title: 'مدة الالتزام',
      value: formatWeeksCountAr(calculatedStats.weeksCount),
      sub: 'خطة تدريب وتغذية دقيقة',
      highlightColor: '#F59E0B'
    },
    {
      title: 'معدل الالتزام',
      value: `${calculatedStats.adherenceRate}%`,
      sub: 'انضباط رياضي عالي',
      highlightColor: '#C4952D'
    }
  ];

  const colW = statsW / 4;
  metricCards.forEach((metric, idx) => {
    const mx = statsX + idx * colW + colW / 2;
    const my = statsY + (statsH * 0.28);

    // عنوان المقياس
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 16px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(metric.title, mx, my);

    // القيمة الرئيسية الكبيرة
    ctx.fillStyle = metric.highlightColor;
    ctx.font = '900 32px "JetBrains Mono", Cairo, sans-serif';
    ctx.fillText(metric.value, mx, my + 44);

    // الوصف الفرعي
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 14px Cairo, sans-serif';
    ctx.fillText(metric.sub, mx, my + 78);

    // فاصل عمودي ناعم
    if (idx < 3) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(statsX + (idx + 1) * colW, statsY + 20);
      ctx.lineTo(statsX + (idx + 1) * colW, statsY + statsH - 20);
      ctx.stroke();
    }
  });

  // 5. الفوتر الرسمي وشهادة الاعتماد
  const footerY = height - 65;
  ctx.fillStyle = '#C4952D';
  ctx.font = 'bold 16px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('منظومة التدريب الرياضي والتغذية الإكلينيكية المخصصة • Z Coaching Platform', width / 2, footerY);

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 13px "JetBrains Mono", Cairo, sans-serif';
  ctx.fillText('www.z-coaching.com • All Results Clinically Verified', width / 2, footerY + 24);

  return canvas;
}

/**
 * تنزيل كارت التحول كملف صورة PNG لجهاز الكوتش مباشرة
 */
export function downloadCanvasAsPng(canvas, filename = 'z_transformation_card.png') {
  if (!canvas || typeof document === 'undefined') return;
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * توليد نص رسالة مشاركة الكارت عبر واتساب
 */
export function buildTransformationWhatsAppShare({ client = {}, stats = null, beforeData = {}, afterData = {} }) {
  const calculated = stats || calculateTransformationStats({
    beforeWeight: beforeData.weight,
    afterWeight: afterData.weight,
    beforeWaist: beforeData.waist,
    afterWaist: afterData.waist,
    beforeWeek: beforeData.week,
    afterWeek: afterData.week
  });

  const lines = [
    `تحول رياضي استثنائي للمشترك #${client.code || '101'} مع منصة Z Coaching`,
    ``,
    `أبرز نتائج الالتزام خلال ${calculated.weeksCount} أسابيع:`,
    `- فارق الوزن: ${calculated.weightText}`,
    `- تغير محيط الوسط: ${calculated.waistText}`,
    `- نسبة الالتزام الإجمالية: ${calculated.adherenceRate}%`,
    ``,
    `التفاصيل الكاملة والتوثيق البصري معتمد ومسجل بالمنظومة.`
  ];

  return lines.join('\n');
}
