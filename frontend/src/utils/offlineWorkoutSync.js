/**
 * Offline Workout Cache & Instant 1-Tap Completion Engine (نظام حفظ وتوثيق التمارين أوفلاين)
 *
 * Provides:
 * 1. Pre-filled target weights and reps for zero-friction logging.
 * 2. 1-Tap set completion checkmark.
 * 3. 1-Tap full workout completion ("تم أداء التمرين بالكامل كما هو موصوف").
 * 4. LocalStorage persistence for gyms with dead cellular zones.
 * 5. Automatic server synchronization queue when connection restores.
 */

export function completeSingleSet({
  workoutId = 'today',
  exerciseId,
  setNumber = 1,
  weightKg,
  reps,
  targetWeightKg,
  targetReps,
  storageDriver = typeof localStorage !== 'undefined' ? localStorage : null
}) {
  const dateKey = new Date().toISOString().split('T')[0];
  const storageKey = `workout_log_${workoutId}_${dateKey}`;

  let existing = { synced: false, exercises: {} };
  if (storageDriver) {
    try {
      const stored = storageDriver.getItem(storageKey);
      if (stored) existing = JSON.parse(stored);
    } catch (e) {
      console.warn('Failed reading from storageDriver:', e);
    }
  }

  if (!existing.exercises[exerciseId]) {
    existing.exercises[exerciseId] = [];
  }

  const setIndex = existing.exercises[exerciseId].findIndex(s => s.setNumber === setNumber);
  const record = {
    setNumber,
    weightKg: weightKg !== undefined && weightKg !== null ? Number(weightKg) : Number(targetWeightKg || 0),
    reps: reps !== undefined && reps !== null ? Number(reps) : Number(targetReps || 10),
    completed: true,
    timestamp: new Date().toISOString()
  };

  if (setIndex >= 0) {
    existing.exercises[exerciseId][setIndex] = record;
  } else {
    existing.exercises[exerciseId].push(record);
  }

  if (storageDriver) {
    try {
      storageDriver.setItem(storageKey, JSON.stringify(existing));
    } catch (e) {
      console.warn('Failed writing to storageDriver:', e);
    }
  }

  return {
    success: true,
    storageKey,
    updatedSet: record,
    totalLoggedSets: Object.values(existing.exercises).flat().length
  };
}

export function completeWorkoutSession({
  workoutId = 'today',
  exercises = [],
  autoFillTargets = false,
  storageDriver = typeof localStorage !== 'undefined' ? localStorage : null
}) {
  const dateKey = new Date().toISOString().split('T')[0];
  const storageKey = `workout_log_${workoutId}_${dateKey}`;

  const sessionData = exercises.map(ex => ({
    exerciseId: ex.id || ex.exercise_id,
    name_ar: ex.name_ar,
    sets: (ex.sets || [1, 2, 3]).map((s, idx) => {
      const setNum = typeof s === 'object' ? (s.number || s.setNumber || idx + 1) : idx + 1;
      const targetW = typeof s === 'object' ? (s.targetWeightKg || s.weight_kg || 0) : 0;
      const targetR = typeof s === 'object' ? (s.targetReps || s.reps || 10) : 10;
      const actualW = typeof s === 'object' ? s.actualWeightKg : null;
      const actualR = typeof s === 'object' ? s.actualReps : null;

      return {
        setNumber: setNum,
        weightKg: autoFillTargets ? targetW : (actualW !== null && actualW !== undefined ? actualW : targetW),
        reps: autoFillTargets ? targetR : (actualR !== null && actualR !== undefined ? actualR : targetR),
        completed: true
      };
    })
  }));

  const payload = {
    synced: false,
    completed_at: new Date().toISOString(),
    auto_filled: autoFillTargets,
    data: sessionData
  };

  if (storageDriver) {
    try {
      storageDriver.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed writing to storageDriver:', e);
    }
  }

  return {
    success: true,
    storageKey,
    exercisesCount: sessionData.length,
    totalSetsCompleted: sessionData.reduce((sum, e) => sum + e.sets.length, 0),
    synced: false,
    directive_ar: autoFillTargets
      ? 'تم توثيق كافة المجموعات بالأوزان والتكرارات المستهدفة وحفظها محلياً بنجاح!'
      : 'تم حفظ سجل تمرين اليوم بنجاح في ذاكرة الهاتف.'
  };
}

export function getCachedWorkoutLog({
  workoutId = 'today',
  dateKey = new Date().toISOString().split('T')[0],
  storageDriver = typeof localStorage !== 'undefined' ? localStorage : null
}) {
  if (!storageDriver) return null;
  try {
    const storageKey = `workout_log_${workoutId}_${dateKey}`;
    const data = storageDriver.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Cache full client master program locally for offline gym viewing.
 */
export function cacheProgramLocally({
  clientCode = 'default',
  programData = null,
  storageDriver = typeof localStorage !== 'undefined' ? localStorage : null
}) {
  if (!storageDriver || !programData) return { success: false };
  const cleanCode = String(clientCode).replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
  const storageKey = `kz_cached_program_${cleanCode}`;
  try {
    const payload = {
      cached_at: new Date().toISOString(),
      client_code: cleanCode,
      program: programData
    };
    storageDriver.setItem(storageKey, JSON.stringify(payload));
    return { success: true, storageKey, cached_at: payload.cached_at };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Retrieve cached client program when cellular/wifi is dead in the gym.
 */
export function getCachedProgram({
  clientCode = 'default',
  storageDriver = typeof localStorage !== 'undefined' ? localStorage : null
}) {
  if (!storageDriver) return null;
  const cleanCode = String(clientCode).replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
  const storageKey = `kz_cached_program_${cleanCode}`;
  try {
    const raw = storageDriver.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.program || parsed;
  } catch {
    return null;
  }
}

/**
 * Cache Gym Rush equivalence catalog locally for instant zero-lag swaps offline.
 */
export function cacheGymRushCatalogLocally({
  catalog = [],
  storageDriver = typeof localStorage !== 'undefined' ? localStorage : null
}) {
  if (!storageDriver || !catalog) return { success: false };
  const storageKey = 'kz_gym_rush_catalog';
  try {
    storageDriver.setItem(storageKey, JSON.stringify({
      cached_at: new Date().toISOString(),
      catalog
    }));
    return { success: true, count: Array.isArray(catalog) ? catalog.length : 0 };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Get locally cached Gym Rush catalog.
 */
export function getCachedGymRushCatalog({
  storageDriver = typeof localStorage !== 'undefined' ? localStorage : null
} = {}) {
  if (!storageDriver) return null;
  const storageKey = 'kz_gym_rush_catalog';
  try {
    const raw = storageDriver.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.catalog || null;
  } catch {
    return null;
  }
}

