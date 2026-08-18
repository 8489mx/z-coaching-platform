/**
 * Global Arabic & Multilingual Search Normalization Utility
 * Handles Hamzas (أ, إ, آ, ٱ -> ا), Taa Marbuta (ة -> ه), Yaa/Alef Maqsura (ى, ئ -> ي),
 * Waw Hamza (ؤ -> و), Tashkeel/Harakat removal, and whitespace trimming.
 */

export function normalizeArabic(text) {
  if (text === undefined || text === null) return '';
  return String(text)
    .toLowerCase()
    .trim()
    // 1. Remove Tashkeel & Harakat (Fatha, Damma, Kasra, Tanween, Shadda, Sukun, Tatweel/Kashida)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // 2. Normalize all Alef variations (أ, إ, آ, ٱ, ٵ) -> ا
    .replace(/[أإآٱٵ]/g, 'ا')
    // 3. Normalize Taa Marbuta (ة) -> ه
    .replace(/ة/g, 'ه')
    // 4. Normalize Yaa variants and Hamza on Nabira (ى, ئ) -> ي
    .replace(/[ىئ]/g, 'ي')
    // 5. Normalize Waw with Hamza (ؤ) -> و
    .replace(/ؤ/g, 'و')
    // 6. Normalize solitary Hamza (ء) -> empty or match flexible
    .replace(/ء/g, '')
    // 7. Collapse spaces
    .replace(/\s+/g, ' ');
}

/**
 * Checks if haystack contains needle using normalized Arabic/English comparison.
 * Returns true if needle is empty or if matched.
 */
export function arabicSearchMatch(haystack, needle) {
  if (!needle || !String(needle).trim()) return true;
  if (!haystack && haystack !== 0) return false;
  
  const normHaystack = normalizeArabic(haystack);
  const normNeedle = normalizeArabic(needle);
  
  return normHaystack.includes(normNeedle);
}

/**
 * Multi-field search matcher.
 * Matches if ANY of the fields contains the needle.
 */
export function multiFieldArabicMatch(fields = [], needle) {
  if (!needle || !String(needle).trim()) return true;
  const normNeedle = normalizeArabic(needle);
  
  return fields.some(field => {
    if (field === undefined || field === null) return false;
    const normField = normalizeArabic(field);
    return normField.includes(normNeedle);
  });
}
