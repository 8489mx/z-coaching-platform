/**
 * Stress test: 6 hand-built worst cases + 300 seeded random clients (men and women, every condition,
 * allergy, injury, environment and goal) through buildMasterEngineV2, checked against the engine's
 * own food attributes: allergies, glycemic index for diabetes, gout, favism, bariatric dumping,
 * equipment at home, portions, macros vs calories, kidney protein cap, calorie floor, cardio.
 * No database. Run: node scripts/stress-random-clients.mjs
 */
const R = new URL("../", import.meta.url).href;
const { buildMasterEngineV2 } = await import(R + 'src/master-engine-v2/index.js');
const { FOOD_SWAP_DATABASE } = await import(R + 'src/nutrition-meal-context-v2/index.js');
const { getFoodClinicalProperties } = await import(R + 'src/execution-engines/food-swap-engine.js');
const { JOINT_PAIN_SWAP_MATRIX } = await import(R + 'frontend/src/utils/biomechanicsFirewallEngine.js');
const fs = await import('node:fs/promises');
const catalog = JSON.parse(await fs.readFile(new URL('data/catalogs/core-global-food-batch-v1.json', R), 'utf8'));

// ---------- deterministic randomness so every failure can be replayed ----------
let seed = 20260921;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const some = (arr, max) => { const n = Math.floor(rnd() * (max + 1)); const s = new Set(); while (s.size < n) s.add(pick(arr)); return [...s]; };

const BODIES = [
  { gender: 'female', age: '18', height_cm: '165', weight_kg: '42', neck: '29', waist: '58', hips: '80' },   // underweight teen
  { gender: 'female', age: '29', height_cm: '160', weight_kg: '58', neck: '31', waist: '70', hips: '94' },
  { gender: 'female', age: '38', height_cm: '158', weight_kg: '112', neck: '38', waist: '118', hips: '135' }, // obese
  { gender: 'female', age: '62', height_cm: '155', weight_kg: '78', neck: '35', waist: '96', hips: '110' },   // older
  { gender: 'female', age: '74', height_cm: '150', weight_kg: '51', neck: '32', waist: '82', hips: '95' },    // elderly
  { gender: 'male', age: '18', height_cm: '172', weight_kg: '55', neck: '34', waist: '68', hips: '84' },
  { gender: 'male', age: '34', height_cm: '178', weight_kg: '104', neck: '44', waist: '112', hips: '110' },
  { gender: 'male', age: '45', height_cm: '170', weight_kg: '150', neck: '50', waist: '145', hips: '140' },   // severe obesity
  { gender: 'male', age: '27', height_cm: '200', weight_kg: '130', neck: '44', waist: '100', hips: '110' },   // very tall
  { gender: 'male', age: '68', height_cm: '168', weight_kg: '84', neck: '41', waist: '104', hips: '102' },
];
const GOALS = ['fat_loss', 'lean_bulk', 'recomposition', 'general_fitness'];
// Conditions the service follows. Kidney disease, pregnancy, a diagnosed heart condition and a body
// far too light are refused before a plan is built (src/api/services/serviceScope.js), so a plan for
// them cannot be stress-tested - there is none.
const CONDITIONS = ['diabetes', 'hepatic', 'gout', 'favism_g6pd', 'hypertension', 'bariatric_surgery', 'gi_tract', 'thyroid'];
const ALLERGIES = ['dairy_lactose', 'gluten_celiac', 'peanuts_tree_nuts', 'fish_shellfish', 'eggs', 'soy', 'sesame_seeds'];
const INJURIES = ['knee', 'spine_back', 'shoulder', 'core', 'elbow_wrist'];
const ENVS = ['commercial_gym', 'home_gym', 'minimal_equipment', 'calisthenics_bands'];
const EXPERIENCE = ['beginner', 'intermediate', 'advanced'];

