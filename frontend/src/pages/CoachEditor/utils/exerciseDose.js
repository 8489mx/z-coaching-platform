/**
 * Dose mapping for the coach editor's exercise rows (PACKAGE S1, item 13).
 *
 * A held row (HELD_SLOT_...) has no dose by design — the coach must fill
 * it. The old mapping defaulted it to 3 sets / '10 - 12' reps, inventing a
 * prescription for a slot the engine deliberately left empty. Held rows
 * keep nulls (the training tab renders an empty dose); real exercises keep
 * the old behaviour (prescription first, then the exercise's own dose,
 * then 3 sets / '10 - 12').
 */
export function doseForEditorExercise(ex) {
  const code = ex?.exercise_code || ex?.code || ex?.id;
  const presc = ex?.prescription || {};
  const isHeld = String(code || "").startsWith("HELD_SLOT");
  if (isHeld) return { sets: null, reps: null };
  const sets = presc.sets || ex?.sets || 3;
  const reps =
    presc.target_min && presc.target_max
      ? `${presc.target_min} - ${presc.target_max}`
      : ex?.reps || "10 - 12";
  return { sets, reps };
}
