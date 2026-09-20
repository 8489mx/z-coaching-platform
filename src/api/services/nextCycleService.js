/**
 * Building the client's next training cycle from the one they just finished.
 *
 * The plan stays the same plan: same split, same exercises, same order. A client who trained the
 * same lifts for six weeks knows them, and the only way to keep adding load is to keep measuring the
 * same movement. What carries over is the number that matters: the weight each exercise actually
 * finished at, taken from the client's own logs (the progression engine already resolves the right
 * starting load after a deload, including the lighter restart for a lift that stalled).
 *
 * What this deliberately does NOT do is swap an exercise for a client who reported pain in it.
 * Replacing a movement for a painful joint is a clinical decision, so the exercise is flagged and
 * the cycle waits for the coach instead of quietly changing the plan.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** The weeks of a plan, whichever of the two shapes the training block uses. */
function readWeeks(programData = {}) {
  const training = programData.training_program || programData.training || {};
  return Array.isArray(training.weeks) ? training.weeks : [];
}

function writeWeeks(programData, weeks) {
  if (programData.training_program) programData.training_program = { ...programData.training_program, weeks };
  else if (programData.training) programData.training = { ...programData.training, weeks };
  return programData;
}

/**
 * @param {object} args
 * @param {object} args.program        the Program row the client just finished
 * @param {object} args.progression    loadProgressionState(user.id) for that client
 * @param {string[]} [args.flagged_exercises]  exercise codes the client reported joint pain in
 * @param {Date} [args.now]
 * @returns {{program_data: object, summary: object}}
 */
export function buildNextCycle({ program, progression = {}, flagged_exercises = [], now = new Date() }) {
  const previous = program?.program_data || {};
  const programData = JSON.parse(JSON.stringify(previous));
  const states = progression.exercises || {};
  const stalled = new Set([...(progression.stalled_exercises || []), ...(progression.dropping_exercises || [])]);
  const flagged = new Set(flagged_exercises.map((code) => String(code).toUpperCase()));

  const carried = [];
  const lighter = [];
  const needsReview = [];

  const weeks = readWeeks(programData).map((week) => ({
    ...week,
    sessions: (week.sessions || []).map((session) => ({
      ...session,
      exercises: (session.exercises || []).map((exercise) => {
        const code = String(exercise.exercise_code || exercise.code || "").toUpperCase();
        const target = states[code]?.target;
        const next = { ...exercise };

        if (target?.weight_kg) {
          next.start_weight_kg = target.weight_kg;
          next.start_weight_rule = target.rule || target.decision || null;
          next.start_weight_directive_ar = target.directive_ar || null;
          carried.push(code);
          if (stalled.has(code)) lighter.push(code);
        }

        if (flagged.has(code)) {
          // Kept in the plan, marked for the coach: swapping a movement for a painful joint is theirs to decide.
          next.needs_coach_review = true;
          next.coach_review_reason_ar = "المتدرب سجّل ألماً في هذا التمرين؛ راجع استبداله ببديل آمن قبل اعتماد الدورة.";
          needsReview.push(code);
        }

        return next;
      }),
    })),
  }));

  writeWeeks(programData, weeks);

  const previousCycle = Number(previous.cycle_number) > 0 ? Number(previous.cycle_number) : 1;
  programData.cycle_number = previousCycle + 1;
  programData.cycle_started_at = new Date(now.getTime()).toISOString();
  programData.previous_cycle = {
    cycle_number: previousCycle,
    ended_on: new Date(now.getTime() - DAY_MS).toISOString().slice(0, 10),
  };

  return {
    program_data: programData,
    summary: {
      cycle_number: programData.cycle_number,
      weeks: weeks.length,
      exercises_carried: [...new Set(carried)],
      exercises_starting_lighter: [...new Set(lighter)],
      exercises_needing_coach_review: [...new Set(needsReview)],
      message_ar: needsReview.length > 0
        ? `تم تجهيز الدورة ${programData.cycle_number} بنفس التمارين وأوزان المتدرب الفعلية، مع ${needsReview.length} تمرين يحتاج مراجعتك بسبب ألم مسجّل.`
        : `تم تجهيز الدورة ${programData.cycle_number} بنفس التمارين، والأوزان محمولة من سجلات المتدرب الفعلية.`,
    },
  };
}

/** Exercise codes the client reported joint pain in, from the analysis stored on their check-ins. */
export function resolvePainFlaggedExercises(checkins = []) {
  const codes = new Set();
  for (const checkin of checkins) {
    const analysis = checkin?.analysis_output;
    const parsed = typeof analysis === "string" ? JSON.parse(analysis) : analysis;
    const recommendation = parsed?.deload_recommendation;
    if (recommendation?.reason !== "JOINT_PAIN") continue;
    for (const code of recommendation.affected_exercises || []) codes.add(String(code).toUpperCase());
  }
  return [...codes];
}
