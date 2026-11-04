// P1-B11: ONE builder for the human-readable cardio line from the served
// cardio card. Used by the review screen (lazy program fetch) and the
// macro calculator (copy summary). Returns null when the card carries no
// usable protocol, so callers omit the line instead of inventing one.
export function formatCardioLine(cardio) {
  if (!cardio || typeof cardio !== 'object') return null;
  const parts = [
    cardio.protocol_title_ar || cardio.modality || null,
    cardio.sessions_per_week ? `${cardio.sessions_per_week} مرات أسبوعياً` : null,
    cardio.duration_minutes ? `${cardio.duration_minutes} دقيقة` : null
  ].filter(Boolean);
  return parts.length > 0 ? parts.join('، ') : null;
}
