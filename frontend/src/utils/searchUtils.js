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
    // 1. Remove Zero-width characters & invisible marks
    .replace(/[\u200B-\u200F\uFEFF]/g, '')
    // 2. Remove Tashkeel & Harakat (Fatha, Damma, Kasra, Tanween, Shadda, Sukun, Tatweel/Kashida)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // 3. Normalize all Alef variations (أ, إ, آ, ٱ, ٵ) -> ا
    .replace(/[أإآٱٵ]/g, 'ا')
    // 4. Normalize Taa Marbuta (ة) -> ه
    .replace(/ة/g, 'ه')
    // 5. Normalize Yaa variants, Persian Yeh, and Hamza on Nabira (ى, ئ, ي, ی, ێ) -> ي
    .replace(/[ىئيیێ]/g, 'ي')
    // 6. Normalize Waw with Hamza (ؤ) -> و
    .replace(/ؤ/g, 'و')
    // 7. Normalize Persian/Urdu Kaf (ک, ڪ) -> ك
    .replace(/[کڪ]/g, 'ك')
    // 8. Normalize solitary Hamza (ء) -> empty
    .replace(/ء/g, '')
    // 9. Collapse spaces
    .replace(/\s+/g, ' ');
}

export const normalizeArabicText = normalizeArabic;

/**
 * Checks if haystack contains needle using normalized Arabic/English comparison.
 * Supports:
 * 1. Hamza & Alef flexibility (أ/إ/آ/ا/ء)
 * 2. Taa Marbuta / Haa flexibility (ة/ه)
 * 3. Alef Maqsura / Yaa flexibility (ى/ي)
 * 4. Definite article "ال" and prefixes ("البنش" <-> "بنش", "بالبنش" <-> "بنش")
 * 5. Transliteration slang flexibility ("اسكوات" <-> "سكوات", "استريتش" <-> "ستريتش")
 * 6. Multi-word token matching (typing "صدر دمبل" matches "بنش مائل بالدمبل للصدر")
 */
export function arabicSearchMatch(haystack, needle) {
  if (!needle || !String(needle).trim()) return true;
  if (!haystack && haystack !== 0) return false;
  
  const normHaystack = normalizeArabic(haystack);
  const normNeedle = normalizeArabic(needle);
  
  // Direct full substring match first
  if (normHaystack.includes(normNeedle)) return true;
  
  // Tokenize needle into individual words
  const tokens = normNeedle.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  
  // Every token in the needle must find a match in the haystack
  return tokens.every(token => {
    // 1. Direct token match
    if (normHaystack.includes(token)) return true;
    
    // 2. Definite article "ال" flexibility:
    // If search term has "ال" and target doesn't (e.g. searched "البنش" and target is "بنش")
    if (token.startsWith('ال') && token.length >= 4) {
      const withoutAl = token.slice(2);
      if (normHaystack.includes(withoutAl)) return true;
    }

    // 3. Preposition "بال" / "كال" flexibility (e.g. "بالدمبل" -> "دمبل" or "الدمبل")
    if ((token.startsWith('بال') || token.startsWith('كال')) && token.length >= 5) {
      const withoutPrefix = token.slice(3);
      const withAl = 'ال' + withoutPrefix;
      if (normHaystack.includes(withoutPrefix) || normHaystack.includes(withAl)) return true;
    }

    // 4. Preposition "لل" flexibility (e.g. "للصدر" -> "صدر" or "الصدر")
    if (token.startsWith('لل') && token.length >= 4) {
      const withoutPrefix = token.slice(2);
      const withAl = 'ال' + withoutPrefix;
      if (normHaystack.includes(withoutPrefix) || normHaystack.includes(withAl)) return true;
    }
    
    // 5. Initial Alef on gym transliterations ("اسكوات" <-> "سكوات", "استريتش" <-> "ستريتش")
    if (token.startsWith('اس') && token.length >= 5) {
      const withoutAlef = token.slice(1);
      if (normHaystack.includes(withoutAlef)) return true;
    }
    if (token.startsWith('سكوات') && normHaystack.includes('اسكوات')) return true;
    if (token.startsWith('ستريتش') && normHaystack.includes('استريتش')) return true;
    
    return false;
  });
}

/**
 * Multi-field search matcher.
 * Matches if ANY of the fields satisfies the flexible Arabic needle.
 */
export function multiFieldArabicMatch(fields = [], needle) {
  if (!needle || !String(needle).trim()) return true;
  return fields.some(field => arabicSearchMatch(field, needle));
}
