import { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE } from '../../../config/api.js';
import { extractClientFastingProfile } from '../../../utils/seasonalFastingRadar.js';
import { getPracticalCardioPrescription, CARDIO_TYPES, getGulfHeatAdvisory } from '../../../utils/cardioZonesEngine.js';
import { enqueueOfflineAction, flushPendingQueue, getQueueSyncStatus, ACTION_TYPES } from '../../../utils/offlineSyncEngine.js';
import { adaptProgramToInteractiveMeals, adaptSessionToInteractiveWorkout } from '../utils/programAdapters.js';
import { cacheProgramLocally, getCachedProgram, cacheGymRushCatalogLocally } from '../../../utils/offlineWorkoutSync.js';
import { applyDeloadToSession, EFFORT_LEVELS } from '../../../utils/progressionEngine.js';
import { applyFastingToMeals, FASTING_MODES, RAMADAN_CARDIO_GUIDANCE_AR } from '../../../utils/fastingCalendarEngine.js';

/** Rep range of a client exercise from its prescription ("8-10" fallback). */
function resolveRepRange(ex) {
  const p = ex?.prescription || {};
  if (Number(p.target_min) > 0 && Number(p.target_max) >= Number(p.target_min)) return [Number(p.target_min), Number(p.target_max)];
  const m = String(ex?.targetReps || '').match(/(\d+)\s*-\s*(\d+)/);
  return m ? [Number(m[1]), Number(m[2])] : [8, 12];
}

function sanitizeClientDisplayName(name) {
  if (!name) return 'المشترك';
  return String(name)
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\b(persona|test|stress|audit|minefield|client|user)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || 'المشترك';
}

export const DEFAULT_FALLBACK_WEEKS = [
  {
    week_number: 1,
    phase: 'ACCUMULATION',
    target_rir: 3,
    volume_modifier: 1.0,
    focus_note: 'تأسيس التكنيك والمدى الحركي الكامل',
  },
  {
    week_number: 2,
    phase: 'ACCUMULATION',
    target_rir: 2,
    volume_modifier: 1.05,
    focus_note: 'زيادة الحمل التدريبي والتوتر الميكانيكي',
  },
  {
    week_number: 3,
    phase: 'OVERREACHING',
    target_rir: 1,
    volume_modifier: 1.1,
    focus_note: 'أقصى استثارة عضلية وتكثيف الحمل',
  },
  {
    week_number: 4,
    phase: 'PEAK',
    target_rir: 0,
    volume_modifier: 1.15,
    focus_note: 'قمة الأداء التدريبي والاقتراب من الفشل العضلي الآمن',
  },
  {
    week_number: 5,
    phase: 'DELOAD',
    target_rir: 3,
    volume_modifier: 0.6,
    focus_note: 'أسبوع كسر الإجهاد والاستشفاء العضلي (-40% حجم)',
  }
];