function intakeFrom(p) {
  const selected = p.conditions.length ? p.conditions : ['none'];
  return {
    gender: p.body.gender, age: p.body.age, height_cm: p.body.height_cm, weight_kg: p.body.weight_kg,
    circumferences: { neck_cm: p.body.neck, waist_cm: p.body.waist, hips_cm: p.body.hips },
    primary_goal: p.goal, neat_level: pick(['sedentary', 'moderate', 'very_active']), occupation_type: 'DESK_OFFICE',
    dangerous_symptoms: p.chestPain ? [p.id.charCodeAt(p.id.length - 1) % 2 ? 'CHEST_PAIN' : 'chest_tightness_new_option'] : ['NONE'],
    medical_conditions: {
      has_conditions: p.conditions.length > 0, selected,
      diabetes: { type: 'type2', uses_insulin: p.conditions.includes('diabetes') && p.insulin },
      bariatric: { is_operated: p.conditions.includes('bariatric_surgery'), meal_capacity_grams: '150_200', dumping_syndrome: p.conditions.includes('bariatric_surgery') && p.dumping },
      female_cases: { is_pcos: p.pcos, is_lactating: p.lactating, is_postpartum: false },
    },
    injuries_map: {
      has_injuries: p.injuries.length > 0, selected_areas: p.injuries.length ? p.injuries : ['none'],
      injury_nature: p.acute ? 'acute' : 'chronic', pain_relieved_by_rest: !p.acute,
    },
    religion: p.religion, christianFastingStyle: 'STRICT_VEGAN',
    strict_allergies: p.allergies.length ? p.allergies : ['none'],
    meal_structure: { meals_count: pick(['3_meals', '3_meals_snack', '4_to_5_meals']), intermittent_fasting: p.fasting },
    food_budget: pick(['LOW', 'MEDIUM', 'HIGH']), food_prep_ability: pick(['FULL_KITCHEN', 'REHEAT_ONLY', 'NO_KITCHEN']),
    sleep_schedule: { pattern: pick(['regular_night', 'rotating_shifts', 'night_shift', 'irregular']), average_hours: '6_7', bedtime_hour: '23:00' },
    training_environment: p.env,
    training_logistics: { days_per_week: p.days, experience_level: p.experience },
    recent_training: pick(['ACTIVE', 'INCONSISTENT', 'NONE_LAST_4_WEEKS', 'RETURNING_AFTER_LONG_BREAK']),
    focus_muscles: some(['upper_chest', 'lats_width', 'side_delts', 'arms', 'glutes_legs'], 2),
  };
}

function randomPersona(i) {
  const body = pick(BODIES);
  const isFemale = body.gender === 'female';
  return {
    id: 'R' + String(i).padStart(3, '0'), body, goal: pick(GOALS),
    conditions: some(CONDITIONS, 3), insulin: rnd() < 0.5, dumping: rnd() < 0.6,
    pcos: isFemale && rnd() < 0.3, lactating: isFemale && rnd() < 0.15,
    allergies: some(ALLERGIES, 3), injuries: some(INJURIES, 2), acute: rnd() < 0.3,
    env: pick(ENVS), days: 2 + Math.floor(rnd() * 5), experience: pick(EXPERIENCE),
    religion: pick(['MUSLIM', 'CHRISTIAN', 'OTHER']), fasting: pick(['none', 'none', '16_8', '14_10']),
    chestPain: rnd() < 0.08,
  };
}

