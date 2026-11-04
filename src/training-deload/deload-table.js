/**
 * One deload table (P1-B5). Before this, the dose and the fatigue trigger
 * lived in several places and disagreed: the auto-deload eligibility check
 * prescribed 50% with a fatigue threshold of 8, while the deload protocol,
 * the mesocycle message and the session transform all used 40% with a
 * threshold of 7. The canonical values below are the majority values: 40%
 * is what the deload protocol, the mesocycle message, the session transform
 * and the advanced adaptation dose all use, and 7 is what the deload
 * protocol and the adaptation engine use. Every deload decision reads from
 * here; nothing hardcodes its own dose or threshold anymore.
 *
 * Pure: no imports, no side effects.
 */

// Volume reduction applied to a deload week (sets, not load).
export const DELOAD_VOLUME_REDUCTION_PCT = 40;

// Fatigue score (0-10) at or above which a deload triggers.
export const DELOAD_FATIGUE_THRESHOLD = 7;

// Length of a deload week.
export const DELOAD_DURATION_DAYS = 7;

// Effort band for deload work: stay this far from failure.
export const DELOAD_RIR_MIN = 3;
export const DELOAD_RIR_TARGET = 4;