export function useClientInteractiveData() {
  // 1. Day & Week Selection
  const [selectedDay, setSelectedDay] = useState(1); // 1 to 7
  const [currentTrainingWeek, setCurrentTrainingWeek] = useState(1); // 1 to 5

  // 2. Client Profile State
  const [clientData, setClientData] = useState(() => {
    const storedCode = localStorage.getItem('kz_client_code') || sessionStorage.getItem('z_client_code') || '#1';
    const storedName = localStorage.getItem('kz_client_name') || 'المشترك';
    return {
      name: storedName,
      code: storedCode.startsWith('#') ? storedCode : `#${storedCode}`,
      package: 'الخطة المخصصة',
      enable_rest_timer: false,
      enable_weight_logging: false,
      streak: 1,
      clinicalProfile: {
        is_g6pd: false,
        is_bariatric: false,
        is_celiac: false,
        medications: [],
        takes_thyroid_med: false,
        medical_conditions: [],
        injuries: []
      }
    };
  });

  // 3. Active Program State
  const [clientProgram, setClientProgram] = useState(null);
  // Progression (server-computed from workout logs) and this session's logging draft.
  const [progression, setProgression] = useState(null);
  // Today's religious fasting context (server-computed from religion, the calendar and the coach override).
  const [fastingContext, setFastingContext] = useState(null);
  // Gulf summer heat advisory (country from the server; re-checked on the device clock for the summer window).
  const [heatCountry, setHeatCountry] = useState(null);
  const [programId, setProgramId] = useState(null);
  const [sessionLogDraft, setSessionLogDraft] = useState({});
  const [sessionLogStatus, setSessionLogStatus] = useState(null);

  const trainingWeeks = useMemo(() => {
    const fromProg = clientProgram?.master_program?.training_program?.weeks
      || clientProgram?.training_program?.weeks
      || clientProgram?.master_program?.training?.weeks
      || clientProgram?.training?.weeks;
    if (Array.isArray(fromProg) && fromProg.length > 0) {
      return fromProg;
    }
    return DEFAULT_FALLBACK_WEEKS;
  }, [clientProgram]);

  const selectedWeekData = useMemo(() => {
    if (!trainingWeeks || trainingWeeks.length === 0) return null;
    return trainingWeeks.find(w => w.week_number === currentTrainingWeek) || trainingWeeks[0];
  }, [trainingWeeks, currentTrainingWeek]);

  // 4. Offline Sync Queue
  const [offlineQueue, setOfflineQueue] = useState(() => {
    try {
      // Authoritative storage key: kz_offline_queue (matches pre-refactor contract 100%)
      let raw = typeof localStorage !== 'undefined' ? localStorage.getItem('kz_offline_queue') : null;
      // Defensive migration: seamlessly migrate any legacy/alternate key without data loss
      if (!raw && typeof localStorage !== 'undefined') {
        const alt = localStorage.getItem('zcc_client_offline_queue');
        if (alt) {
          raw = alt;
          localStorage.setItem('kz_offline_queue', alt);
          localStorage.removeItem('zcc_client_offline_queue');
        }
      }
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // 5. Meals State
  const [meals, setMeals] = useState([
    {
      id: 'm1',
      title: 'الوجبة الأولى: إفطار التأسيس الأيضي',
      workout_timing: 'NONE',
      time: '08:30 ص',
      completed: true,
      items: [
        { id: 'i1', code: 'EGG_WHITES', name: 'بياض بيض مسلوق', amount: 150, unit: 'جم', p: 16.5, c: 1, f: 0.3, cal: 78 },
        { id: 'i2', code: 'SWEET_POTATO_BAKED', name: 'بطاطا حلوة مشوية', amount: 150, unit: 'جم', p: 2.4, c: 31.5, f: 0.2, cal: 135 },
        { id: 'i3', code: 'RAW_ALMONDS', name: 'لوز نيء غير محمص', amount: 15, unit: 'جم', p: 3.1, c: 3.3, f: 7.4, cal: 87 }
      ]
    },
    {
      id: 'm2',
      title: 'الوجبة الثانية: غداء التعافي والبناء',
      workout_timing: 'POST_WORKOUT',
      time: '02:00 م',
      completed: false,
      items: [
        { id: 'i4', code: 'CHICKEN_BREAST', name: 'صدور دجاج مشوية', amount: 150, unit: 'جم', p: 46.5, c: 0, f: 5.2, cal: 247 },
        { id: 'i5', code: 'BASMATI_RICE_COOKED', name: 'أرز بسمتي مسلوق', amount: 150, unit: 'جم', p: 4.0, c: 42.0, f: 0.6, cal: 195 },
        { id: 'i6', code: 'EXTRA_VIRGIN_OLIVE_OIL', name: 'زيت زيتون بكر ممتاز', amount: 10, unit: 'جم', p: 0, c: 0, f: 10, cal: 88 },
        { id: 'i7', code: 'VEGETABLES', name: 'طبق خضار سوتيه مشكل', amount: 150, unit: 'جم', p: 3, c: 8, f: 0, cal: 45 }
      ]
    },
    {
      id: 'm3',
      title: 'الوجبة الثالثة: وجبة ما قبل التمرين',
      workout_timing: 'PRE_WORKOUT',
      time: '05:30 م',
      completed: false,
      items: [
        { id: 'i8', code: 'SWEET_POTATO_BAKED', name: 'بطاطا حلوة مشوية', amount: 150, unit: 'جم', p: 2.4, c: 31.5, f: 0.2, cal: 135 },
        { id: 'i9', code: 'BANANA', name: 'موز طازج حبة متوسطة', amount: 1, unit: 'حبة', p: 1.2, c: 27.0, f: 0.3, cal: 105 },
        { id: 'i10', code: 'COFFEE', name: 'قهوة سوداء بدون سكر', amount: 1, unit: 'كوب', p: 0, c: 0, f: 0, cal: 5 }
      ]
    },
    {
      id: 'm4',
      title: 'الوجبة الرابعة: عشاء الاستشفاء الليلي',
      workout_timing: 'NONE',
      time: '09:30 م',
      completed: false,
      items: [
        { id: 'i11', code: 'WHITE_FISH_FILLET', name: 'سمك فيليه أبيض مشوي', amount: 180, unit: 'جم', p: 43.2, c: 0, f: 2.7, cal: 198 },
        { id: 'i12', code: 'SALAD', name: 'سلطة خضراء غنية بالورقيات', amount: 200, unit: 'جم', p: 2.0, c: 6.0, f: 0, cal: 35 },
        { id: 'i13', code: 'FRESH_AVOCADO', name: 'أفوكادو طازج', amount: 50, unit: 'جم', p: 1.0, c: 4.2, f: 7.5, cal: 80 }
      ]
    }
  ]);

  const [activeSwapItem, setActiveSwapItem] = useState(null);
  const [swapMealId, setSwapMealId] = useState(null);
  const [prehabCompleted, setPrehabCompleted] = useState(false);
  const [cardioPrescription, setCardioPrescription] = useState(() => getPracticalCardioPrescription({ type: CARDIO_TYPES.LISS_TALK_TEST }));

  // 6. Autoregulation & Workout Session State
  const [dailyReadiness, setDailyReadiness] = useState(() => {
    try {
      return localStorage.getItem('kz_daily_readiness') || 'OPTIMAL';
    } catch {
      return 'OPTIMAL';
    }
  });

  const handleSetDailyReadiness = (status) => {
    setDailyReadiness(status);
    try {
      localStorage.setItem('kz_daily_readiness', status);
    } catch {}
  };

  const [workoutSession, setWorkoutSession] = useState({
    title: 'اليوم 1: سحب الجزء العلوي (Upper Pull & Core)',
    duration: '55 دقيقة',
    warmupProtocol: 'بروتوكول RAMP: 5 دقائق مشي مائل + تفعيل Glute Bridges و Band Pull-aparts',
    exercises: [
      {
        id: 'e1',
        name: 'سحب ظهر واسع على الكابل (Lat Pulldown)',
        isCompound: true,
        restDurationSec: 90,
        safetyNote: 'الحفاظ على صدر مرفوع وتفادي أرجحة الجذع لحماية أسفل الظهر',
        sets: [
          { setNum: 1, weight: '0', reps: '10-12', completed: false },
          { setNum: 2, weight: '0', reps: '10-12', completed: false },
          { setNum: 3, weight: '0', reps: '10-12', completed: false },
          { setNum: 4, weight: '0', reps: '10-12', completed: false }
        ]
      },
      {
        id: 'e2',
        name: 'سحب أفقي جالس مسنود الصدر (Chest-Supported Row)',
        isCompound: true,
        restDurationSec: 90,
        safetyNote: 'تثبيت الصدر على المسند يمنع التحميل الضاغط على الفقرات القطنية L5-S1',
        sets: [
          { setNum: 1, weight: '0', reps: '10-12', completed: false },
          { setNum: 2, weight: '0', reps: '10-12', completed: false },
          { setNum: 3, weight: '0', reps: '10-12', completed: false }
        ]
      },
      {
        id: 'e3',
        name: 'تبادل دمبل بايسبس جالس مائل (Incline Dumbbell Curl)',
        isCompound: false,
        restDurationSec: 60,
        safetyNote: 'مد كامل للذراع في الأسفل مع ثبات الكوعين لعزل الرأس الطويل للبايسبس',
        sets: [
          { setNum: 1, weight: '0', reps: '12-15', completed: false },
          { setNum: 2, weight: '0', reps: '12-15', completed: false },
          { setNum: 3, weight: '0', reps: '12-15', completed: false }
        ]
      },
      {
        id: 'e4',
        name: 'بلانك أمامي مع شد البطن والحوض (Hardstyle Plank)',
        isCompound: false,
        restDurationSec: 60,
        safetyNote: 'شد عضلات البطن والمؤخرة معاً لمنع تقوس أسفل الظهر (McGill Big 3)',
        sets: [
          { setNum: 1, weight: '0', reps: '40 ثانية', completed: false },
          { setNum: 2, weight: '0', reps: '35 ثانية', completed: false },
          { setNum: 3, weight: '0', reps: '30 ثانية', completed: false }
        ]
      }
    ]
  });

  // 7. Deterministic Program Data Application & Offline Storage
  const applyProgramData = useCallback((data, rawCode) => {
    if (!data) return;
    if (data.user) {
      const rawAllergies = (data.user.allergies || data.master_program?.client?.allergies || []).map(a => String(a));
      const isCeliac = rawAllergies.some(a => {
        const s = a.toUpperCase();
        return s.includes('CELIAC') || s.includes('GLUTEN') || a.includes('قمح') || a.includes('جلوتين');
      });
      const isG6pd = rawAllergies.some(a => {
        const s = a.toUpperCase();
        return s.includes('G6PD') || s.includes('FAVISM') || a.includes('فول') || a.includes('بقول');
      });
      const isLactose = rawAllergies.some(a => {
        const s = a.toUpperCase();
        return s.includes('LACTOSE') || a.includes('لاكتوز');
      });
      const isGout = rawAllergies.some(a => {
        const s = a.toUpperCase();
        return s.includes('GOUT') || a.includes('نقرس') || a.includes('يوريك');
      });
      const rawInjuries = (data.user.injuries || data.master_program?.client?.injuries || []).map(i => String(i));
      const isBariatric = rawInjuries.some(inj => {
        const s = String(inj).toUpperCase();
        return s.includes('SLEEVE') || s.includes('BYPASS') || inj.includes('تكميم') || inj.includes('تحويل مسار');
      });
      const rawMedications = (data.user.medications || data.master_program?.client?.medications || []).map(m => String(m));
      const rawDiseases = (data.user.chronic_diseases || data.master_program?.client?.chronic_diseases || []).map(d => String(d));
      const allClinicalStrings = [...rawAllergies, ...rawMedications, ...rawDiseases, ...rawInjuries];

      const takesThyroidMed = allClinicalStrings.some(s => {
        const u = s.toUpperCase();
        return u.includes('ELTROXIN') || u.includes('THYROX') || u.includes('LEVOTHYROXINE') ||
               s.includes('التروكسين') || s.includes('الغدة الدرقية') || s.includes('كسل الغدة');
      });

      const prehabConditions = rawInjuries.filter(inj => {
        const s = inj.trim();
        return s && !s.includes('لا يوجد') && !s.includes('سليم') && !s.includes('متابعة سريرية');
      });

      // Intake-derived constraints sent by the API (GET active program); string matching above stays as a fallback.
      const constraints = data.clinical_constraints || {};

      const clientOrUser = data.user || data.master_program?.client || {};
      const extractedFasting = extractClientFastingProfile(clientOrUser, clientOrUser.answers);

      setClientData(prev => ({
        ...prev,
        name: sanitizeClientDisplayName(data.user.full_name || prev.name),
        package: data.user.subscription_package || prev.package,
        tier: data.user.subscription_package || prev.tier,
        enable_rest_timer: false,
        enable_weight_logging: false,
        fastingProfile: extractedFasting,
        sleep_schedule: { bedtime_hour: data.lifestyle?.bedtime_hour || prev.sleep_schedule?.bedtime_hour || null },
        clinicalProfile: {
          ...prev.clinicalProfile,
          is_celiac: isCeliac || constraints.is_celiac === true,
          is_g6pd: isG6pd || constraints.is_g6pd === true,
          is_lactose_intolerant: isLactose || constraints.is_lactose_intolerant === true,
          is_gout: isGout || constraints.is_gout === true,
          is_diabetic: constraints.is_diabetic === true,
          is_ibs: constraints.is_ibs === true,
          is_bariatric: isBariatric || constraints.is_bariatric === true,
          allergies: [...rawAllergies, ...(Array.isArray(constraints.allergies) ? constraints.allergies : [])],
          medications: rawMedications,
          takes_thyroid_med: takesThyroidMed,
          medical_conditions: prehabConditions,
          injuries: rawInjuries
        }
      }));
    }
    if (data.progression) setProgression(data.progression);
    setFastingContext(data.fasting_context || null);
    setHeatCountry(data.heat_advisory?.country_code || null);
    if (data.program_id) setProgramId(data.program_id);
    if (data.has_program && data.master_program) {
      setClientProgram(data.master_program);

      const serverVersion = String(data.version || data.master_program.version || data.updated_at || data.program_id || 'v1');
      const cachedVersion = localStorage.getItem(`kz_prog_ver_${rawCode}`);
      if (cachedVersion && cachedVersion !== serverVersion) {
        for (let d = 1; d <= 7; d++) {
          localStorage.removeItem(`kz_meals_${rawCode}_day_${d}`);
          localStorage.removeItem(`kz_workout_${rawCode}_day_${d}`);
        }
      }
      localStorage.setItem(`kz_prog_ver_${rawCode}`, serverVersion);

      const programMeals = adaptProgramToInteractiveMeals(data.master_program);
      if (programMeals.length > 0) {
        const currentCachedMeals = localStorage.getItem(`kz_meals_${rawCode}_day_${selectedDay}`);
        if (!currentCachedMeals) {
          setMeals(programMeals);
        }
      }
      const tWeeks = (Array.isArray(data.master_program?.training_program?.weeks) && data.master_program.training_program.weeks.length > 0)
        ? data.master_program.training_program.weeks 
        : ((Array.isArray(data.master_program?.training?.weeks) && data.master_program.training.weeks.length > 0)
          ? data.master_program.training.weeks 
          : DEFAULT_FALLBACK_WEEKS);
      const wData = tWeeks.find(w => w.week_number === currentTrainingWeek) || tWeeks[0];
      const sessions = wData?.sessions 
        || data.master_program.training?.sessions 
        || data.master_program.training_split?.sessions 
        || [];
      if (sessions.length > 0) {
        const currentIdx = Math.max(0, (selectedDay - 1) % sessions.length);
        const adapted = adaptSessionToInteractiveWorkout(sessions[currentIdx], currentIdx, wData);
        if (adapted && adapted.exercises && adapted.exercises.length > 0) {
          setWorkoutSession(prev => ({
            ...prev,
            ...adapted
          }));
        }
      }
    }
  }, [currentTrainingWeek, selectedDay]);

  useEffect(() => {
    const rawCode = String(clientData?.code || '').replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
    if (!rawCode) return;

    // 1. Instant offline hydrate from local cache
    const localCached = getCachedProgram({ clientCode: rawCode });
    if (localCached) {
      applyProgramData(localCached, rawCode);
    }

    // 2. Fetch live data if online
    if (typeof navigator === 'undefined' || navigator.onLine !== false) {
      fetch(`${API_BASE}/api/v1/programs/active/${rawCode}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            applyProgramData(data, rawCode);
            cacheProgramLocally({ clientCode: rawCode, programData: data });
            setIsOffline(false);
          }
        })
        .catch(err => {
          console.warn('Network offline or weak in gym, fallback to local cached program:', err);
          setIsOffline(true);
        });

      // 3. Pre-fetch and cache Gym Rush Equivalence Catalog for instant offline swaps
      fetch(`${API_BASE}/api/v1/exercises/gym-rush/catalog`)
        .then(res => res.ok ? res.json() : null)
        .then(rushData => {
          if (rushData && rushData.catalog) {
            cacheGymRushCatalogLocally({ catalog: rushData.catalog });
          }
        })
        .catch(() => {});
    } else {
      setIsOffline(true);
    }
  }, [clientData?.code, applyProgramData]);


  // 8. Sync Workout Session on Day or Meso Week change
  useEffect(() => {
    const tWeeks = (Array.isArray(clientProgram?.master_program?.training_program?.weeks) && clientProgram.master_program.training_program.weeks.length > 0)
      ? clientProgram.master_program.training_program.weeks
      : ((Array.isArray(clientProgram?.training_program?.weeks) && clientProgram.training_program.weeks.length > 0)
        ? clientProgram.training_program.weeks
        : ((Array.isArray(clientProgram?.master_program?.training?.weeks) && clientProgram.master_program.training.weeks.length > 0)
          ? clientProgram.master_program.training.weeks
          : ((Array.isArray(clientProgram?.training?.weeks) && clientProgram.training.weeks.length > 0)
            ? clientProgram.training.weeks
            : DEFAULT_FALLBACK_WEEKS)));
    const wData = tWeeks.find(w => w.week_number === currentTrainingWeek) || tWeeks[0];

    if (!clientProgram) {
      setWorkoutSession(prev => ({
        ...prev,
        exercises: (prev.exercises || []).map(ex => ({
          ...ex,
          targetRir: wData.target_rir ?? 2,
          prescription: {
            ...(ex.prescription || {}),
            target_rir: wData.target_rir ?? 2
          }
        }))
      }));
      return;
    }

    const sessions = wData?.sessions 
      || clientProgram.training?.sessions 
      || clientProgram.training_split?.sessions 
      || clientProgram.master_program?.training?.sessions
      || clientProgram.master_program?.training_split?.sessions
      || [];
    if (sessions.length > 0) {
      const currentIdx = Math.max(0, (selectedDay - 1) % sessions.length);
      const adapted = adaptSessionToInteractiveWorkout(sessions[currentIdx], currentIdx, wData);
      if (adapted && adapted.exercises && adapted.exercises.length > 0) {
        setWorkoutSession(prev => ({
          ...prev,
          ...adapted
        }));
      }
    }
  }, [selectedDay, currentTrainingWeek, clientProgram]);

  // 9. Restore cached meals for selectedDay
  useEffect(() => {
    const cleanCode = String(clientData?.code || '').replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
    if (!cleanCode) return;
    try {
      const cached = localStorage.getItem(`kz_meals_${cleanCode}_day_${selectedDay}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMeals(parsed);
          return;
        }
      }
      if (clientProgram) {
        const progMeals = adaptProgramToInteractiveMeals(clientProgram);
        if (progMeals.length > 0) {
          setMeals(progMeals);
        }
      }
    } catch {}
  }, [selectedDay, clientData?.code, clientProgram]);

  // 10. Exercise Completion Toggle
  const handleToggleExerciseCompleted = (exerciseId) => {
    const cleanCode = String(clientData?.code || '').replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
    setWorkoutSession(prev => {
      if (!prev || !prev.exercises) return prev;
      const updatedExercises = prev.exercises.map(ex => {
        if (ex.id !== exerciseId) return ex;
        const newlyCompleted = !ex.completed;
        return {
          ...ex,
          completed: newlyCompleted
        };
      });

      const nextSession = {
        ...prev,
        exercises: updatedExercises
      };

      if (cleanCode) {
        try {
          localStorage.setItem(`kz_workout_${cleanCode}_day_${selectedDay}`, JSON.stringify(nextSession));
        } catch {}
      }

      return nextSession;
    });
  };

  // 11. Meal Completion Toggle with Offline Enqueue
  const handleToggleMealCompleted = (mealId) => {
    const cleanCode = String(clientData?.code || '').replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
    setMeals(prev => {
      let targetMeal = null;
      const updated = prev.map(m => {
        if (m.id !== mealId) return m;
        const nextCompleted = !m.completed;
        targetMeal = { ...m, completed: nextCompleted };
        return targetMeal;
      });

      if (cleanCode) {
        try {
          localStorage.setItem(`kz_meals_${cleanCode}_day_${selectedDay}`, JSON.stringify(updated));
        } catch {}

        if (targetMeal) {
          const res = enqueueOfflineAction({
            queue: offlineQueue,
            actionType: ACTION_TYPES.CHECK_MEAL,
            clientId: cleanCode,
            payload: {
              day: selectedDay,
              mealId,
              mealTitle: targetMeal.title,
              completed: targetMeal.completed
            }
          });
          setOfflineQueue(res.queue);
          try {
            localStorage.setItem('kz_offline_queue', JSON.stringify(res.queue));
          } catch {}
        }
      }

      return updated;
    });
  };

  // 12. Smart Food Swap Execution
  const handleExecuteSwap = (swapResult) => {
    if (!activeSwapItem || !swapMealId) return;
    const cleanCode = String(clientData?.code || '').replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();

    setMeals(prevMeals => {
      const updated = prevMeals.map(meal => {
        if (meal.id !== swapMealId) return meal;
        return {
          ...meal,
          items: meal.items.map(item => {
            if (item.id !== activeSwapItem.id) return item;
            return {
              ...item,
              code: swapResult.replacement_food.code,
              name: swapResult.replacement_food.name_ar,
              amount: swapResult.replacement_food.portion_g,
              unit: 'جم',
              p: swapResult.replacement_food.macros.protein_g,
              c: swapResult.replacement_food.macros.carbs_g,
              f: swapResult.replacement_food.macros.fat_g,
              cal: swapResult.replacement_food.macros.calories_kcal
            };
          })
        };
      });

      if (cleanCode) {
        try {
          localStorage.setItem(`kz_meals_${cleanCode}_day_${selectedDay}`, JSON.stringify(updated));
        } catch {}
      }

      return updated;
    });

    setActiveSwapItem(null);
    setSwapMealId(null);
  };

  // 13. Offline Flush & Online Listener
  const [isOffline, setIsOffline] = useState(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });

  const handleTriggerSync = async () => {
    if (isSyncing || offlineQueue.length === 0) return;
    setIsSyncing(true);
    try {
      const res = await flushPendingQueue({
        queue: offlineQueue,
        syncHandler: async () => ({ success: true })
      });
      setOfflineQueue(res.queue);
      try {
        localStorage.setItem('kz_offline_queue', JSON.stringify(res.queue));
      } catch {}
    } catch (err) {
      console.warn('Sync flush error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const onOnline = () => {
      setIsOffline(false);
      handleTriggerSync();
    };
    const onOffline = () => {
      setIsOffline(true);
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [offlineQueue]);

  // 14. Target Macros Calculation
  const targetMacros = useMemo(() => {
    const directTargets = clientProgram?.nutrition?.targets;
    if (directTargets && (directTargets.calories || directTargets.protein)) {
      return {
        cal: Number(directTargets.calories) || 0,
        p: Number(directTargets.protein) || 0,
        c: Number(directTargets.carbs) || 0,
        f: Number(directTargets.fats) || 0
      };
    }

    const macroTargets = clientProgram?.nutrition_program?.macro_targets 
      || clientProgram?.nutrition_program?.stages?.macro_targets;
    if (macroTargets && (macroTargets.calories_kcal || macroTargets.protein_g)) {
      return {
        cal: Math.round(Number(macroTargets.calories_kcal || macroTargets.target_calories || 0)),
        p: Math.round(Number(macroTargets.protein_g || 0)),
        c: Math.round(Number(macroTargets.carbohydrate_g || macroTargets.carb_g || macroTargets.carbs_g || 0)),
        f: Math.round(Number(macroTargets.fat_g || 0))
      };
    }

    if (meals && meals.length > 0) {
      const mealSum = meals.reduce((acc, meal) => {
        (meal.items || []).forEach(item => {
          acc.p += Number(item.p || 0);
          acc.c += Number(item.c || 0);
          acc.f += Number(item.f || 0);
          acc.cal += Number(item.cal || 0);
        });
        return acc;
      }, { p: 0, c: 0, f: 0, cal: 0 });

      if (mealSum.cal > 0) {
        return {
          cal: Math.round(mealSum.cal),
          p: Math.round(mealSum.p),
          c: Math.round(mealSum.c),
          f: Math.round(mealSum.f)
        };
      }
    }

    return { p: 155, c: 200, f: 50, cal: 1870 };
  }, [clientProgram, meals]);

  // 15. Supplements State
  const [supplementsTaken, setSupplementsTaken] = useState(() => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`kz_supps_taken_${todayStr}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleSupplementTaken = (suppId) => {
    setSupplementsTaken(prev => {
      const next = { ...prev, [suppId]: !prev[suppId] };
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        localStorage.setItem(`kz_supps_taken_${todayStr}`, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  const supplementsList = useMemo(() => {
    const rawSupps = clientProgram?.cardio?.supplements 
      || clientProgram?.supplements 
      || clientProgram?.nutrition?.supplements;
    if (rawSupps && rawSupps.length > 0) {
      return rawSupps.map((s, idx) => ({
        id: s.id || `supp_${idx}`,
        name: s.name || 'مكمل غذائي',
        dose: s.dose || '',
        timing: s.timing || '',
        notes: s.notes || '',
        cal: Number(s.cal ?? s.calories) || 0,
        p: Number(s.p ?? s.protein) || 0,
        c: Number(s.c ?? s.carbs) || 0,
        f: Number(s.f ?? s.fats) || 0
      }));
    }
    return [];
  }, [clientProgram]);

  // 15b. Fasting view of the day's meals: applied at display time so the stored plan, per-day cache,
  // completion toggles and swaps keep working on the original items (ids are preserved).
  const displayedMeals = useMemo(
    () => applyFastingToMeals(meals, fastingContext, clientData?.clinicalProfile || {}),
    [meals, fastingContext, clientData?.clinicalProfile]
  );

  const cardioAdvisories = useMemo(() => {
    const notes = [];
    const heat = getGulfHeatAdvisory({ country_code: heatCountry });
    if (heat.active) notes.push(heat.message_ar);
    if (fastingContext?.active && fastingContext.mode === FASTING_MODES.RAMADAN) notes.push(RAMADAN_CARDIO_GUIDANCE_AR);
    return notes;
  }, [fastingContext, heatCountry]);

  // 16. Consumed Macros Calculation
  const consumedMacros = useMemo(() => {
    const acc = displayedMeals.reduce((mealAcc, meal) => {
      if (meal.completed) {
        (meal.items || []).forEach(item => {
          mealAcc.p += Number(item.p || 0);
          mealAcc.c += Number(item.c || 0);
          mealAcc.f += Number(item.f || 0);
          mealAcc.cal += Number(item.cal || 0);
        });
      }
      return mealAcc;
    }, { p: 0, c: 0, f: 0, cal: 0 });

    supplementsList.forEach(supp => {
      if (supplementsTaken[supp.id]) {
        acc.p += supp.p;
        acc.c += supp.c;
        acc.f += supp.f;
        acc.cal += supp.cal;
      }
    });

    return acc;
  }, [displayedMeals, supplementsList, supplementsTaken]);

  const syncStatus = getQueueSyncStatus(offlineQueue);

  // Approved deload: show the lighter version of the session (about 40% fewer sets, RIR 4).
  const isDeloadActive = progression?.deload?.status === 'ACTIVE';
  const displayedWorkoutSession = useMemo(() => {
    if (!isDeloadActive || !workoutSession?.exercises) return workoutSession;
    const deloaded = applyDeloadToSession({
      ...workoutSession,
      exercises: workoutSession.exercises.map((ex) => ({ ...ex, sets: Number(ex.targetSets) || 3, target_rir: Number(ex.targetRir) || 2 })),
    });
    return {
      ...deloaded,
      exercises: deloaded.exercises.map((ex) => ({ ...ex, targetSets: ex.sets, targetRir: ex.target_rir, safetyNote: ex.cue })),
    };
  }, [isDeloadActive, workoutSession]);

  // Pre-fill each exercise's draft from the engine target (a normal week is one tap).
  useEffect(() => {
    const exercises = workoutSession?.exercises || [];
    setSessionLogDraft((prev) => {
      const next = {};
      for (const ex of exercises) {
        const code = ex.code || ex.id;
        const entry = progression?.exercises?.[code];
        const [, repMax] = resolveRepRange(ex);
        next[code] = prev[code] || {
          weight_kg: entry?.target?.weight_kg ?? '',
          last_set_reps: entry?.target?.rep_target ?? repMax,
          effort: EFFORT_LEVELS.OK,
        };
      }
      return next;
    });
    setSessionLogStatus(null);
  }, [workoutSession, progression]);

  const updateLogDraft = useCallback((code, field, value) => {
    setSessionLogDraft((prev) => ({ ...prev, [code]: { ...(prev[code] || {}), [field]: value } }));
  }, []);

  const repeatLastLog = useCallback((code, lastEntry) => {
    setSessionLogDraft((prev) => ({ ...prev, [code]: { weight_kg: lastEntry.weight_kg, last_set_reps: lastEntry.last_set_reps, effort: lastEntry.effort || EFFORT_LEVELS.OK } }));
  }, []);

  const submitSessionLog = useCallback(async () => {
    const rawCode = String(clientData?.code || '').replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
    const logged = (workoutSession?.exercises || []).map((ex) => {
      const code = ex.code || ex.id;
      const d = sessionLogDraft[code] || {};
      const [repMin, repMax] = resolveRepRange(ex);
      return {
        exercise_code: code,
        name: ex.nameAr || ex.nameEn || ex.name,
        weight_kg: Number(d.weight_kg) || 0,
        last_set_reps: Number(d.last_set_reps),
        effort: d.effort || EFFORT_LEVELS.OK,
        rep_min: repMin,
        rep_max: repMax,
        sets: Number(ex.targetSets) || null,
      };
    }).filter((e) => Number.isFinite(e.last_set_reps) && e.last_set_reps > 0);
    if (logged.length === 0) {
      setSessionLogStatus({ type: 'error', message: 'سجّل عدات آخر مجموعة لتمرين واحد على الأقل.' });
      return;
    }
    setSessionLogStatus({ type: 'saving', message: 'جاري حفظ التسجيل...' });
    try {
      const res = await fetch(`${API_BASE}/api/v1/checkin/workout-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: rawCode,
          program_id: programId,
          week_number: currentTrainingWeek,
          day_number: selectedDay,
          session_title: workoutSession?.title,
          is_deload: isDeloadActive,
          logged_exercises: logged,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSessionLogStatus({ type: 'error', message: data.error || 'تعذر حفظ التسجيل، حاول مرة أخرى.' });
        return;
      }
      if (data.progression) setProgression(data.progression);
      setSessionLogStatus({ type: 'success', message: 'تم حفظ الجلسة، وأهدافك الجاية اتحدثت.' });
    } catch {
      setSessionLogStatus({ type: 'error', message: 'تعذر الاتصال بالخادم، لم يتم حفظ التسجيل.' });
    }
  }, [clientData?.code, workoutSession, sessionLogDraft, programId, currentTrainingWeek, selectedDay, isDeloadActive]);

  return {
    // Client & Program
    clientData,
    setClientData,
    clientProgram,
    currentTrainingWeek,
    setCurrentTrainingWeek,
    trainingWeeks,
    selectedWeekData,
    selectedDay,
    setSelectedDay,

    // Nutrition
    meals: displayedMeals,
    setMeals,
    fastingContext,
    targetMacros,
    consumedMacros,
    supplementsList,
    supplementsTaken,
    toggleSupplementTaken,
    handleToggleMealCompleted,
    handleExecuteSwap,
    activeSwapItem,
    setActiveSwapItem,
    swapMealId,
    setSwapMealId,

    // Offline Sync
    offlineQueue,
    isOffline,
    isSyncing,
    syncStatus,
    handleTriggerSync,

    // Workout
    workoutSession: displayedWorkoutSession,
    setWorkoutSession,
    progression,
    isDeloadActive,
    sessionLogDraft,
    sessionLogStatus,
    updateLogDraft,
    repeatLastLog,
    submitSessionLog,
    dailyReadiness,
    handleSetDailyReadiness,
    handleToggleExerciseCompleted,
    prehabCompleted,
    setPrehabCompleted,
    cardioPrescription,
    cardioAdvisories,
    setCardioPrescription
  };
}