// Hand-built nightmares: everything at once.
const NIGHTMARES = [
  { id: 'N01-كل الأمراض رجل', body: BODIES[7], goal: 'fat_loss', conditions: ['diabetes', 'gout', 'hypertension', 'favism_g6pd'], insulin: true, dumping: false, pcos: false, lactating: false, allergies: ALLERGIES, injuries: ['knee', 'spine_back', 'shoulder'], acute: true, env: 'calisthenics_bands', days: 3, experience: 'beginner', religion: 'MUSLIM', fasting: '16_8', chestPain: false },
  { id: 'N02-تكميم+إغراق+سكري ست', body: BODIES[2], goal: 'fat_loss', conditions: ['bariatric_surgery', 'diabetes'], insulin: true, dumping: true, pcos: true, lactating: false, allergies: ['dairy_lactose', 'gluten_celiac'], injuries: ['knee'], acute: false, env: 'minimal_equipment', days: 2, experience: 'beginner', religion: 'CHRISTIAN', fasting: 'none', chestPain: false },
  { id: 'N03-مرضعة نحيفة حساسيات', body: BODIES[0], goal: 'lean_bulk', conditions: ['favism_g6pd'], insulin: false, dumping: false, pcos: false, lactating: true, allergies: ALLERGIES, injuries: [], acute: false, env: 'home_gym', days: 6, experience: 'advanced', religion: 'OTHER', fasting: 'none', chestPain: false },
  { id: 'N04-مسنة كبد', body: BODIES[4], goal: 'general_fitness', conditions: ['hepatic', 'hypertension'], insulin: false, dumping: false, pcos: false, lactating: false, allergies: ['fish_shellfish'], injuries: ['spine_back', 'knee'], acute: true, env: 'calisthenics_bands', days: 2, experience: 'beginner', religion: 'MUSLIM', fasting: 'none', chestPain: false },
  { id: 'N05-ألم صدر', body: BODIES[9], goal: 'fat_loss', conditions: ['hypertension', 'diabetes'], insulin: false, dumping: false, pcos: false, lactating: false, allergies: [], injuries: [], acute: false, env: 'commercial_gym', days: 5, experience: 'intermediate', religion: 'MUSLIM', fasting: 'none', chestPain: true },
  { id: 'N06-عملاق تضخيم 6 أيام', body: BODIES[8], goal: 'lean_bulk', conditions: [], insulin: false, dumping: false, pcos: false, lactating: false, allergies: ['peanuts_tree_nuts'], injuries: ['shoulder'], acute: false, env: 'commercial_gym', days: 6, experience: 'advanced', religion: 'OTHER', fasting: 'none', chestPain: false },
];

// ---------- checks, all against the engine's own data ----------
const FOOD = (c) => FOOD_SWAP_DATABASE[c];
const INJURY_KEY = { knee: 'KNEE', spine_back: 'LOWER_BACK', shoulder: 'SHOULDER' };
const HOME_FORBIDDEN = {
  calisthenics_bands: /^(?!BAND_).*(DUMBBELL|BARBELL|CABLE|MACHINE|SMITH|LAT_PULLDOWN|GOBLET)/,
  minimal_equipment: /^(?!BAND_).*(BARBELL|CABLE|MACHINE|SMITH|LAT_PULLDOWN)/,
  home_gym: /^(?!BAND_).*(BARBELL|CABLE|MACHINE|SMITH|LAT_PULLDOWN)/,
};

