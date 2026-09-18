/**
 * محرك ضغط وتحسين الصور فائق الجودة لمنظومة Z Coaching
 * Ultra-Sharp Image Optimizer & Compressor
 * 
 * المبادئ الحاكمة:
 * 1. ضغط الصور بنسبة تصل إلى 95-98% (تقليص الحجم من 10MB إلى 150-250KB).
 * 2. الحفاظ التام على حدة النصوص في أوراق التحاليل وتفاصيل العضلات في صور المقارنة (Zero Pixelation).
 * 3. دعم صيغة WebP الحديثة فائقة الضغط مع الرجوع التلقائي إلى JPEG عالي الجودة.
 * 4. التعامل الآمن مع ملفات PDF والمستندات دون تشويه.
 */

export async function optimizeImageFile(file, options = {}) {
  if (!file) return null;

  // 1. إذا كان الملف PDF أو مستنداً غير صورة، يتم تحويله كـ DataURL قياسي دون المساس به
  if (file.type === 'application/pdf' || !file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    preferredFormat = 'image/webp'
  } = options;

  return new Promise((resolve, reject) => {
    // إنشاء Object URL مؤقت لقراءة أبعاد الصورة الأصلية
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // حساب النسبة الرياضية للأبعاد مع الحفاظ التام على التناسب (Aspect Ratio)
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // إنشاء Canvas بدقة عالية
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        // في حال فشل السياق، الرجوع للقراءة العادية
        const fallbackReader = new FileReader();
        fallbackReader.onload = (e) => resolve(e.target.result);
        fallbackReader.readAsDataURL(file);
        return;
      }

      // تطبيق خوارزمية التنعيم ثنائي التكعيب عالية الجودة لمنع البكسلة نهائياً
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // خلفية بيضاء نقية لمنع الشفافية السوداء في ملفات JPEG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // رسم الصورة بعد ضبط الحجم
      ctx.drawImage(img, 0, 0, width, height);

      // محاولة التصدير بصيغة WebP الحديثة، والرجوع إلى JPEG إن لم تكن مدعومة
      let dataUrl = '';
      try {
        dataUrl = canvas.toDataURL(preferredFormat, quality);
        if (!dataUrl.startsWith(`data:${preferredFormat}`)) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
      } catch {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(dataUrl);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      // في حال تعذر القراءة المباشرة، الرجوع لـ FileReader
      const fallbackReader = new FileReader();
      fallbackReader.onload = (e) => resolve(e.target.result);
      fallbackReader.onerror = () => reject(err);
      fallbackReader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}

/**
 * معالجة وضغط مجموعة من الملفات دفعة واحدة
 */
export async function optimizeMultipleFiles(files, options = {}) {
  if (!files || files.length === 0) return [];
  const fileArray = Array.from(files);
  const results = await Promise.all(fileArray.map(f => optimizeImageFile(f, options)));
  return results.filter(Boolean);
}
