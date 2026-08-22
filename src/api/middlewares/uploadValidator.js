/**
 * Secure Photo Upload Validator
 * Verifies magic header bytes (.jpeg, .png, .webp) and max 10MB size.
 */

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const validatePhotoPayload = (base64OrBuffer) => {
  if (!base64OrBuffer) return { valid: false, error: "الملف مطلوب" };

  let buffer;
  if (typeof base64OrBuffer === 'string') {
    // Extract base64
    const base64Data = base64OrBuffer.replace(/^data:image\/\w+;base64,/, "");
    buffer = Buffer.from(base64Data, 'base64');
  } else if (Buffer.isBuffer(base64OrBuffer)) {
    buffer = base64OrBuffer;
  } else {
    return { valid: false, error: "صيغة الملف غير مدعومة" };
  }

  if (buffer.length > MAX_SIZE_BYTES) {
    return { valid: false, error: "حجم الصورة يتجاوز الحد الأقصى المسموح به (10 ميجابايت)" };
  }

  // Check Magic Bytes
  // JPEG: FF D8 FF
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  // PNG: 89 50 4E 47
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  // WEBP: 52 49 46 46 ... 57 45 42 50
  const isWebp = buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';

  if (!isJpeg && !isPng && !isWebp) {
    return { valid: false, error: "امتداد الصورة غير صالح. يُسمح فقط بملفات JPEG, PNG, أو WebP الحقيقية." };
  }

  let mime = 'image/jpeg';
  if (isPng) mime = 'image/png';
  if (isWebp) mime = 'image/webp';

  return { valid: true, mime, size: buffer.length };
};