function check(p, program) {
  const f = [];
  const fail = (name, detail) => f.push({ name, detail });
  const t = program.nutrition_program?.targets || {};
  const mt = program.nutrition_program?.macro_targets || {};
  const w = Number(p.body.weight_kg);
  const cal = Number(mt.calories_kcal ?? t.target_calories);
  const protein = Number(mt.protein_g ?? t.protein_g);
  const carbs = Number(mt.carbohydrate_g ?? t.carb_g);
  const fat = Number(mt.fat_g ?? t.fat_g);

  for (const [k, v] of Object.entries({ cal, protein, carbs, fat })) if (!Number.isFinite(v)) fail('رقم غير صالح في الأهداف', `${k}=${v}`);
  const floor = p.body.gender === 'female' ? 1200 : 1500;
  const tdee = Number(t.tdee);
  if (Number.isFinite(cal) && cal < Math.min(floor, Number.isFinite(tdee) ? tdee : floor) - 1) fail('سعرات تحت الحد الأدنى', `${cal} (الحد ${floor}، الصيانة ${tdee})`);
  if (cal > 6000) fail('سعرات غير منطقية', String(cal));
  const atwater = 4 * protein + 4 * carbs + 9 * fat;
  if (Number.isFinite(atwater) && cal > 0 && Math.abs(atwater - cal) / cal > 0.12) fail('الماكروز لا تطابق السعرات', `${atwater.toFixed(0)} مقابل ${cal}`);
  if (protein / w > 3.3) fail('بروتين مبالغ فيه', `${(protein / w).toFixed(2)} جم/كجم`);
  // Carbohydrate may pass 50% only when a protein cap from the bloodwork leaves nothing else for the
  // day's balance (fat at most 35%), up to 57%, with a note for the coach.
  const guard = t.clinical_guardrails || {};
  const carbLimit = guard.kidney_protein_capped ? 0.57 : 0.5;
  if (p.conditions.includes('diabetes') && cal > 0 && (4 * carbs) / cal > carbLimit) fail(`نسبة كربوهيدرات فوق ${Math.round(carbLimit * 100)}% لمريض سكر`, `${Math.round(400 * carbs / cal)}% (${carbs} جم، هدف ${p.goal}، BMI ${(w / (Number(p.body.height_cm) / 100) ** 2).toFixed(0)}، ${p.conditions.join('+')})`);
  if (p.conditions.includes('diabetes') && cal > 0 && (4 * carbs) / cal > 0.5 && !guard.energy_balance_note_ar) fail('كربوهيدرات فوق 50% لمريض سكر من غير ملاحظة للكوتش', `${Math.round(400 * carbs / cal)}%`);
  // The day's balance: fat within the adult range (IOM AMDR 20-35% of energy).
  if (cal > 0 && (9 * fat) / cal > 0.355) fail('دهون فوق 35% من السعرات', `${Math.round(900 * fat / cal)}% (${fat} جم من ${cal} سعرة، ${p.conditions.join('+') || 'بدون أمراض'})`);
  // The kidney protein ceiling was checked here. Declared kidney disease is outside the service now
  // (src/api/services/serviceScope.js): no plan is built for it, so there is no plan to check.

  const meals = program.nutrition_program?.culinary_meals || [];
  if (meals.length === 0) fail('لا توجد وجبات', '');
  const items = meals.flatMap((m) => m.items || []);
  for (const it of items) {
    for (const k of ['protein_g', 'carb_g', 'fat_g', 'calories_kcal', 'portion_g']) {
      if (it[k] !== undefined && !Number.isFinite(Number(it[k]))) fail('رقم غير صالح في وجبة', `${it.food_code}.${k}=${it[k]}`);
    }
    if (Number(it.portion_g) > 900) fail('حصة غير منطقية', `${it.food_code} ${it.portion_g} جم`);
  }
  const codes = [...new Set(items.flatMap((it) => [it.food_code, ...(it.swaps || []).map((s) => s.food_code)]).filter(Boolean))];
  const bad = (name, pred) => { const hit = codes.filter(pred); if (hit.length) fail(name, hit.join(', ')); };
  if (p.allergies.includes('dairy_lactose')) bad('ألبان لمريض لاكتوز', (c) => FOOD(c)?.is_dairy === true);
  if (p.allergies.includes('gluten_celiac')) bad('جلوتين لمريض سيلياك', (c) => FOOD(c) && !FOOD(c).is_gluten_free);
  if (p.allergies.includes('peanuts_tree_nuts')) bad('مكسرات لمريض حساسية', (c) => FOOD(c)?.is_nut_free === false);
  if (p.allergies.includes('fish_shellfish')) bad('سمك لمريض حساسية', (c) => FOOD(c)?.is_fish === true);
  if (p.allergies.includes('soy')) bad('صويا لمريض حساسية', (c) => FOOD(c) && FOOD(c).is_soy_free === false);
  if (p.allergies.includes('eggs')) bad('بيض لمريض حساسية', (c) => /(^|_)EGGS?(_|$)/.test(c));
  if (p.conditions.includes('favism_g6pd')) bad('بقوليات لأنيميا الفول', (c) => FOOD(c)?.is_legume === true || FOOD(c)?.is_fava === true);
  if (p.conditions.includes('gout')) bad('بيورين عالي للنقرس', (c) => FOOD(c) && FOOD(c).is_gout_safe === false);
  if (p.conditions.includes('diabetes')) bad('مؤشر جلايسيمي عالي للسكري', (c) => getFoodClinicalProperties(c, FOOD(c))?.glycemic_index === 'HIGH');
  if (p.conditions.includes('bariatric_surgery') && p.dumping) bad('سكريات مركزة مع الإغراق', (c) => c.startsWith('DATES_') || getFoodClinicalProperties(c, FOOD(c))?.is_simple_sugar === true);
  if (p.conditions.includes('bariatric_surgery') && meals.length < 5) fail('وجبات أقل من 5 بعد التكميم', String(meals.length));

  const weeks = program.training_program?.weeks || [];
  const sessions = weeks[0]?.sessions || [];
  const exCodes = [...new Set(weeks.flatMap((wk) => (wk.sessions || []).flatMap((s) => (s.exercises || []).map((e) => String(e.exercise_code || '')))))];
  if (exCodes.length === 0 && program.intake_decision?.plan_status !== 'MEDICAL_REVIEW_REQUIRED') fail('لا توجد تمارين', '');
  if (HOME_FORBIDDEN[p.env]) { const hit = exCodes.filter((c) => HOME_FORBIDDEN[p.env].test(c)); if (hit.length) fail('أداة غير متاحة في البيت', hit.join(', ')); }
  for (const area of p.injuries) {
    const key = INJURY_KEY[area];
    const forbidden = key ? JOINT_PAIN_SWAP_MATRIX[key]?.forbidden_movements || [] : [];
    const hit = exCodes.filter((c) => forbidden.includes(c));
    if (hit.length) fail(`تمرين محظور لإصابة ${area}`, hit.join(', '));
  }
  for (const s of sessions) {
    const mob = s.mobility_protocol || {};
    if (!(mob.dynamic_warmup?.exercises || []).length) { fail('جلسة بلا إحماء', s.session_code); break; }
    if (!(mob.static_cooldown?.exercises || []).length) { fail('جلسة بلا تهدئة', s.session_code); break; }
  }

  const bmi = w / ((Number(p.body.height_cm) / 100) ** 2);
  const hiitBanned = p.conditions.includes('hypertension') || bmi >= 35 || p.chestPain;
  const cardioText = JSON.stringify(program.cardio_program?.prescription || {});
  if (hiitBanned && /HIIT|INTERVAL/i.test(cardioText)) fail('HIIT لحالة ممنوع عليها', `BMI ${bmi.toFixed(1)}`);

  if (p.chestPain && program.intake_decision?.plan_status !== 'MEDICAL_REVIEW_REQUIRED') fail('ألم صدر بدون مراجعة طبية', String(program.intake_decision?.plan_status));
  return { failures: f, cal, protein, sessions: sessions.length, cardio: program.cardio_program?.plan_specification?.strategy, bmi };
}

