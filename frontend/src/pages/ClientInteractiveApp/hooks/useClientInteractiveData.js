import { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE } from '../../../config/api.js';
import { extractClientFastingProfile } from '../../../utils/seasonalFastingRadar.js';
import { getGulfHeatAdvisory } from '../../../utils/cardioZonesEngine.js';
import { enqueueOfflineAction, flushPendingQueue, getQueueSyncStatus, buildSyncHandler, ACTION_TYPES } from '../../../utils/offlineSyncEngine.js';
import { adaptProgramToInteractiveMeals, adaptSessionToInteractiveWorkout } from '../utils/programAdapters.js';
import { cacheProgramLocally, getCachedProgram, cacheGymRushCatalogLocally } from '../../../utils/offlineWorkoutSync.js';
import { applyDeloadToSession, EFFORT_LEVELS } from '../../../utils/progressionEngine.js';
import { applyFastingToMeals, FASTING_MODES, RAMADAN_CARDIO_GUIDANCE_AR } from '../../../utils/fastingCalendarEngine.js';
import { webCodesForDislikes } from '../../../utils/dislikedFoods.js';
import { foodAllergyFlags, foodLogistics } from '../../../utils/foodSwapEngine.js';

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

export function useClientInteractiveData() {
  // 1. Day & Week Selection
  const [selectedDay, setSelectedDay] = useState(1); // 1 to 7
  const [currentTrainingWeek, setCurrentTrainingWeek] = useState(1); // 1 to 5

  // 2. Client Profile State
  const [clientData, setClientData] = useState(() => {
    let parsedUser = null;
    try {
      const u = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
      parsedUser = u ? JSON.parse(u) : null;
    } catch {}
    const storedCode = parsedUser?.client_code || (typeof localStorage !== 'undefined' ? (localStorage.getItem('kz_client_code') || sessionStorage.getItem('z_client_code')) : '') || '';
    const storedName = parsedUser?.full_name || (typeof localStorage !== 'undefined' ? (localStorage.getItem('kz_client_name') || 'المشترك') : 'المشترك');
    return {
      name: storedName,
      code: storedCode ? (storedCode.startsWith('#') ? storedCode : `#${storedCode}`) : '',
      package: parsedUser?.subscription_package || 'الخطة المخصصة',
      plan_approval_status: parsedUser?.plan_approval_status || 'PENDING_COACH_REVIEW',
      enable_rest_timer: false,
      enable_weight_logging: false,
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
  // P0-A4: active clinical lockout reported by the server on the program
  // response (null when no lockout is active). A response without the field
  // (e.g. the pending response) leaves the previous state untouched.
  const [clinicalLockout, setClinicalLockout] = useState(null);
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
    // P0-A14: no program means no weeks — never a fabricated week plan.
    return [];
  }, [clientProgram]);

  const selectedWeekData = useMemo(() => {
    if (!trainingWeeks || trainingWeeks.length === 0) return null;
    return trainingWeeks.find(w => w.week_number === currentTrainingWeek) || trainingWeeks[0];
  }, [trainingWeeks, currentTrainingWeek]);

  // P1-B11: day-map info. The 7 day buttons map onto N split sessions by
  // modulo, so days past the split repeat a session. The tab must say so:
  // session X of Y, marked repeated when the day index runs past the
  // split. Rest days cannot be marked from current data: the split
  // assigns a session to every day, so no rest-day field exists to read
  // (a true rest-day model is a program-data follow-up, not a label).
  const sessionDayInfo = useMemo(() => {
    const sessions = selectedWeekData?.sessions
      || clientProgram?.training?.sessions
      || clientProgram?.training_split?.sessions
      || clientProgram?.master_program?.training?.sessions
      || clientProgram?.master_program?.training_split?.sessions
      || [];
    if (!Array.isArray(sessions) || sessions.length === 0) return null;
    const sessionIndex = Math.max(0, (selectedDay - 1) % sessions.length);
    return {
      sessionIndex,
      sessionCount: sessions.length,
      isRepeat: (selectedDay - 1) >= sessions.length,
    };
  }, [selectedWeekData, clientProgram, selectedDay]);

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
  // P0-A14: no demo meals before the first fetch — an empty list, never a fake plan.
  const [meals, setMeals] = useState([]);

  const [activeSwapItem, setActiveSwapItem] = useState(null);
  const [swapMealId, setSwapMealId] = useState(null);
  const [prehabCompleted, setPrehabCompleted] = useState(false);
  // P0-A14: no hardcoded cardio prescription — null hides the section until a real one is wired.
  const [cardioPrescription, setCardioPrescription] = useState(null);

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

  // P0-A14: no demo workout before the first fetch — null renders the empty state.
  const [workoutSession, setWorkoutSession] = useState(null);

  // 7. Deterministic Program Data Application & Offline Storage
  const applyProgramData = useCallback((data, rawCode) => {
    if (!data) return;
    // P0-A3: an unapproved response must not leave previously loaded plan
    // content visible. Clear the in-memory program so derived tabs
    // (supplements, training weeks) empty out; the tab gates show the
    // pending notice instead. Per-day local caches are not deleted here:
    // they are never rendered while unapproved, and the version-key logic
    // refreshes them on the next approved fetch.
    const approvalStatus = data.plan_approval_status || data.user?.plan_approval_status;
    if (data.has_program === false || (approvalStatus && approvalStatus !== 'APPROVED' && approvalStatus !== 'PUBLISHED')) {
      setClientProgram(null);
      setCardioPrescription(null);
    }
    // P0-A4: store the server-reported clinical lockout so the app can show
    // the lockout screen instead of plan content. Only an object-shaped
    // field updates the state; its absence leaves the previous state alone.
    if (data.clinical_lockout && typeof data.clinical_lockout === 'object') {
      if (data.clinical_lockout.active === true) {
        setClinicalLockout({
          active: true,
          directive: data.clinical_lockout.emergency_directive || data.clinical_lockout.reason_ar || null,
          reason_ar: data.clinical_lockout.reason_ar || null,
          checkin_id: data.clinical_lockout.checkin_id || null,
          week_number: data.clinical_lockout.week_number || null,
        });
      } else {
        setClinicalLockout(null);
      }
    }
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
        plan_approval_status: data.user.plan_approval_status || prev.plan_approval_status,
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
          has_dumping_syndrome: constraints.has_dumping_syndrome === true,
          disliked_food_codes: webCodesForDislikes(constraints.disliked_foods),
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
    // P0-A3: only an approved response may (re)populate the in-memory
    // program; an unapproved one keeps the cleared state above even when it
    // carries a program row (e.g. an ACTIVE program still awaiting approval).
    if (data.has_program && data.master_program && (!approvalStatus || approvalStatus === 'APPROVED' || approvalStatus === 'PUBLISHED')) {
      setClientProgram(data.master_program);

      // P0-A16 (S1): the card reads from the engine's served prescription,
      // never from a hardcoded default (P0-A14 left it null). Strategy
      // decides what shows: nothing for NO_ADDITIONAL_CARDIO or a held
      // review, a walking card for STEPS_ONLY, the session card otherwise.
      // The served card already carries the engine's real duration,
      // sessions, talk-test cue and equipment.
      const servedCardio = data.client_view?.cardio;
      const cardioStrategy = data.master_program?.cardio_program?.plan_specification?.strategy;
      if (servedCardio && cardioStrategy !== 'NO_ADDITIONAL_CARDIO' && cardioStrategy !== 'REVIEW_REQUIRED') {
        setCardioPrescription(servedCardio);
      } else {
        setCardioPrescription(null);
      }

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
          : []);
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
            : [])));
    // P0-A14: no weeks at all means nothing to sync — never a fabricated week.
    if (tWeeks.length === 0) return;
    const wData = tWeeks.find(w => w.week_number === currentTrainingWeek) || tWeeks[0];

    if (!clientProgram) {
      setWorkoutSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: (prev.exercises || []).map(ex => ({
            ...ex,
            targetRir: wData.target_rir ?? 2,
            prescription: {
              ...(ex.prescription || {}),
              target_rir: wData.target_rir ?? 2
            }
          }))
        };
      });
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
              cal: swapResult.replacement_food.macros.calories_kcal,
              // P0-A8: a locally swapped item shows its own flags, never the
              // replaced item's flags.
              allergy_flags: foodAllergyFlags(swapResult.replacement_food.code),
              // Logistics: a locally swapped item never keeps the replaced
              // item's storage/heating instructions; the next server refresh
              // re-annotates it with real values, when known.
              logistics: foodLogistics()
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
      // B2-SYNC: real server sync per action type — never the old stub that
      // reported success without sending anything.
      const res = await flushPendingQueue({
        queue: offlineQueue,
        syncHandler: buildSyncHandler({ apiBase: API_BASE })
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
  // مقصود: التأثير يعمل عند تغيّر مفتاحه فقط. إضافة الدوال للتبعيات تُعاد إنشاؤها كل رندر فتدخل في حلقة إعادة تشغيل.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // P1-B11: no sum-of-meals fallback. Summing the displayed meals made
    // targets always "match" the meals even when the engine's targets
    // differed. Zeros mean "targets unavailable" and the tab says so.
    // P0-A14: no fixed targets — zeros mean "no plan yet", never a fabricated plan.
    return { p: 0, c: 0, f: 0, cal: 0 };
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
    // P1-B9: the internal deload guard requires the active window itself.
    const deloaded = applyDeloadToSession({
      ...workoutSession,
      exercises: workoutSession.exercises.map((ex) => ({ ...ex, sets: Number(ex.targetSets) || 3, target_rir: Number(ex.targetRir) || 2 })),
    }, { deload: progression?.deload });
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
    clinicalLockout,
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
    sessionDayInfo,
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
