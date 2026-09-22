/**
 * Training age: how long the client has trained with weights regularly. "Beginner" alone covered
 * everyone under a year, so a client who never lifted got the volume of one with a year behind them.
 *
 * Scientific sources:
 * - ACSM Position Stand, Progression Models in Resistance Training for Healthy Adults (2009):
 *   novices 1-3 sets an exercise; intermediate and advanced lifters multiple sets with more volume.
 * - Schoenfeld, Ogborn & Krieger 2017 (dose-response meta-analysis): more weekly sets, more growth;
 *   Baz-Valle et al. 2022 (systematic review): 12-20 weekly sets a muscle for trained lifters.
 * - Zourdos et al. 2016: novices misjudge reps in reserve close to failure (so more reserve).
 *
 * The three older levels keep their exact plans: beginner = 6_12_months, intermediate = 1_2_years,
 * advanced = over_4_years (policies with no change).
 */
export const TRAINING_AGES = Object.freeze(["never", "under_6_months", "6_12_months", "1_2_years", "2_4_years", "over_4_years"]);

const EXPERIENCE_BY_TRAINING_AGE = Object.freeze({
  never: "NEVER_TRAINED",
  under_6_months: "BEGINNER",
  "6_12_months": "BEGINNER",
  "1_2_years": "INTERMEDIATE",
  "2_4_years": "INTERMEDIATE",
  over_4_years: "ADVANCED",
});

const TRAINING_AGE_BY_EXPERIENCE = Object.freeze({
  NEVER_TRAINED: "never",
  BEGINNER: "6_12_months",
  INTERMEDIATE: "1_2_years",
  ADVANCED: "over_4_years",
});

/**
 * Per training age, on top of the experience level:
 * - baseSets: every exercise starts at this many sets;
 * - isolationSets: exercises that are not compounds start at this many sets;
 * - heavyCompoundSets: heavy compounds start at this many sets;
 * - addSetsInLoadingWeeks: false keeps weeks 3-4 at the base (no added set);
 * - minRir: reps in reserve never below this.
 */
export const TRAINING_AGE_POLICY = Object.freeze({
  never: Object.freeze({ baseSets: 2, addSetsInLoadingWeeks: false, minRir: 3 }),
  under_6_months: Object.freeze({ isolationSets: 2 }),
  "6_12_months": Object.freeze({}),
  "1_2_years": Object.freeze({}),
  "2_4_years": Object.freeze({ heavyCompoundSets: 4 }),
  // Advanced lifters were getting 3 sets on full-body compounds (the templates fixed the dose).
  over_4_years: Object.freeze({ heavyCompoundSets: 4 }),
});

/** A form value (any case, spaces or dashes) as one of TRAINING_AGES, or null. */
export function normalizeTrainingAge(value) {
  const key = String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return TRAINING_AGES.includes(key) ? key : null;
}

export function experienceForTrainingAge(trainingAge) {
  return EXPERIENCE_BY_TRAINING_AGE[normalizeTrainingAge(trainingAge)] || null;
}

/** The training age an older intake implies from its experience level alone. */
export function trainingAgeForExperience(experience) {
  return TRAINING_AGE_BY_EXPERIENCE[String(experience || "").toUpperCase()] || "6_12_months";
}

export function trainingAgePolicy(trainingAge) {
  return TRAINING_AGE_POLICY[normalizeTrainingAge(trainingAge)] || TRAINING_AGE_POLICY["6_12_months"];
}
