/**
 * Whether an exercise suits a client's injuries and equipment, read from the exercise code, for the
 * coach's manual swaps. The joint rules are the server swap engine's own (JOINT_STRESS_BY_NAME in
 * src/exercise-swap-engine), kept identical by test/exercise-safety-drift-guard.test.js.
 */
export const JOINT_STRESS_BY_NAME = Object.freeze({
  KNEE: /SQUAT|LUNGE|LEG_EXT|LEG_PRESS|HACK|STEP_UP|SPLIT|PISTOL|JUMP|SISSY|WALL_SIT/,
  LOWER_BACK: /DEADLIFT|RDL|ROMANIAN|BENT_OVER|GOOD_MORNING|T_BAR|BARBELL_ROW|PENDLAY|BACK_SQUAT|FRONT_SQUAT|KETTLEBELL_SWING|CLEAN|SNATCH|HYPEREXT|BACK_EXTENSION/,
  SHOULDER: /OVERHEAD|SHOULDER_PRESS|MILITARY|ARNOLD|PUSH_PRESS|PIKE|HANDSTAND|UPRIGHT_ROW|DIP|BEHIND_NECK|SNATCH|INCLINE_BENCH/,
  WRIST: /STRAIGHT_BAR_CURL|WRIST/,
  ELBOW: /SKULL_CRUSHER|DIP|PREACHER/,
  NECK: /BEHIND_NECK|SHRUG/,
});

const JOINT_AR = { KNEE: 'الركبة', LOWER_BACK: 'أسفل الظهر', SHOULDER: 'الكتف', WRIST: 'الرسغ', ELBOW: 'الكوع', NECK: 'الرقبة' };
const INJURY_TO_JOINTS = [
  [/knee|ركب/i, ['KNEE']],
  [/back|spine|disc|ظهر|فقر|ديسك/i, ['LOWER_BACK']],
  [/shoulder|كتف/i, ['SHOULDER']],
  [/wrist|رسغ|معصم/i, ['WRIST']],
  [/elbow|كوع|مرفق/i, ['ELBOW']],
  [/neck|رقب/i, ['NECK']],
];
const GYM_GEAR = /BARBELL|CABLE|MACHINE|SMITH|LEG_PRESS|HACK|LAT_PULLDOWN|PEC_DECK|EZ_BAR|T_BAR/;
const FREE_WEIGHTS = /DUMBBELL|KETTLEBELL|GOBLET/;

/** Arabic reasons this exercise does not suit the client (empty when it does). */
export function exerciseConflicts(exerciseCode, profile = {}) {
  const code = String(exerciseCode || '').toUpperCase();
  const reasons = [];
  const injured = new Set((profile.injuries || []).flatMap((injury) => INJURY_TO_JOINTS.filter(([re]) => re.test(String(injury))).flatMap(([, joints]) => joints)));
  for (const joint of injured) {
    if (JOINT_STRESS_BY_NAME[joint]?.test(code)) reasons.push(`بيحمّل ${JOINT_AR[joint]} والعميل عنده إصابة فيها`);
  }
  const setup = String(profile.training_environment || '').toLowerCase();
  const band = /^BAND_/.test(code);
  if (!band && ['home_gym', 'minimal_equipment', 'calisthenics_bands'].includes(setup) && GYM_GEAR.test(code)) reasons.push('محتاج أجهزة جيم والعميل بيتمرن في البيت');
  else if (!band && setup === 'calisthenics_bands' && FREE_WEIGHTS.test(code)) reasons.push('محتاج أوزان حرة والعميل عنده أحبال ووزن جسم بس');
  return reasons;
}