// ---------- run ----------
const personas = [...NIGHTMARES, ...Array.from({ length: 300 }, (_, i) => randomPersona(i + 1))];
const tally = {};
const examples = {};
let crashed = 0;
const crashes = [];
const noCardioObese = [];
const t0 = Date.now();
for (const p of personas) {
  let program;
  try {
    p.intake = intakeFrom(p);
    program = buildMasterEngineV2({ intake: p.intake, evaluationContext: { system_time: '2026-09-21T08:00:00.000Z', assessmentDate: '2026-09-21' }, nutritionFoodCatalog: catalog, options: {} });
  } catch (err) {
    crashed++;
    crashes.push(`${p.id}: ${err.message.slice(0, 140)}`);
    continue;
  }
  const r = check(p, program);
  if (r.bmi >= 30 && p.goal === 'fat_loss' && r.cardio === 'NO_ADDITIONAL_CARDIO') noCardioObese.push(`${p.id} BMI ${r.bmi.toFixed(1)} neat=${p.intake.neat_level} steps=${p.intake.average_daily_steps ?? '-'} reasons=${JSON.stringify(program.intake_decision?.decision_reasons?.filter((x)=>x.scope==='CARDIO').map((x)=>x.code) || '?')}`);
  for (const x of r.failures) {
    tally[x.name] = (tally[x.name] || 0) + 1;
    (examples[x.name] = examples[x.name] || []).length < 3 && examples[x.name].push(`${p.id} [${p.body.gender} ${p.body.age}y ${p.body.weight_kg}kg ${p.env} ${p.days}d | أمراض:${p.conditions.join('+') || '-'} | حساسية:${p.allergies.join('+') || '-'}] -> ${x.detail}`);
  }
}
console.log(`عملاء: ${personas.length} | انهار البناء: ${crashed} | الوقت: ${((Date.now() - t0) / 1000).toFixed(1)} ث`);
for (const c of crashes.slice(0, 6)) console.log('  انهيار:', c);
const names = Object.keys(tally).sort((a, b) => tally[b] - tally[a]);
console.log(names.length ? '\nالمخالفات:' : '\nلا توجد مخالفات');
for (const n of names) { console.log(`- ${n}: ${tally[n]}`); for (const e of examples[n]) console.log('    ' + e); }
console.log(`\nعملاء بـ BMI 30+ هدفهم خسارة دهون وبلا أي كارديو: ${noCardioObese.length}`);
for (const x of noCardioObese) console.log('   ', x);
