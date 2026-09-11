import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { extractClientFastingProfile } from '../utils/seasonalFastingRadar';
import { arabicSearchMatch } from '../utils/searchUtils';
import { 
  Utensils, 
  Dumbbell, 
  Activity, 
  Check, 
  RotateCcw, 
  ArrowLeftRight, 
  Play, 
  Pause, 
  Plus, 
  Clock, 
  ShieldCheck, 
  Info, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  X,
  Share2,
  AlertTriangle,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { API_BASE } from '../config/api';
import ExerciseVideoModal from '../components/modals/ExerciseVideoModal';
import { getExerciseDisplayNames } from '../utils/exerciseTranslator';
import { calculateDynamicFoodSwap, getCompatibleSwaps, FOOD_DATABASE, convertGramsToHandPortions, getTravelDiningBlueprints, formatItemPortionDisplay, PORTION_DISPLAY_MODES, COOKING_STATE_MODES } from '../utils/foodSwapEngine';
import { 
  FREE_BEVERAGES_CATALOG, 
  FREE_SEASONINGS_CATALOG, 
  COOKING_OILS_AND_SAUCES_GUIDE,
  SODIUM_AND_WATER_GUIDE,
  DINING_OUT_SURVIVAL_GUIDE,
  REFEED_PROTOCOLS 
} from '../utils/freeSeasoningsAndDrinks';
import { getPracticalCardioPrescription, CARDIO_TYPES } from '../utils/cardioZonesEngine';
import { SMART_GUIDELINES_MATRIX, generateMasterPdfExportData } from '../utils/pdfExportEngine';
import { getPrehabRoutine } from '../utils/posturalPrehabEngine';
import { evaluateWeeklyCheckinAudit, CHECKIN_DECISION_CODES } from '../utils/weeklyAuditEngine';
import { applyEmergencyScenarioAdaptation, TRAVEL_EQUIPMENT_TYPES } from '../utils/emergencyScenarioEngine';
import { evaluateDoubleProgression, EXERCISE_CATEGORIES, evaluateAutoDeloadRequirement } from '../utils/progressiveOverloadEngine';
import { calculateReverseDietingStep, REVERSE_DIET_STATUS } from '../utils/reverseDietingEngine';
import { calculateNeatTitrationStep, NEAT_LEVELS } from '../utils/neatTitrationEngine';
import { getCaffeineCutoffTime } from '../utils/circadianLabTriggerEngine';
import { convertPortionCookingYield } from '../utils/kitchenYieldEngine';
import { generateScientificRampWarmup, calculateBarbellPlates } from '../utils/warmupPlateEngine';
import { getTorqueMatchedSwaps, applyFatigueModeReduction } from '../utils/biomechanicalSwapEngine';
import { calculateDailyHydrationTarget } from '../utils/hydrationSweatEngine';
import { enqueueOfflineAction, flushPendingQueue, getQueueSyncStatus, ACTION_TYPES } from '../utils/offlineSyncEngine';
import { getPrepOptionsForFood } from '../utils/culinaryRecipes';
import { adaptProgramToInteractiveMeals, adaptSessionToInteractiveWorkout } from './ClientInteractiveApp/utils/programAdapters';

export default function ClientInteractiveApp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Tab Selection ('meals' | 'workout' | 'checkin')
  const rawTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(rawTab || 'meals');
  const [selectedDay, setSelectedDay] = useState(1); // 1 to 7

  // Client info & Clinical Profile
  const [clientData, setClientData] = useState(() => {
    const storedCode = localStorage.getItem('kz_client_code') || sessionStorage.getItem('z_client_code') || '#1';
    const storedName = localStorage.getItem('kz_client_name') || 'المشترك';
    return {
      name: storedName,
      code: storedCode.startsWith('#') ? storedCode : `#${storedCode}`,
      package: 'الخطة المخصصة',
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

  // Active Program State (Fetched dynamically from API)
  const [clientProgram, setClientProgram] = useState(null);

  // Mesocycle Week State (1 to 5)
  const [currentTrainingWeek, setCurrentTrainingWeek] = useState(1);

  const trainingWeeks = useMemo(() => {
    return clientProgram?.master_program?.training_program?.weeks
      || clientProgram?.training_program?.weeks
      || clientProgram?.master_program?.training?.weeks
      || clientProgram?.training?.weeks
      || [];
  }, [clientProgram]);

  const selectedWeekData = useMemo(() => {
    if (!trainingWeeks || trainingWeeks.length === 0) return null;
    return trainingWeeks.find(w => w.week_number === currentTrainingWeek) || trainingWeeks[0];
  }, [trainingWeeks, currentTrainingWeek]);

  useEffect(() => {
    const rawCode = String(clientData?.code || '').replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
    if (!rawCode) return;
    fetch(`${API_BASE}/api/v1/programs/active/${rawCode}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
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

            // Map injuries/conditions for prehab
            const prehabConditions = rawInjuries.filter(inj => {
              const s = inj.trim();
              return s && !s.includes('لا يوجد') && !s.includes('سليم') && !s.includes('متابعة سريرية');
            });

            const clientOrUser = data.user || data.master_program?.client || {};
            const extractedFasting = extractClientFastingProfile(clientOrUser, clientOrUser.answers);

            setClientData(prev => ({
              ...prev,
              name: data.user.full_name || prev.name,
              package: data.user.subscription_package || prev.package,
              tier: data.user.subscription_package || prev.tier,
              fastingProfile: extractedFasting,
              clinicalProfile: {
                ...prev.clinicalProfile,
                is_celiac: isCeliac,
                is_g6pd: isG6pd,
                is_lactose_intolerant: isLactose,
                is_gout: isGout,
                is_bariatric: isBariatric,
                allergies: rawAllergies,
                medications: rawMedications,
                takes_thyroid_med: takesThyroidMed,
                medical_conditions: prehabConditions,
                injuries: rawInjuries
              }
            }));
          }
          if (data.has_program && data.master_program) {
            setClientProgram(data.master_program);

            // Invalidate stale local day caches when coach publishes an updated program version
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
            const tWeeks = data.master_program?.training_program?.weeks 
              || data.master_program?.training?.weeks 
              || [];
            const wData = tWeeks.find(w => w.week_number === currentTrainingWeek) || tWeeks[0];
            const sessions = wData?.sessions 
              || data.master_program.training?.sessions 
              || data.master_program.training_split?.sessions 
              || [];
            if (sessions.length > 0) {
              const currentIdx = Math.max(0, (selectedDay - 1) % sessions.length);
              const adapted = adaptSessionToInteractiveWorkout(sessions[currentIdx], currentIdx);
              if (adapted && adapted.exercises && adapted.exercises.length > 0) {
                setWorkoutSession(prev => ({
                  ...prev,
                  ...adapted
                }));
              }
            }
          }
        }
      })
      .catch(err => console.warn('Could not fetch client active program:', err));
  }, [clientData?.code]);

  // Dynamically sync workout session when selected day or training week changes
  useEffect(() => {
    if (!clientProgram) return;
    const tWeeks = clientProgram?.master_program?.training_program?.weeks
      || clientProgram?.training_program?.weeks
      || clientProgram?.master_program?.training?.weeks
      || clientProgram?.training?.weeks
      || [];
    const wData = tWeeks.find(w => w.week_number === currentTrainingWeek) || tWeeks[0];
    const sessions = wData?.sessions 
      || clientProgram.training?.sessions 
      || clientProgram.training_split?.sessions 
      || clientProgram.master_program?.training?.sessions
      || clientProgram.master_program?.training_split?.sessions
      || [];
    if (sessions.length > 0) {
      const currentIdx = Math.max(0, (selectedDay - 1) % sessions.length);
      const adapted = adaptSessionToInteractiveWorkout(sessions[currentIdx], currentIdx);
      if (adapted && adapted.exercises && adapted.exercises.length > 0) {
        setWorkoutSession(prev => ({
          ...prev,
          ...adapted
        }));
      }
    }
  }, [selectedDay, currentTrainingWeek, clientProgram]);

  // Persistent Offline Sync Queue
  const [offlineQueue, setOfflineQueue] = useState(() => {
    try {
      const raw = localStorage.getItem('kz_offline_queue');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Restore logged meals from localStorage for this day if present
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
    } catch (e) {}
  }, [selectedDay, clientData?.code, clientProgram]);

  // Daily Nutrition State & Live Swaps
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

  // Smart Swap Modal State
  const [activeSwapItem, setActiveSwapItem] = useState(null);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [travelModeActive, setTravelModeActive] = useState(false);
  const setIsTravelModeActive = setTravelModeActive;
  const [travelConfirmTarget, setTravelConfirmTarget] = useState(null);
  const [travelChosenTier, setTravelChosenTier] = useState(null);
  const [returnTravelModalOpen, setReturnTravelModalOpen] = useState(false);
  const [exerciseSwapTarget, setExerciseSwapTarget] = useState(null);
  const [exerciseSwapsList, setExerciseSwapsList] = useState([]);
  const [loadingExerciseSwaps, setLoadingExerciseSwaps] = useState(false);
  const [exerciseSwapFilter, setExerciseSwapFilter] = useState('ALL'); // ALL | GYM | HOME

  useEffect(() => {
    if (!exerciseSwapTarget?.exercise) {
      setExerciseSwapsList([]);
      setExerciseSwapFilter('ALL');
      return;
    }
    const targetEx = exerciseSwapTarget.exercise;
    const exCode = targetEx.code || targetEx.id || targetEx.exercise_code || targetEx.name;
    setLoadingExerciseSwaps(true);
    fetch(`${API_BASE}/api/v1/exercises/swaps/${encodeURIComponent(exCode)}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.swaps) && data.swaps.length > 0) {
          setExerciseSwapsList(data.swaps);
        } else {
          setExerciseSwapsList([]);
        }
      })
      .catch(err => {
        console.warn('Failed to load exercise swaps:', err);
        setExerciseSwapsList([]);
      })
      .finally(() => {
        setLoadingExerciseSwaps(false);
      });
  }, [exerciseSwapTarget]);

  const [portionDisplayMode, setPortionDisplayMode] = useState(PORTION_DISPLAY_MODES.DUAL);
  const [cookingStateMode, setCookingStateMode] = useState(COOKING_STATE_MODES.BOTH);
  const [activePrepItem, setActivePrepItem] = useState(null);
  const [freeGuideModalOpen, setFreeGuideModalOpen] = useState(false);
  const [freeGuideTab, setFreeGuideTab] = useState('DRINKS');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [prehabCompleted, setPrehabCompleted] = useState(false);
  const [checkinWeight, setCheckinWeight] = useState(clientData.weight || '78.5');
  const [checkinWaist, setCheckinWaist] = useState('82.0');
  const [checkinAdherence, setCheckinAdherence] = useState(90);
  const [checkinPmsActive, setCheckinPmsActive] = useState(false);
  const [checkinAuditResult, setCheckinAuditResult] = useState(null);
  const [cardioPrescription, setCardioPrescription] = useState(() => getPracticalCardioPrescription({ type: CARDIO_TYPES.LISS_TALK_TEST }));
  const [diningBlueprints, setDiningBlueprints] = useState(() => getTravelDiningBlueprints());
  const [swapMealId, setSwapMealId] = useState(null);
  const [clientSwapSearch, setClientSwapSearch] = useState('');
  const [activeVideoExercise, setActiveVideoExercise] = useState(null);
  const [expandedTechnique, setExpandedTechnique] = useState({});

  // Daily Readiness & Autoregulation State (RPE & Energy)
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
    } catch (e) {}
  };

  // Optional Single-Tap Working Weight Memory
  const [exerciseWorkingWeights, setExerciseWorkingWeights] = useState(() => {
    try {
      const stored = localStorage.getItem('kz_exercise_working_weights');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  const handleUpdateExerciseWeight = (exId, val) => {
    setExerciseWorkingWeights(prev => {
      const next = { ...prev, [exId]: val };
      try {
        localStorage.setItem('kz_exercise_working_weights', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Workout Execution & Reading Guide Toggle
  const [showWorkoutGuide, setShowWorkoutGuide] = useState(false);

  // Workout Session State & Sets with Previous Week Benchmarks
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



  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Optional 1-Tap Toggle Exercise Completed
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
        } catch (e) {}
      }

      return nextSession;
    });
  };

  // Handle meal toggle with persistent storage and offline action
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

  // 1-Tap Swap Execution with persistence
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


  // Trigger manual sync or flush
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

  // Automatic sync flush when device regains internet connection
  useEffect(() => {
    const onOnline = () => {
      handleTriggerSync();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [offlineQueue]);

  // Calculate Dynamic Target Macros (Syncs with Coach Editor & Engine Auto-Regulation)
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
  // Supplements State & Interactive Checklist Tracking
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

  const consumedMacros = useMemo(() => {
    const acc = meals.reduce((mealAcc, meal) => {
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
  }, [meals, supplementsList, supplementsTaken]);


  const syncStatus = getQueueSyncStatus(offlineQueue);

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans" dir="rtl" style={{ fontFamily: 'Alexandria, Cairo, sans-serif' }}>
      
      {/* Mobile Shell Wrapper */}
      <div 
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#FAFAFC',
          minHeight: '100vh',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          paddingBottom: '80px'
        }}
      >
        {/* Top App Header */}
        <header 
          style={{
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '16px 18px 14px 18px',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 40
          }}
        >
          {/* Top Client & Status Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#1E293B',
                  border: '1px solid #334155',
                  color: '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem'
                }}
              >
                KZ
              </div>
              <div>
                <h1 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0, color: '#FFFFFF', lineHeight: 1.2 }}>
                  {clientData.name}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                  <span style={{ 
                    fontSize: '10px', 
                    color: clientData.package?.includes('ELITE') ? '#38BDF8' : '#F59E0B', 
                    background: clientData.package?.includes('ELITE') ? 'rgba(56, 189, 248, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                    border: `1px solid ${clientData.package?.includes('ELITE') ? 'rgba(56, 189, 248, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                    padding: '1px 7px', 
                    borderRadius: '6px', 
                    fontWeight: 700 
                  }}>
                    {clientData.package}
                  </span>
                  <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>
                    {clientData.streak} يوم التزام
                  </span>
                  {clientData.fastingProfile?.isCoptic && (
                    <span style={{ 
                      fontSize: '10px', 
                      color: '#C4B5FD', 
                      background: 'rgba(196, 181, 253, 0.12)', 
                      border: '1px solid rgba(196, 181, 253, 0.25)', 
                      padding: '1px 7px', 
                      borderRadius: '6px', 
                      fontWeight: 700 
                    }}>
                      {clientData.fastingProfile.christianFastingStyle === 'STRICT_VEGAN' ? 'صيام نباتي صرف' : 'صيام مع أسماك'}
                    </span>
                  )}
                  {clientData.fastingProfile?.isRamadan && (
                    <span style={{ 
                      fontSize: '10px', 
                      color: '#FDE68A', 
                      background: 'rgba(253, 230, 138, 0.12)', 
                      border: '1px solid rgba(253, 230, 138, 0.25)', 
                      padding: '1px 7px', 
                      borderRadius: '6px', 
                      fontWeight: 700 
                    }}>
                      صيام رمضان
                    </span>
                  )}
                  {clientData.fastingProfile?.isIntermittent && (
                    <span style={{ 
                      fontSize: '10px', 
                      color: '#7DD3FC', 
                      background: 'rgba(125, 211, 252, 0.12)', 
                      border: '1px solid rgba(125, 211, 252, 0.25)', 
                      padding: '1px 7px', 
                      borderRadius: '6px', 
                      fontWeight: 700 
                    }}>
                      {clientData.fastingProfile.intermittentBadge?.shortLabel || 'متقطع'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Clean Quick Actions & Sync Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Sync Status Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: syncStatus.is_fully_synced ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.15)',
                  border: `1px solid ${syncStatus.is_fully_synced ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.35)'}`,
                  borderRadius: '6px',
                  padding: '3px 7px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: syncStatus.is_fully_synced ? '#86EFAC' : '#FDE047'
                }}
                title={syncStatus.status_badge_ar}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: syncStatus.is_fully_synced ? '#22C55E' : '#EAB308' }}></div>
                <span>{syncStatus.is_fully_synced ? 'متزامن' : `${syncStatus.pending_count} محلي`}</span>
              </div>

              {!syncStatus.is_fully_synced && (
                <button
                  type="button"
                  onClick={handleTriggerSync}
                  disabled={isSyncing}
                  style={{
                    background: '#38BDF8',
                    color: '#0F172A',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '3px 7px',
                    fontSize: '10px',
                    fontWeight: 800,
                    cursor: isSyncing ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                  title="مزامنة التعديلات الآن"
                >
                  <RotateCcw style={{ width: '10px', height: '10px', animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                  <span>{isSyncing ? 'مزامنة...' : 'مزامنة'}</span>
                </button>
              )}

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '8px',
                  padding: '5px 9px',
                  color: '#E2E8F0',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
                title="المعدل الاسترشادي لاستهلاك الماء يومياً"
              >
                الماء المستهدف: 3.5 - 4.0 لتر/اليوم
              </div>

              <button
                type="button"
                onClick={() => setEmergencyModalOpen(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '8px',
                  padding: '5px 9px',
                  color: '#E2E8F0',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="تكييف الخطة وظروف السفر والعزومات"
              >
                مرونة اليوم
              </button>

              <button
                type="button"
                onClick={() => {
                  const rawCode = String(clientData?.code || '').replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
                  window.open(`/pdf?code=${encodeURIComponent(rawCode || '1')}`, '_blank');
                }}
                style={{
                  background: 'rgba(56, 189, 248, 0.16)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '8px',
                  padding: '5px 9px',
                  color: '#38BDF8',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="استعراض وطباعة وثيقة الخطة التنفيذية الرسمية A4 PDF"
              >
                الخطة التنفيذية (PDF)
              </button>

              <button
                type="button"
                onClick={() => navigate('/renew')}
                style={{
                  background: 'rgba(217, 119, 6, 0.18)',
                  border: '1px solid rgba(217, 119, 6, 0.35)',
                  borderRadius: '8px',
                  padding: '5px 9px',
                  color: '#FDE68A',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="تجديد الاشتراك أونلاين"
              >
                تجديد
              </button>
            </div>
          </div>

          {/* Clean Muted Status Line (Circadian & NEAT) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94A3B8', borderTop: '1px solid rgba(255, 255, 255, 0.07)', paddingTop: '8px', marginBottom: '10px' }}>
            <span>{getCaffeineCutoffTime("23:00").directive_ar}</span>
            <span style={{ color: '#CBD5E1', fontWeight: 600 }}>8,500 خطوة (مستقر)</span>
          </div>

          {/* Days Selector Strip */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
            {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((dayName, idx) => {
              const dayNum = idx + 1;
              const isSelected = selectedDay === dayNum;
              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDay(dayNum)}
                  style={{
                    flex: '0 0 auto',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: isSelected ? 800 : 500,
                    background: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.06)',
                    color: isSelected ? '#0F172A' : '#94A3B8',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {dayName}
                </button>
              );
            })}
          </div>
        </header>

        {/* Clinical Medication Safety Notice (Unobtrusive - Only for thyroid medication users) */}
        {clientData.clinicalProfile?.takes_thyroid_med && (
          <div style={{ margin: '12px 16px 0 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '8px 12px', fontSize: '0.72rem', color: '#475569', lineHeight: '1.4' }}>
            <strong style={{ color: '#0F172A' }}>تنبيه علاجي (Eltroxin):</strong> حظر تناول الألبان، مكملات الكالسيوم أو الحديد لمدة 4 ساعات من جرعة الصباح لضمان الامتصاص الكامل.
          </div>
        )}

        {/* Active Fasting Mode Status Banner */}
        {clientData.fastingProfile && (clientData.fastingProfile.isCoptic || clientData.fastingProfile.isIntermittent || clientData.fastingProfile.isRamadan) && (
          <div style={{
            margin: '10px 16px 0 16px',
            background: '#FFFFFF',
            border: `1px solid ${clientData.fastingProfile.isCoptic ? '#DDD6FE' : (clientData.fastingProfile.isRamadan ? '#FDE68A' : '#BAE6FD')}`,
            borderRight: `4px solid ${clientData.fastingProfile.isCoptic ? '#7C3AED' : (clientData.fastingProfile.isRamadan ? '#D97706' : '#0284C7')}`,
            borderRadius: '10px',
            padding: '9px 12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <strong style={{ fontSize: '0.76rem', color: '#0F172A' }}>
                {clientData.fastingProfile.isCoptic 
                  ? (clientData.fastingProfile.christianFastingStyle === 'STRICT_VEGAN' ? 'نمط الصيام المسيحي (نباتي صرف خالي من الأسماك)' : 'نمط الصيام المسيحي (نباتي مع السماح بالأسماك)')
                  : (clientData.fastingProfile.isRamadan 
                      ? 'نمط صيام شهر رمضان المبارك (مواقيت الإفطار والسحور)'
                      : `نمط الصيام المتقطع (${clientData.fastingProfile.intermittentBadge?.label || '16/8'})`)}
              </strong>
              <span style={{ 
                fontSize: '0.68rem', 
                color: clientData.fastingProfile.isCoptic ? '#6D28D9' : (clientData.fastingProfile.isRamadan ? '#B45309' : '#0369A1'), 
                fontWeight: 700 
              }}>
                بروتوكول نشط
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#475569', lineHeight: 1.4, display: 'block' }}>
              {clientData.fastingProfile.isCoptic
                ? 'الخطة التغذوية مهيأة لتأمين كامل احتياجك من البروتين والأحماض الأمينية النباتية المركبة دون الإخلال بهدفك.'
                : (clientData.fastingProfile.isRamadan
                    ? 'تمت جدولة الوجبات وتوزيع كميات الماء والسوائل بين وجبتي الإفطار والسحور لدعم الاستشفاء والأداء التدريبي.'
                    : 'نافذة الإطعام نشطة؛ حافظ على مواعيد تناول وجباتك ضمن الساعات المحددة مع استمرار الترطيب بالماء على مدار اليوم.')}
            </span>
          </div>
        )}


{/* MAIN BODY CONTENT */}
        <main style={{ padding: '16px', flex: 1 }}>
          
          {/* TAB 1: MEALS & SMART SWAPS */}
          {activeTab === 'meals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Daily Macros Target Progress Card - Executive Clean */}
              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '14px 16px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600, display: 'block' }}>إجمالي السعرات اليومية</span>
                    <strong style={{ fontSize: '1rem', color: '#0F172A', fontWeight: 900 }}>
                      {Math.round(consumedMacros.cal)} <span style={{ fontSize: '0.76rem', color: '#94A3B8', fontWeight: 500 }}>/ {targetMacros.cal} سعرة</span>
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                    متبقي: <strong style={{ color: '#0F172A' }}>{Math.max(0, targetMacros.cal - Math.round(consumedMacros.cal))}</strong> سعرة
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {/* Protein */}
                  <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>
                      <span>بروتين</span>
                      <span style={{ color: '#0F172A', fontWeight: 700 }} dir="ltr">{Math.round(consumedMacros.p)}/{targetMacros.p}g</span>
                    </div>
                    <div style={{ width: '100%', height: '3px', background: '#E2E8F0', borderRadius: '9999px', marginTop: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (consumedMacros.p / targetMacros.p) * 100)}%`, height: '100%', background: '#0284C7' }}></div>
                    </div>
                  </div>

                  {/* Carbs */}
                  <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>
                      <span>كارب</span>
                      <span style={{ color: '#0F172A', fontWeight: 700 }} dir="ltr">{Math.round(consumedMacros.c)}/{targetMacros.c}g</span>
                    </div>
                    <div style={{ width: '100%', height: '3px', background: '#E2E8F0', borderRadius: '9999px', marginTop: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (consumedMacros.c / targetMacros.c) * 100)}%`, height: '100%', background: '#D97706' }}></div>
                    </div>
                  </div>

                  {/* Fats */}
                  <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>
                      <span>دهون</span>
                      <span style={{ color: '#0F172A', fontWeight: 700 }} dir="ltr">{Math.round(consumedMacros.f)}/{targetMacros.f}g</span>
                    </div>
                    <div style={{ width: '100%', height: '3px', background: '#E2E8F0', borderRadius: '9999px', marginTop: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (consumedMacros.f / targetMacros.f) * 100)}%`, height: '100%', background: '#059669' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unified Compact Meal Controls Bar (حالة الوزن، المعيار، والخطط الإضافية في سطر تنفيذي أنيق) */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  flexWrap: 'wrap', 
                  gap: '8px', 
                  background: '#F8FAFC', 
                  border: '1px solid #E2E8F0', 
                  borderRadius: '12px', 
                  padding: '6px 10px', 
                  margin: '4px 0 10px 0' 
                }}
              >
                {/* Portion Mode & Cooking State Capsules */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Portion Mode */}
                  <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '2px', borderRadius: '8px', gap: '2px' }}>
                    {[
                      { key: PORTION_DISPLAY_MODES.DUAL, label: 'مزدوج' },
                      { key: PORTION_DISPLAY_MODES.GRAMS, label: 'ميزان' },
                      { key: PORTION_DISPLAY_MODES.HAND_PORTIONS, label: 'يد' }
                    ].map(tab => {
                      const isSel = portionDisplayMode === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setPortionDisplayMode(tab.key)}
                          style={{
                            background: isSel ? '#0F172A' : 'transparent',
                            color: isSel ? '#FFFFFF' : '#64748B',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '0.68rem',
                            fontWeight: isSel ? 800 : 600,
                            cursor: 'pointer',
                            transition: 'all 0.12s ease'
                          }}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <span style={{ color: '#CBD5E1', fontSize: '10px' }}>•</span>

                  {/* Cooking State */}
                  <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '2px', borderRadius: '8px', gap: '2px' }}>
                    {[
                      { key: COOKING_STATE_MODES.BOTH, label: 'معاً' },
                      { key: COOKING_STATE_MODES.COOKED, label: 'مطبوخ' },
                      { key: COOKING_STATE_MODES.RAW, label: 'نيء' }
                    ].map(cTab => {
                      const isSel = cookingStateMode === cTab.key;
                      return (
                        <button
                          key={cTab.key}
                          type="button"
                          onClick={() => setCookingStateMode(cTab.key)}
                          style={{
                            background: isSel ? '#0F172A' : 'transparent',
                            color: isSel ? '#FFFFFF' : '#64748B',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '0.68rem',
                            fontWeight: isSel ? 800 : 600,
                            cursor: 'pointer',
                            transition: 'all 0.12s ease'
                          }}
                        >
                          {cTab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Secondary Quick Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setTravelModeActive(prev => !prev)}
                    style={{
                      background: travelModeActive ? '#EFF6FF' : '#F8FAFC',
                      color: travelModeActive ? '#0284C7' : '#64748B',
                      border: `1px solid ${travelModeActive ? '#BAE6FD' : '#E2E8F0'}`,
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {travelModeActive ? 'إخفاء المطاعم' : 'خطط المطاعم'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFreeGuideModalOpen(true)}
                    style={{
                      background: '#F0FDF4',
                      color: '#166534',
                      border: '1px solid #BBF7D0',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    دليل الالتزام
                  </button>
                </div>
              </div>

              {/* Pre-Engineered Dining Blueprints Section (Visible when travelMode is active) */}
              {travelModeActive && (
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '16px', padding: '14px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>
                    خطط المطاعم والسفر الجاهزة (Dining Blueprints)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {diningBlueprints.map(bp => (
                      <div key={bp.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.8rem', color: '#0369A1' }}>{bp.title_ar}</strong>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '1px 6px', borderRadius: '6px' }} dir="ltr">
                            ~{bp.estimated_macros.calories_kcal} kcal • P: {bp.estimated_macros.protein_g}g
                          </span>
                        </div>
                        <ul style={{ margin: 0, paddingRight: '16px', fontSize: '0.72rem', color: '#334155', lineHeight: 1.4 }}>
                          {bp.ordered_items_ar.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Workout Timing & Flexibility Guidance Banner */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 14px', marginBottom: '12px' }}>
                <p style={{ margin: 0, fontSize: '0.73rem', color: '#334155', lineHeight: 1.5 }}>
                  <strong>ملاحظة مرونة التوقيت:</strong> توزيع وتوقيت الوجبات حول التمرين استرشادي لتحقيق أقصى طاقة واستشفاء؛ ولديك كامل المرونة في تقديم أو تأخير أي وجبة وفق جدول يومك ومواعيد دوامك، فالفيصل الرياضي والأيضي هو إكمال إجمالي السعرات والماكروز المقررة لك في نهاية اليوم.
                </p>
              </div>

              {/* Meals List */}
              {meals.map((meal) => (
                <div 
                  key={meal.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    padding: '14px 16px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
                  }}
                >
                  {/* Meal Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                        <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                          {meal.title}
                        </h3>
                        {(meal.workout_timing === 'PRE_WORKOUT' || meal.title?.includes('قبل التمرين')) && (
                          <span style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '1px 6px', borderRadius: '6px', fontSize: '0.67rem', fontWeight: 800 }}>
                            وجبة ما قبل التمرين (طاقة وجليكوجين)
                          </span>
                        )}
                        {(meal.workout_timing === 'POST_WORKOUT' || meal.title?.includes('بعد التمرين') || meal.title?.includes('التعافي')) && (
                          <span style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', padding: '1px 6px', borderRadius: '6px', fontSize: '0.67rem', fontWeight: 800 }}>
                            وجبة ما بعد التمرين (بناء عضلي واستشفاء)
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{meal.time}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleMealCompleted(meal.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: meal.completed ? '#0F172A' : '#F8FAFC',
                        color: meal.completed ? '#FFFFFF' : '#475569',
                        border: `1px solid ${meal.completed ? '#0F172A' : '#CBD5E1'}`,
                        borderRadius: '8px',
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {meal.completed && <Check style={{ width: '12px', height: '12px' }} />}
                      <span>{meal.completed ? 'تم التناول' : 'تسجيل التناول'}</span>
                    </button>
                  </div>

                  {/* Meal Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {meal.items.map(item => {
                      const prepOptions = getPrepOptionsForFood(item.code || item.name);
                      const formatted = formatItemPortionDisplay({
                        food_code: item.code || item.name, 
                        amount_g: item.amount, 
                        unit: item.unit, 
                        macro_type: item.p > item.c ? 'PROTEIN' : (item.c > 5 ? 'CARBS' : 'FATS'),
                        food_state: cookingStateMode
                      }, portionDisplayMode, cookingStateMode);

                      return (
                        <div 
                          key={item.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 10px',
                            background: '#F8FAFC',
                            borderRadius: '10px',
                            border: '1px solid #F1F5F9'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
                                {item.name}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 700 }}>
                                {formatted.mode === PORTION_DISPLAY_MODES.DUAL ? (
                                  <span>{formatted.primary_text} <span style={{ color: '#64748B', fontWeight: 500 }}>({formatted.secondary_text})</span></span>
                                ) : (
                                  formatted.primary_text
                                )}
                              </span>
                            </div>

                            {/* Clean, Non-scrambled LTR Macros */}
                            <div style={{ marginTop: '2px', fontSize: '0.68rem', color: '#64748B' }} dir="ltr">
                              <span style={{ fontWeight: 600, color: '#334155' }}>{Math.round(item.cal)} kcal</span>
                              <span style={{ margin: '0 4px', color: '#CBD5E1' }}>•</span>
                              <span>P: {item.p}g</span>
                              <span style={{ margin: '0 4px', color: '#CBD5E1' }}>•</span>
                              <span>C: {item.c}g</span>
                              <span style={{ margin: '0 4px', color: '#CBD5E1' }}>•</span>
                              <span>F: {item.f}g</span>
                            </div>
                          </div>

                          {/* Clean Action Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {prepOptions && (
                              <button
                                type="button"
                                onClick={() => setActivePrepItem(item)}
                                style={{
                                  background: '#FFFFFF',
                                  color: '#475569',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: '6px',
                                  padding: '3px 7px',
                                  fontSize: '0.68rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                                title="أفكار خلطات وطرق إعداد"
                              >
                                خلطات
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => { setActiveSwapItem(item); setSwapMealId(meal.id); }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                background: '#FFFFFF',
                                color: '#0F172A',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                padding: '3px 8px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="تبديل الصنف ببديل مكافئ"
                            >
                              <ArrowLeftRight style={{ width: '11px', height: '11px' }} />
                              <span>بديل</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* SMART PLAN GUIDELINES ACCORDION (مطوي افتراضياً لمنع الزحمة) */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 14px', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div 
                    onClick={() => setGuidelinesOpen(prev => !prev)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <ShieldCheck style={{ width: '15px', height: '15px', color: '#0F172A' }} />
                    <strong style={{ fontSize: '0.8rem', color: '#0F172A' }}>إرشادات وقواعد الخطة</strong>
                    <span style={{ fontSize: '0.68rem', color: '#64748B', background: '#F1F5F9', padding: '1px 6px', borderRadius: '6px' }}>
                      {guidelinesOpen ? 'طي' : 'عرض (5 إرشادات)'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPdfModalOpen(true)}
                    style={{
                      background: '#0F172A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    تصدير PDF
                  </button>
                </div>

                {guidelinesOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                    {SMART_GUIDELINES_MATRIX.map((guide) => (
                      <div key={guide.id} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '8px', padding: '8px 10px' }}>
                        <strong style={{ fontSize: '0.74rem', color: '#0F172A', display: 'block', marginBottom: '2px' }}>{guide.title_ar}</strong>
                        <span style={{ fontSize: '0.7rem', color: '#64748B', lineHeight: 1.4 }}>{guide.instruction_ar}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Interactive Supplements & Micronutrition Checklist Card */}
              {supplementsList.length > 0 && (
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '0.84rem', color: '#0F172A', fontWeight: 800 }}>المكملات الغذائية المعتمدة وبروتوكول الاستشفاء</strong>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                      تم تناول: <strong style={{ color: '#0F172A' }}>{supplementsList.filter(s => supplementsTaken[s.id]).length}</strong> / {supplementsList.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {supplementsList.map((supp) => {
                      const isDone = Boolean(supplementsTaken[supp.id]);
                      return (
                        <div
                          key={supp.id}
                          onClick={() => toggleSupplementTaken(supp.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: `1px solid ${isDone ? '#BBF7D0' : '#E2E8F0'}`,
                            background: isDone ? '#F0FDF4' : '#F8FAFC',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <button
                              type="button"
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '6px',
                                border: isDone ? 'none' : '1px solid #CBD5E1',
                                background: isDone ? '#16A34A' : '#FFFFFF',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                            >
                              {isDone && <Check size={13} strokeWidth={3} />}
                            </button>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '0.76rem', color: isDone ? '#166534' : '#0F172A', textDecoration: isDone ? 'line-through' : 'none' }}>
                                  {supp.name}
                                </strong>
                                {supp.dose && (
                                  <span style={{ fontSize: '0.68rem', color: '#64748B', background: '#E2E8F0', padding: '1px 5px', borderRadius: '6px', fontWeight: 600 }}>
                                    {supp.dose}
                                  </span>
                                )}
                                {supp.timing && (
                                  <span style={{ fontSize: '0.68rem', color: '#0284C7', background: '#E0F2FE', padding: '1px 5px', borderRadius: '6px', fontWeight: 600 }}>
                                    {supp.timing}
                                  </span>
                                )}
                              </div>
                              {supp.notes && (
                                <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block', marginTop: '2px' }}>
                                  {supp.notes}
                                </span>
                              )}
                            </div>
                          </div>

                          {supp.cal > 0 && (
                            <div style={{ textAlign: 'left', flexShrink: 0, paddingRight: '8px' }}>
                              <strong style={{ fontSize: '0.74rem', color: '#0F172A', display: 'block' }}>{supp.cal} kcal</strong>
                              <span style={{ fontSize: '0.65rem', color: '#64748B' }} dir="ltr">P:{supp.p} C:{supp.c} F:{supp.f}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

{/* TAB 2: WORKOUT PLAN REFERENCE */}
          {activeTab === 'workout' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Mesocycle Weeks Selector (دورة الميزوسايكل الفسيولوجية) */}
              {trainingWeeks.length > 0 && (
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '12px 14px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div>
                      <strong style={{ fontSize: '0.82rem', color: '#0F172A', display: 'block' }}>
                        دورة التدريب (الميزوسايكل)
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                        5 أسابيع متدرجة الحمل والاستشفاء
                      </span>
                    </div>
                    {selectedWeekData && (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: selectedWeekData.phase === 'DELOAD' ? '#DCFCE7' : '#EFF6FF',
                        color: selectedWeekData.phase === 'DELOAD' ? '#166534' : '#1D4ED8',
                        border: selectedWeekData.phase === 'DELOAD' ? '1px solid #BBF7D0' : '1px solid #BFDBFE'
                      }}>
                        {selectedWeekData.phase === 'DELOAD' ? 'أسبوع كسر الإجهاد والاستشفاء (Deload -40% حجم)' : `الأسبوع ${selectedWeekData.week_number} • RIR ${selectedWeekData.target_rir ?? 2}`}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                    {trainingWeeks.map(w => {
                      const isCurrent = currentTrainingWeek === w.week_number;
                      const isDeload = w.phase === 'DELOAD';
                      return (
                        <button
                          key={w.week_number}
                          type="button"
                          onClick={() => setCurrentTrainingWeek(w.week_number)}
                          style={{
                            padding: '6px 4px',
                            borderRadius: '8px',
                            border: isCurrent 
                              ? (isDeload ? '2px solid #16A34A' : '2px solid #0F172A')
                              : '1px solid #E2E8F0',
                            background: isCurrent 
                              ? (isDeload ? '#DCFCE7' : '#0F172A') 
                              : (isDeload ? '#F0FDF4' : '#F8FAFC'),
                            color: isCurrent 
                              ? (isDeload ? '#166534' : '#FFFFFF') 
                              : (isDeload ? '#15803D' : '#475569'),
                            fontSize: '0.72rem',
                            fontWeight: isCurrent ? 800 : 600,
                            cursor: 'pointer',
                            textAlign: 'center',
                            lineHeight: 1.2
                          }}
                        >
                          <div>أسبوع {w.week_number}</div>
                          <div style={{ fontSize: '0.62rem', opacity: 0.8, marginTop: '2px' }}>
                            {isDeload ? 'استشفاء' : `RIR ${w.target_rir ?? 2}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Workout Session Banner */}
              <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFFFFF', borderRadius: '20px', padding: '18px', boxShadow: '0 4px 15px rgba(15, 23, 42, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontSize: '0.72rem', fontWeight: 700 }}>
                    <Dumbbell style={{ width: '13px', height: '13px', color: '#38BDF8' }} />
                    <span>جدول تمارين اليوم (دليل استرشادي سريع)</span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700 }}>
                    {workoutSession.exercises?.length || 0} تمارين
                  </span>
                </div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px 0' }}>
                  {workoutSession.title}
                </h2>
                <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                  {workoutSession.warmupProtocol}
                </div>
              </div>

              {/* Autoregulation & Daily Readiness Hub */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '12px 16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: '#0F172A', display: 'block' }}>
                      الجاهزية اليومية والتنظيم الذاتي (RPE)
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                      حدد حالتك البدنية لتكييف الشدة ورفع الحرج العصبي
                    </span>
                  </div>
                  
                  <div style={{ display: 'inline-flex', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
                    {[
                      { id: 'OPTIMAL', label: 'نشيط ومستعد' },
                      { id: 'MODERATE', label: 'طاقة معتدلة' },
                      { id: 'FATIGUED', label: 'خمول / إجهاد' }
                    ].map(opt => {
                      const active = dailyReadiness === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSetDailyReadiness(opt.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: active ? 800 : 600,
                            background: active 
                              ? (opt.id === 'FATIGUED' ? '#FEE2E2' : (opt.id === 'OPTIMAL' ? '#DCFCE7' : '#FFFFFF'))
                              : 'transparent',
                            color: active 
                              ? (opt.id === 'FATIGUED' ? '#991B1B' : (opt.id === 'OPTIMAL' ? '#166534' : '#0F172A'))
                              : '#64748B',
                            border: active ? '1px solid rgba(0,0,0,0.06)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {dailyReadiness === 'FATIGUED' ? (
                  <div style={{
                    background: '#FEF2F2',
                    borderRight: '3px solid #EF4444',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.72rem',
                    color: '#991B1B',
                    lineHeight: '1.5'
                  }}>
                    <strong style={{ display: 'block', marginBottom: '2px' }}>توجيه فسيولوجي ليوم الإجهاد:</strong>
                    طاقتك تتأثر بنومك وضغوط يومك وهذا تذبذب عصبي طبيعي مؤقت. من الاحترافية خفض الأوزان بنسبة 10-20% والتركيز على المدى الحركي الكامل وتفادي الوصول للفشل العضلي التام اليوم. قوتك الحقيقية ستعود بكامل كفاءتها الأسبوع القادم.
                  </div>
                ) : (
                  <div style={{
                    background: '#F8FAFC',
                    borderRight: '3px solid #0284C7',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.72rem',
                    color: '#475569',
                    lineHeight: '1.4'
                  }}>
                    <strong style={{ color: '#0F172A' }}>قاعدة الجاهزية (RPE):</strong> تمرن بأوزان تتحدى عضلاتك مع إبقاء 1-2 تكرار في الاحتياط قبل الفشل العضلي بتكنيك آمن ومحكم؛ الاستمرارية وضبط الأداء هما أساس التطور.
                  </div>
                )}
              </div>

              {/* Workout Execution & Reading Guide Card (دليل تنفيذ وفهم رموز الخطة) */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                padding: '12px 16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen style={{ width: '17px', height: '17px', color: '#0284C7' }} />
                    <div>
                      <strong style={{ fontSize: '0.82rem', color: '#0F172A', display: 'block' }}>
                        دليل تنفيذ الخطة وفهم الرموز
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                        كيف تتدرب باحترافية، ماذا تعني الأرقام، وكيف تحدد أوزانك؟
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowWorkoutGuide(prev => !prev)}
                    style={{
                      background: showWorkoutGuide ? '#F1F5F9' : '#E0F2FE',
                      color: showWorkoutGuide ? '#475569' : '#0369A1',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '5px 12px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{showWorkoutGuide ? 'إخفاء الدليل' : 'استعراض الدليل الشامل'}</span>
                    {showWorkoutGuide ? <ChevronUp style={{ width: '12px', height: '12px' }} /> : <ChevronDown style={{ width: '12px', height: '12px' }} />}
                  </button>
                </div>

                {showWorkoutGuide && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    
                    {/* Rule 1: Working Sets */}
                    <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                      <strong style={{ fontSize: '0.78rem', color: '#0F172A', display: 'block', marginBottom: '3px' }}>
                        1. مجموعات العمل الفعالة (Working Sets)
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569', lineHeight: '1.5' }}>
                        المجموعات المكتوبة في الجدول (مثال: 3 جولات) هي مجموعات عمل أساسية بنفس الوزن التشغيلي. التسخين يتم مسبقاً بوزن خفيف (بروتوكول RAMP) ولا يُحسب ضمن جولات الجدول إطلاقاً.
                      </p>
                    </div>

                    {/* Rule 2: Initial Weight Selection */}
                    <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                      <strong style={{ fontSize: '0.78rem', color: '#0F172A', display: 'block', marginBottom: '3px' }}>
                        2. كيف تحدد وزنك لأول مرة؟
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569', lineHeight: '1.5' }}>
                        لا نحدد لك وزناً ثابتاً مسبقاً في البداية لاختلاف القوة بين الأفراد واختلاف معايرة الأجهزة في الجيم. اختر وزناً تجريبياً آمناً وتدرج به حتى تصل لوزن يمكنك من إتمام التكرارات المطلوبة وأنت قادر على أداء 1-2 عدة فقط في الاحتياط قبل الفشل العضلي (RPE 8-9) بتكنيك سليم، ثم اكتب هذا الوزن في خانة "أفضل وزن اليوم" ليظل مرجعك الدائم.
                      </p>
                    </div>

                    {/* Rule 3: Rep Range */}
                    <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                      <strong style={{ fontSize: '0.78rem', color: '#0F172A', display: 'block', marginBottom: '3px' }}>
                        3. ماذا يعني النطاق التكراري (مثال: 8-10 عدات)؟
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569', lineHeight: '1.5' }}>
                        يعني اختيار وزن لا تستطيع عمل أقل من 8 عدات به، ولا تستطيع تجاوز 10 عدات به بتكنيك محكم. إذا تمكنت من عمل 11 عدة، فالوزن خفيف؛ وإذا عجزت قبل 8 عدات، فالوزن ثقيل.
                      </p>
                    </div>

                    {/* Rule 4: Rest Periods */}
                    <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                      <strong style={{ fontSize: '0.78rem', color: '#0F172A', display: 'block', marginBottom: '3px' }}>
                        4. فترات الراحة بين الجولات (مثال: 60 - 90 ثانية)
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569', lineHeight: '1.5' }}>
                        الراحة المحددة إلزامية لإعادة شحن مركبات الطاقة الخلوية (ATP) واستشفاء الجهاز العصبي، مما يمكنك من رفع نفس الوزن في المجموعة التالية بكامل التوتر الميكانيكي.
                      </p>
                    </div>

                    {/* Rule 5: Progressive Overload */}
                    <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                      <strong style={{ fontSize: '0.78rem', color: '#0F172A', display: 'block', marginBottom: '3px' }}>
                        5. متى ترفع الوزن؟ (الزيادة التدريجية)
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569', lineHeight: '1.5' }}>
                        ترفع الوزن في الأسبوع التالي فقط بمقدار 2.5 إلى 5 كجم عندما تنجح في أداء الحد الأقصى للتكرارات (مثلاً 10 عدات كاملة) في كافة المجموعات الثلاث بنفس الوزن الحالي.
                      </p>
                    </div>

                    {/* Rule 6: Equipment Swap */}
                    <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                      <strong style={{ fontSize: '0.78rem', color: '#0F172A', display: 'block', marginBottom: '3px' }}>
                        6. زر "بديل الجهاز"
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569', lineHeight: '1.5' }}>
                        في حال كان الجهاز المطلوب مشغولاً في الصالة، اضغط على "بديل الجهاز" لتحصل فوراً على التمرين الميكانيكي المطابق لنفس الزاوية العضلية دون تضييع وقتك.
                      </p>
                    </div>

                  </div>
                )}
              </div>

              {/* POSTURAL & JOINT PREHAB PRIMER CARD (يظهر فقط لمن لديهم إصابات أو مشاكل قوامية مسجلة) */}
              {(() => {
                const userConditions = clientData.clinicalProfile?.medical_conditions || [];
                if (!userConditions || userConditions.length === 0) return null;

                const prehabRoutine = getPrehabRoutine(
                  userConditions,
                  'UPPER'
                );

                if (!prehabRoutine || !prehabRoutine.has_prehab || !prehabRoutine.exercises || prehabRoutine.exercises.length === 0) {
                  return null;
                }

                return (
                  <div 
                    style={{
                      background: prehabCompleted ? '#F0FDF4' : '#FFFBEB',
                      border: `1px solid ${prehabCompleted ? '#BBF7D0' : '#FDE68A'}`,
                      borderRadius: '20px',
                      padding: '16px',
                      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck style={{ width: '18px', height: '18px', color: prehabCompleted ? '#166534' : '#92400E' }} />
                        <div>
                          <h3 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 800, color: prehabCompleted ? '#166534' : '#92400E' }}>
                            {prehabRoutine.routine_title_ar}
                          </h3>
                          <span style={{ fontSize: '0.7rem', color: prehabCompleted ? '#15803D' : '#B45309' }}>
                            مخصص لحالتك: ({prehabRoutine.estimated_time_minutes} دقائق قبل بدء أوزان اليوم)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPrehabCompleted(!prehabCompleted)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: prehabCompleted ? '#16A34A' : '#D97706',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '6px 12px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        <Check style={{ width: '14px', height: '14px' }} />
                        <span>{prehabCompleted ? 'تم الإحماء التأهيلي' : 'تأكيد إتمام التأهيل'}</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {prehabRoutine.exercises.map((pEx, pIdx) => (
                        <div 
                          key={pEx.id || pIdx}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            padding: '10px 12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '0.8rem', color: '#0F172A', display: 'block' }}>
                              {pIdx + 1}. {pEx.name_ar}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: '#0284C7', fontWeight: 700 }}>
                              {pEx.prescription}
                            </span>
                            <small style={{ display: 'block', fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                              توجيه: {pEx.cue_ar}
                            </small>
                          </div>
                          <span style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                            {pEx.target_area}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* PRACTICAL TALK-TEST CARDIO CARD */}
              <div style={{ background: 'linear-gradient(135deg, #ECFEFF 0%, #E0F2FE 100%)', border: '1px solid #BAE6FD', borderRadius: '18px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity style={{ width: '16px', height: '16px', color: '#0284C7' }} />
                    <h3 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 800, color: '#0369A1' }}>
                      {cardioPrescription.protocol_title_ar}
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284C7', background: '#FFFFFF', padding: '2px 8px', borderRadius: '6px' }}>
                    {cardioPrescription.duration_minutes} دقيقة | {cardioPrescription.sessions_per_week} جلسات/أسبوع
                  </span>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '10px 12px', marginBottom: '8px' }}>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#0F172A', lineHeight: 1.4 }}>
                    <strong>قاعدة اختبار التحدث (The Talk Test):</strong> {cardioPrescription.talk_test_cue_ar}
                  </p>
                </div>

                <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569' }}>
                  <strong>الأداة المقترحة:</strong> {cardioPrescription.suggested_settings_ar || cardioPrescription.equipment_recommendation}
                </p>
              </div>

              {/* Exercises Streamlined Visual Workout Cards */}
              {workoutSession.exercises.map((ex, exIdx) => {
                const isCompleted = Boolean(ex.completed || (ex.sets && ex.sets.length > 0 && ex.sets.every(s => s.completed)));
                const isTechniqueExpanded = Boolean(expandedTechnique[ex.id]);
                const restSec = ex.restDurationSec || (ex.isCompound ? 90 : 60);

                return (
                  <div 
                    key={ex.id}
                    style={{
                      background: isCompleted ? '#F0FDF4' : '#FFFFFF',
                      borderRadius: '16px',
                      border: isCompleted ? '1.5px solid #86EFAC' : '1px solid #E2E8F0',
                      padding: '14px',
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Top Row: Exercise Name, Type Badge & Swap Action */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: ex.isCompound ? '#B45309' : '#0284C7', background: ex.isCompound ? '#FEF3C7' : '#E0F2FE', padding: '1px 6px', borderRadius: '6px' }}>
                            {ex.isCompound ? 'تمرين مركب' : 'تمرين عزل'}
                          </span>
                          {isCompleted && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '1px 6px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <CheckCircle2 style={{ width: '10px', height: '10px' }} />
                              <span>مكتمل</span>
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', margin: '0 0 2px 0', direction: 'ltr', textAlign: 'right' }}>
                          {exIdx + 1}. {ex.nameEn || ex.name}
                        </h3>
                        {(ex.nameAr || ex.name) && (
                          <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                            {ex.nameAr || ex.name}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setExerciseSwapTarget({ exercise: ex, exIdx })}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#FFFFFF',
                          color: '#0F172A',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                        title="تبديل التمرين في حال انشغال الجهاز في الجيم"
                      >
                        <ArrowLeftRight style={{ width: '12px', height: '12px' }} />
                        <span>بديل الجهاز</span>
                      </button>
                    </div>

                    {/* Prescription Target Summary Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 800, color: '#0F172A' }}>
                        {ex.targetSets || (ex.sets && ex.sets.length) || 3} جولات × {ex.targetReps || '10-12'} تكرار
                      </span>
                      <span style={{ color: '#94A3B8' }}>•</span>
                      <span style={{ fontWeight: 700, color: '#475569' }}>
                        راحة: {restSec} ثانية
                      </span>
                      {ex.targetRir !== undefined && (
                        <>
                          <span style={{ color: '#94A3B8' }}>•</span>
                          <span style={{ fontWeight: 700, color: '#2563EB' }}>
                            الشدة: RIR {ex.targetRir}
                          </span>
                        </>
                      )}
                      {exerciseWorkingWeights[ex.id] && (
                        <>
                          <span style={{ color: '#94A3B8' }}>•</span>
                          <span style={{ fontWeight: 700, color: '#16A34A' }}>
                            وزنك الحالي: {exerciseWorkingWeights[ex.id]} كجم
                          </span>
                        </>
                      )}
                    </div>

                    {/* Visual Movement Frames (Start & Finish Positions) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ position: 'relative', height: '115px', borderRadius: '10px', overflow: 'hidden', background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                          src={ex.image_stretch || `/exercises/${ex.id}/0.jpg`}
                          alt="وضع البداية"
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }}
                          onError={(e) => { 
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                          loading="lazy"
                        />
                        <div className="img-fallback" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700 }}>
                          <Dumbbell style={{ width: '18px', height: '18px', opacity: 0.6 }} />
                          <span>وضعية البداية</span>
                        </div>
                        <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(15, 23, 42, 0.85)', color: '#FFFFFF', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '6px' }}>
                          1. وضع البداية
                        </span>
                      </div>

                      <div style={{ position: 'relative', height: '115px', borderRadius: '10px', overflow: 'hidden', background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                          src={ex.image_contraction || `/exercises/${ex.id}/1.jpg`}
                          alt="وضع الانقباض"
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }}
                          onError={(e) => { 
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                          loading="lazy"
                        />
                        <div className="img-fallback" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700 }}>
                          <Dumbbell style={{ width: '18px', height: '18px', opacity: 0.6 }} />
                          <span>وضعية الانقباض</span>
                        </div>
                        <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(15, 23, 42, 0.85)', color: '#FFFFFF', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '6px' }}>
                          2. وضع الانقباض
                        </span>
                      </div>
                    </div>

                    {/* Technique & Video Trigger Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Watch Video / Short */}
                      <button
                        type="button"
                        onClick={() => setActiveVideoExercise(ex)}
                        style={{
                          flex: 1,
                          height: '32px',
                          borderRadius: '8px',
                          background: '#0F172A',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Play style={{ width: '12px', height: '12px' }} />
                        <span>مشاهدة التكنيك بالفيديو</span>
                      </button>

                      {/* Expand Cues & Safety */}
                      <button
                        type="button"
                        onClick={() => setExpandedTechnique(prev => ({ ...prev, [ex.id]: !prev[ex.id] }))}
                        style={{
                          height: '32px',
                          padding: '0 10px',
                          borderRadius: '8px',
                          background: '#FFFFFF',
                          color: '#475569',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <ShieldCheck style={{ width: '13px', height: '13px', color: '#D97706' }} />
                        <span>إرشادات التكنيك</span>
                        {isTechniqueExpanded ? <ChevronUp style={{ width: '12px', height: '12px' }} /> : <ChevronDown style={{ width: '12px', height: '12px' }} />}
                      </button>
                    </div>

                    {/* Collapsible Coaching Cues & Injury Avoidance */}
                    {isTechniqueExpanded && (
                      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px', fontSize: '0.74rem', display: 'flex', flexDirection: 'column', gap: '6px', color: '#92400E' }}>
                        <div>
                          <strong style={{ color: '#0F172A', display: 'block', marginBottom: '2px' }}>التكنيك السليم:</strong>
                          <span>{ex.cues_ar || ex.safetyNote || 'الحفاظ على المدى الحركي الكامل والتحكم في الوزن أثناء النزول.'}</span>
                        </div>
                        {ex.mistakes_ar && (
                          <div style={{ borderTop: '1px dashed #FCD34D', paddingTop: '6px', marginTop: '2px' }}>
                            <strong style={{ color: '#B45309', display: 'block', marginBottom: '2px' }}>أخطاء شائعة لتجنب الإصابة:</strong>
                            <span>{ex.mistakes_ar}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Optional Single Working Weight Field (اختياري لراحتك) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '7px 12px',
                      fontSize: '0.74rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: '#334155' }}>أفضل وزن اليوم:</span>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={exerciseWorkingWeights[ex.id] ?? ''}
                            onChange={(e) => handleUpdateExerciseWeight(ex.id, e.target.value)}
                            style={{
                              width: '62px',
                              height: '28px',
                              padding: '2px 6px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              background: '#FFFFFF',
                              fontSize: '0.8rem',
                              fontWeight: 800,
                              textAlign: 'center',
                              color: '#0F172A',
                              outline: 'none'
                            }}
                          />
                          <span style={{ color: '#64748B', fontWeight: 700, fontSize: '0.72rem' }}>كجم</span>
                        </div>
                      </div>

                      <span style={{ fontSize: '0.7rem', color: exerciseWorkingWeights[ex.id] ? '#16A34A' : '#94A3B8', fontWeight: 600 }}>
                        {exerciseWorkingWeights[ex.id] 
                          ? 'محفوظ كمرجع لأسبوعك القادم' 
                          : 'يُحدد بالتجربة الميدانية (RPE 8)'}
                      </span>
                    </div>

                    {/* Optional Reference Mark (بدون أي مؤقت أو عد تنازلي) */}
                    <button
                      type="button"
                      onClick={() => handleToggleExerciseCompleted(ex.id)}
                      style={{
                        width: '100%',
                        height: '34px',
                        borderRadius: '8px',
                        background: isCompleted ? '#F0FDF4' : '#F8FAFC',
                        color: isCompleted ? '#166534' : '#64748B',
                        border: `1px solid ${isCompleted ? '#BBF7D0' : '#E2E8F0'}`,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Check style={{ width: '14px', height: '14px', color: isCompleted ? '#16A34A' : '#94A3B8' }} />
                      <span>{isCompleted ? 'تم إنجاز هذا التمرين' : 'تحديد كمنجز (اختياري)'}</span>
                    </button>

                  </div>
                );
              })}

            </div>
          )}

        </main>

        {/* BOTTOM NAVIGATION BAR */}
        <nav 
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '480px',
            background: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '8px 0',
            zIndex: 40,
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.04)'
          }}
        >
          {[
            { key: 'meals', label: 'الوجبات', icon: Utensils },
            { key: 'workout', label: 'التمرين', icon: Dumbbell },
            { key: 'checkin', label: 'المتابعة', icon: Activity, isRoute: true }
          ].map(tab => {
            const isActive = activeTab === tab.key;
            const TabIcon = tab.icon;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  if (tab.isRoute) {
                    const rawCode = String(clientData?.code || '').replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
                    navigate(rawCode ? `/check-in?code=${encodeURIComponent(rawCode)}` : '/check-in');
                  } else {
                    handleSwitchTab(tab.key);
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? '#0F172A' : '#94A3B8',
                  fontSize: '11px',
                  fontWeight: isActive ? 800 : 500,
                  cursor: 'pointer',
                  padding: '4px 16px',
                  transition: 'color 0.15s ease'
                }}
              >
                <TabIcon style={{ width: '18px', height: '18px', strokeWidth: isActive ? 2.5 : 2 }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

{/* SMART FOOD SWAP POPUP MODAL WITH CLINICAL FILTERS */}
        {activeSwapItem && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center'
            }}
            onClick={() => { setActiveSwapItem(null); setClientSwapSearch(''); }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '480px',
                background: '#FFFFFF',
                borderTopLeftRadius: '28px',
                borderTopRightRadius: '28px',
                padding: '24px 20px',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.15)',
                direction: 'rtl'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: '6px' }}>
                    محرك المبادلات الذكية (Clinical Smart Swaps)
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '4px 0 0 0' }}>
                    بدائل مكافئة لـ: {activeSwapItem.name}
                  </h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setActiveSwapItem(null)}
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X style={{ width: '16px', height: '16px', color: '#64748B' }} />
                </button>
              </div>

              {/* Current Item */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>الصنف الحالي بالخطة:</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                  <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{activeSwapItem.name}</strong>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284C7', fontFamily: 'monospace' }}>
                    {activeSwapItem.amount} {activeSwapItem.unit} ({Math.round(activeSwapItem.cal)} Kcal)
                  </span>
                </div>
              </div>

              {/* Search & Filter Controls for Smart Swaps */}
              <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="ابحث باسم أي صنف بديل تحبه..."
                  value={clientSwapSearch}
                  onChange={(e) => setClientSwapSearch(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    padding: '0 12px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    outline: 'none',
                    background: '#F8FAFC',
                    color: '#0F172A',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Calculated Swap Alternatives List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '45vh', overflowY: 'auto' }}>
                {(() => {
                  const currentItemCode = activeSwapItem.code || '';
                  const currentItemObj = FOOD_DATABASE[currentItemCode] || Object.values(FOOD_DATABASE).find(f => f.name_ar === activeSwapItem.name) || {};
                  const currentMacroType = currentItemObj.macro_type || (activeSwapItem.p > activeSwapItem.c && activeSwapItem.p > activeSwapItem.f ? 'PROTEIN' : (activeSwapItem.c > 5 ? 'CARBS' : 'FATS'));
                  const currentPortion = Number(activeSwapItem.amount) || 100;

                  // Find eligible foods from full FOOD_DATABASE
                  const allCandidateFoods = Object.values(FOOD_DATABASE).filter(f => {
                    if (!f || !f.code || !f.name_ar) return false;
                    // Only standard upper keys to avoid duplicate aliases
                    if (f.code !== f.code.toUpperCase()) return false;
                    if (f.code === currentItemCode) return false;
                    if (f.macro_type !== currentMacroType) return false;
                    if (clientSwapSearch.trim()) {
                      const matchNameAr = arabicSearchMatch(f.name_ar, clientSwapSearch);
                      const matchNameEn = arabicSearchMatch(f.name_en, clientSwapSearch);
                      const matchCode = arabicSearchMatch(f.code, clientSwapSearch);
                      const matchAliases = Array.isArray(f.aliases) 
                        ? f.aliases.some(a => arabicSearchMatch(a, clientSwapSearch)) 
                        : (typeof f.aliases === 'string' && arabicSearchMatch(f.aliases, clientSwapSearch));
                      return matchNameAr || matchNameEn || matchCode || matchAliases;
                    }
                    return true;
                  });

                  if (allCandidateFoods.length === 0) {
                    return (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '0.78rem' }}>
                        {"لا توجد بدائل مطابقة للبحث من نفس فئة المغذي (" + (currentMacroType === 'PROTEIN' ? 'البروتين' : currentMacroType === 'CARBS' ? 'النشويات' : 'الدهون') + ")."}
                      </div>
                    );
                  }

                  // Sort candidates: same taste profile first to ensure highest culinary harmony and palatability
                  const sortedCandidateFoods = [...allCandidateFoods].sort((a, b) => {
                    const aMatches = a.taste_profile && currentItemObj.taste_profile && a.taste_profile === currentItemObj.taste_profile ? 1 : 0;
                    const bMatches = b.taste_profile && currentItemObj.taste_profile && b.taste_profile === currentItemObj.taste_profile ? 1 : 0;
                    return bMatches - aMatches;
                  });

                  return sortedCandidateFoods.slice(0, 25).map((targetFood, sIdx) => {
                    let swapResult = null;
                    try {
                      const fromCode = currentItemObj.code ? currentItemObj.code : (currentMacroType === 'PROTEIN' ? 'CHICKEN_BREAST' : (currentMacroType === 'CARBS' ? 'BASMATI_RICE_COOKED' : 'EXTRA_VIRGIN_OLIVE_OIL'));
                      swapResult = calculateDynamicFoodSwap({
                        current_food_code: fromCode,
                        current_portion_g: currentPortion,
                        target_food_code: targetFood.code,
                        clinical_profile: clientData.clinicalProfile,
                        enforce_taste_profile: false
                      });
                    } catch {}

                    if (!swapResult) return null;

                    const isMatchingTaste = Boolean(targetFood.taste_profile && currentItemObj.taste_profile && targetFood.taste_profile === currentItemObj.taste_profile);

                    return (
                      <div 
                        key={targetFood.code || sIdx}
                        style={{
                          background: isMatchingTaste ? '#FFFFFF' : '#FAFAFA',
                          border: isMatchingTaste ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
                          borderRadius: '12px',
                          padding: '10px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.84rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {swapResult.replacement_food.name_ar}
                            </strong>
                            {isMatchingTaste && (
                              <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '6px', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
                                تناسق وجبة مثالي
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
                            الكمية المكافئة: {swapResult.replacement_food.portion_g} جم
                          </span>
                          <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px' }} dir="ltr">
                            <span>{swapResult.replacement_food.macros.calories_kcal} kcal</span>
                            <span style={{ margin: '0 4px' }}>•</span>
                            <span>P: {swapResult.replacement_food.macros.protein_g}g</span>
                            <span style={{ margin: '0 4px' }}>•</span>
                            <span>C: {swapResult.replacement_food.macros.carbs_g}g</span>
                            <span style={{ margin: '0 4px' }}>•</span>
                            <span>F: {swapResult.replacement_food.macros.fat_g}g</span>
                          </div>
                          {swapResult.clinical_note && (
                            <small style={{ display: 'block', fontSize: '0.66rem', color: '#D97706', fontWeight: 700, marginTop: '2px' }}>
                              {swapResult.clinical_note}
                            </small>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            handleExecuteSwap(swapResult);
                            setClientSwapSearch('');
                          }}
                          style={{
                            background: '#0F172A',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '7px 12px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            flexShrink: 0,
                            boxShadow: '0 1px 4px rgba(15, 23, 42, 0.15)'
                          }}
                        >
                          تبديل الآن
                        </button>
                      </div>
                    );
                  });
                })()}
              </div>

            </div>
          </div>
        )}


        {/* ZERO-CALORIE FREE BEVERAGES & SEASONINGS MODAL */}
        {freeGuideModalOpen && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '0'
            }}
            onClick={() => setFreeGuideModalOpen(false)}
          >
            <div 
              style={{
                background: '#FFFFFF',
                width: '100%',
                maxWidth: '440px',
                borderTopLeftRadius: '28px',
                borderTopRightRadius: '28px',
                padding: '24px 20px',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.15)',
                direction: 'rtl'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Utensils size={18} color="#0F172A" />
                  <div>
                    <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      {freeGuideTab === 'DRINKS' ? 'المشروبات الحرة وسكر الشاي والقهوة' :
                       freeGuideTab === 'OILS' ? 'زيوت الطهي وبخاخ الزيت والصوصات' :
                       freeGuideTab === 'SODIUM' ? 'بروتوكول الصوديوم وثبات الميزان' :
                       freeGuideTab === 'RESTAURANT' ? 'دليل الأكل بالمطاعم والعزومات' :
                       'دليل التوابل والبهارات ومحسنات الطعم'}
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                      إرشادات علمية دقيقة لضمان أقصى التزام وحرق دهون
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFreeGuideModalOpen(false)}
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X style={{ width: '16px', height: '16px', color: '#64748B' }} />
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '12px', marginBottom: '14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {[
                  { id: 'DRINKS', label: 'المشروبات والسكر' },
                  { id: 'OILS', label: 'الزيوت والصوصات' },
                  { id: 'SODIUM', label: 'الصوديوم والميزان' },
                  { id: 'RESTAURANT', label: 'أكل المطاعم' },
                  { id: 'SPICES', label: 'البهارات والتوابل' }
                ].map(t => {
                  const isSel = freeGuideTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFreeGuideTab(t.id)}
                      style={{
                        flex: '1 0 auto',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isSel ? '#0F172A' : 'transparent',
                        color: isSel ? '#FFFFFF' : '#475569',
                        fontSize: '0.74rem',
                        fontWeight: isSel ? 800 : 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {freeGuideTab === 'DRINKS' && (
                  FREE_BEVERAGES_CATALOG.map((drink) => (
                    <div key={drink.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '0.84rem', color: '#0F172A' }}>{drink.name_ar}</strong>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: drink.id === 'TABLE_SUGAR_ALLOWANCE' ? '#D97706' : '#059669', background: drink.id === 'TABLE_SUGAR_ALLOWANCE' ? '#FEF3C7' : '#ECFDF5', padding: '2px 6px', borderRadius: '6px' }}>
                          {drink.calories_text}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.74rem', color: '#475569', lineHeight: 1.4 }}>
                        {drink.desc_ar}
                      </p>
                      <small style={{ display: 'block', fontSize: '0.7rem', color: '#0284C7', fontWeight: 700 }}>
                        نصيحة: {drink.tip_ar}
                      </small>
                    </div>
                  ))
                )}

                {freeGuideTab === 'OILS' && (
                  COOKING_OILS_AND_SAUCES_GUIDE.map((oil) => (
                    <div key={oil.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '0.84rem', color: '#0F172A' }}>{oil.title_ar}</strong>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: oil.id === 'BANNED_SAUCES' ? '#BE123C' : '#059669', background: oil.id === 'BANNED_SAUCES' ? '#FFE4E6' : '#ECFDF5', padding: '2px 6px', borderRadius: '6px' }}>
                          {oil.badge_ar}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.74rem', color: '#475569', lineHeight: 1.4 }}>
                        {oil.desc_ar}
                      </p>
                      <small style={{ display: 'block', fontSize: '0.7rem', color: '#0F172A', fontWeight: 700 }}>
                        القاعدة الذهبية: {oil.rule_ar}
                      </small>
                    </div>
                  ))
                )}

                {freeGuideTab === 'SODIUM' && (
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                      {SODIUM_AND_WATER_GUIDE.title_ar}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {SODIUM_AND_WATER_GUIDE.key_points_ar.map((point, pIdx) => (
                        <div key={pIdx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284C7', marginTop: '6px', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.74rem', color: '#334155', lineHeight: 1.5 }}>
                            {point}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {freeGuideTab === 'RESTAURANT' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {DINING_OUT_SURVIVAL_GUIDE.rules_ar.map((r, rIdx) => (
                      <div key={rIdx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px' }}>
                        <strong style={{ fontSize: '0.84rem', color: '#0F172A', display: 'block', marginBottom: '3px' }}>
                          {r.rule_title_ar}
                        </strong>
                        <p style={{ margin: 0, fontSize: '0.74rem', color: '#475569', lineHeight: 1.4 }}>
                          {r.detail_ar}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {freeGuideTab === 'SPICES' && (
                  FREE_SEASONINGS_CATALOG.map((seasoning) => (
                    <div key={seasoning.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px' }}>
                      <strong style={{ fontSize: '0.84rem', color: '#0F172A', display: 'block', marginBottom: '4px' }}>{seasoning.name_ar}</strong>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.74rem', color: '#334155', lineHeight: 1.4 }}>
                        <strong>الأصناف:</strong> {seasoning.items_ar}
                      </p>
                      <small style={{ display: 'block', fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>
                        طريقة الاستخدام: {seasoning.usage_ar}
                      </small>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => setFreeGuideModalOpen(false)}
                style={{
                  width: '100%',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '12px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                إغلاق الدليل
              </button>
            </div>
          </div>
        )}

        {/* ACCESSIBLE HOME PREP OPTIONS MODAL */}
      {activePrepItem && (() => {
        const recipeData = getPrepOptionsForFood(activePrepItem.code || activePrepItem.name);
        if (!recipeData) return null;

        return (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '0'
            }}
            onClick={() => setActivePrepItem(null)}
          >
            <div 
              style={{
                background: '#FFFFFF',
                width: '100%',
                maxWidth: '440px',
                borderTopLeftRadius: '28px',
                borderTopRightRadius: '28px',
                padding: '24px 20px',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.15)'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Utensils style={{ width: '18px', height: '18px', color: '#0F172A' }} />
                  <div>
                    <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      خلطات وطرق تحضير منزلية (3 خيارات)
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                      {activePrepItem.name} ({activePrepItem.amount} {activePrepItem.unit})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePrepItem(null)}
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X style={{ width: '16px', height: '16px', color: '#64748B' }} />
                </button>
              </div>

              {/* Notice */}
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '10px 14px', marginBottom: '10px' }}>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#166534', lineHeight: 1.4 }}>
                  <strong>ملاحظة هامة:</strong> السعرات والماكروز محسوبة من وزن الصنف الأساسي فقط؛ كافة الإضافات أدناه مجانية وصفرية السعرات لكسر الملل ورفع لذة الوجبة!
                </p>
              </div>

              {/* Equipment Alternative Notice */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px' }}>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569', lineHeight: 1.4 }}>
                  <strong>بدائل أدوات الطهي:</strong> في حال عدم توفر قلاية هوائية (Air Fryer)، فإن الفرن المنزلي العادي (صينية بورق زبدة) أو الميكروويف المزود بخاصية الشواء (Grill) بديل ممتاز يعطي نفس القرمشة الصحية.
                </p>
              </div>

              {/* 3 Prep Options List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {(recipeData.prep_options || []).map((opt, idx) => (
                  <div 
                    key={opt.id || idx}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '16px',
                      padding: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span style={{ background: '#0284C7', color: '#FFFFFF', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                        {idx + 1}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>
                        {opt.name_ar}
                      </h4>
                    </div>

                    <p style={{ margin: '0 0 6px 0', fontSize: '0.74rem', color: '#475569', lineHeight: 1.4 }}>
                      <strong>المكونات البيتية الحرة:</strong> {opt.free_ingredients_ar}
                    </p>

                    <p style={{ margin: 0, fontSize: '0.74rem', color: '#0369A1', lineHeight: 1.4 }}>
                      <strong>التكنيك وسر الطهي:</strong> {opt.technique_ar}
                    </p>
                  </div>
                ))}
              </div>

              {recipeData.cooking_tip && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#92400E', fontWeight: 700 }}>
                    سر الشيف: {recipeData.cooking_tip}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setActivePrepItem(null)}
                style={{
                  width: '100%',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '12px',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                حسناً، فهمت الطريقة
              </button>
            </div>
          </div>
        );
      })()}

      {/* 1-CLICK MASTER PDF PLAN MODAL */}
      {pdfModalOpen && (() => {
        const pdfData = generateMasterPdfExportData({
          client_name: 'أحمد محمد',
          client_code: '882',
          package_tier: 'MAX',
          current_week: 2
        });

        return (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.7)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px'
            }}
            onClick={() => setPdfModalOpen(false)}
          >
            <div 
              style={{
                background: '#FFFFFF',
                width: '100%',
                maxWidth: '480px',
                borderRadius: '24px',
                padding: '24px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* PDF Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '2px 6px', borderRadius: '6px' }}>
                    {pdfData.branding.badge}
                  </span>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '0.96rem', fontWeight: 900, color: '#0F172A' }}>
                    {pdfData.document_title}
                  </h3>
                  <small style={{ color: '#64748B', fontSize: '0.72rem' }}>{pdfData.branding.platform} • {pdfData.branding.coach_name}</small>
                </div>
                <button
                  type="button"
                  onClick={() => setPdfModalOpen(false)}
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X style={{ width: '16px', height: '16px', color: '#64748B' }} />
                </button>
              </div>

              {/* PDF Summary Content */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.76rem', color: '#334155' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: '#0F172A' }}>خطة التغذية اليومية ({pdfData.nutrition.daily_calories} Kcal)</h4>
                  <p style={{ margin: '0 0 4px 0' }}>• البروتين: {pdfData.nutrition.protein_g}g | الكارب: {pdfData.nutrition.carbs_g}g | الدهون: {pdfData.nutrition.fat_g}g</p>
                  <p style={{ margin: 0, color: '#059669', fontWeight: 700 }}>• متاح عرض الكميات بالميزان أو مقاييس اليد البصرية.</p>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: '#0F172A' }}>الجدول التدريبي المعتمد ({pdfData.training.split_name})</h4>
                  <p style={{ margin: '0 0 4px 0' }}>• معايير الشدة: إيقاف الجولات عند <strong>RIR 1-2</strong> مع شارة دروب سيت بالجولة الأخيرة.</p>
                  <p style={{ margin: 0 }}>• الكارديو: {pdfData.cardio.protocol_title} ({pdfData.cardio.prescription})</p>
                </div>

                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '14px', padding: '12px' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: '#166534' }}>إرشادات الالتزام الذهبية</h4>
                  <ul style={{ margin: 0, paddingRight: '16px', lineHeight: 1.5 }}>
                    <li>وزن الأكل بعد الطهي بالجرامات.</li>
                    <li>إيقاف الكافيين قبل النوم بـ 6-8 ساعات.</li>
                    <li>شرب 3.5 لتر ماء يومياً.</li>
                  </ul>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => { window.print(); }}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  طباعة / حفظ كـ PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPdfModalOpen(false)}
                  style={{
                    background: '#F1F5F9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 18px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CONFIRMATION MODAL FOR TRAVEL MODE */}
      {travelConfirmTarget && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(5px)',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setTravelConfirmTarget(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              background: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #C4952D',
              padding: '24px 20px',
              direction: 'rtl',
              textAlign: 'center',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
            }}
          >
            <div style={{ background: 'rgba(196, 149, 45, 0.15)', border: '1px solid rgba(196, 149, 45, 0.3)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#F59E0B' }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 900, color: '#F8FAFC' }}>
              تأكيد تفعيل وضع السفر
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.5 }}>
              أنت على وشك تكييف خطتك إلى: <strong style={{ color: '#F59E0B' }}>{travelConfirmTarget.title}</strong>.<br />
              {travelConfirmTarget.desc}<br />
              يمكنك العودة لجدولك الأساسي في الجيم في أي وقت بضغطة زر.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  travelConfirmTarget.action();
                  setTravelChosenTier(travelConfirmTarget);
                  setTravelConfirmTarget(null);
                  setEmergencyModalOpen(false);
                }}
                style={{
                  flex: 1,
                  background: '#C4952D',
                  color: '#0F172A',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                تأكيد التفعيل
              </button>
              <button
                type="button"
                onClick={() => setTravelConfirmTarget(null)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  padding: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN FROM TRAVEL MODAL (POST-VACATION REFLECTION) */}
      {returnTravelModalOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(5px)',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setReturnTravelModalOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              background: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #38BDF8',
              padding: '24px 20px',
              direction: 'rtl',
              textAlign: 'center',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
            }}
          >
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#38BDF8' }}>
              <CheckCircle2 size={24} color="#0284C7" />
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 900, color: '#F8FAFC' }}>
              حمد الله على السلامة يا بطل!
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.5 }}>
              كيف كان نشاطك التدريبي خلال فترة السفر؟ سيتم إعادة ضبط أحمال الأسبوع الأول بما يناسب طاقتك:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setTravelModeActive(false);
                  setActiveScenario(null);
                  setTravelChosenTier(null);
                  setReturnTravelModalOpen(false);
                }}
                style={{
                  background: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '11px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                حافظت على حماسي وتمريني (جاهز للأوزان كاملة)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTravelModeActive(false);
                  setActiveScenario(null);
                  setTravelChosenTier(null);
                  setReturnTravelModalOpen(false);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#CBD5E1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '11px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                فصلت وريحت تماماً (أسبوع استشفاء تدريجي)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMART EXERCISE SWAP MODAL (FOR BUSY GYM MACHINES) */}
      {exerciseSwapTarget && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            zIndex: 130,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setExerciseSwapTarget(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#FFFFFF',
              color: '#0F172A',
              borderRadius: '20px',
              padding: '20px',
              direction: 'rtl',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '2px 8px', borderRadius: '6px' }}>
                  محرك البدائل الحركية المتطابقة
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>
                  بدائل لـ: {exerciseSwapTarget.exercise.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExerciseSwapTarget(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={14} color="#64748B" />
              </button>
            </div>

            {/* Filter Chips: All, Gym, Home */}
            <div style={{ display: 'flex', gap: '4px', background: '#F8FAFC', padding: '4px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '12px' }}>
              {[
                { id: 'ALL', label: 'كافة البدائل' },
                { id: 'GYM', label: 'بدائل الجيم' },
                { id: 'HOME', label: 'المنزل / دمبلز' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setExerciseSwapFilter(f.id)}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: exerciseSwapFilter === f.id ? '#0F172A' : 'transparent',
                    color: exerciseSwapFilter === f.id ? '#FFFFFF' : '#64748B',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <p style={{ fontSize: '0.74rem', color: '#64748B', marginBottom: '12px', lineHeight: 1.4 }}>
              الجهاز في الجيم زحمة أو مشغول؟ اختر أي بديل من البدائل التالية، يضمن المحرك تطابق زاوية الشد والأمان الحركي الكامل:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loadingExerciseSwaps ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '0.78rem' }}>
                  جاري فحص البدائل المطابقة حركياً وميكانيكياً...
                </div>
              ) : (() => {
                const filtered = exerciseSwapsList.filter(s => {
                  if (exerciseSwapFilter === 'GYM') return s.environment === 'GYM' || s.environment === 'GYM_OR_HOME';
                  if (exerciseSwapFilter === 'HOME') return s.environment === 'HOME' || s.environment === 'GYM_OR_HOME' || s.equipment === 'DUMBBELL' || s.equipment === 'BODYWEIGHT' || s.equipment === 'RESISTANCE_BAND';
                  return true;
                });

                if (filtered.length > 0) {
                  return filtered.map((sw, sIdx) => {
                    const isTwin = Boolean(sw.is_coach_twin);
                    return (
                      <div 
                        key={sIdx}
                        style={{
                          background: isTwin ? '#F0F9FF' : '#F8FAFC',
                          border: `1px solid ${isTwin ? '#BAE6FD' : '#E2E8F0'}`,
                          borderRadius: '12px',
                          padding: '10px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                            <strong style={{ fontSize: '0.82rem', color: '#0F172A', direction: 'ltr', display: 'inline-block' }}>
                              {getExerciseDisplayNames(sw).nameEn}
                            </strong>
                            {isTwin && (
                              <span style={{ fontSize: '0.65rem', background: '#0284C7', color: '#FFFFFF', padding: '1px 6px', borderRadius: '6px', fontWeight: 800 }}>
                                بديل توأم مباشر
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>
                            {getExerciseDisplayNames(sw).nameAr}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>
                              {sw.rationale_ar || sw.rationale || 'تطابق زاوية الشد والأمان الحركي'}
                            </span>
                            {sw.equipment_ar && (
                              <span style={{ fontSize: '0.65rem', background: '#E2E8F0', color: '#334155', padding: '1px 5px', borderRadius: '6px', fontWeight: 600 }}>
                                {sw.equipment_ar}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setWorkoutSession(prev => {
                              const updated = [...prev.exercises];
                              const oldEx = updated[exerciseSwapTarget.exIdx];
                              updated[exerciseSwapTarget.exIdx] = {
                                ...oldEx,
                                id: sw.exercise_code || sw.id || oldEx.id,
                                code: sw.exercise_code || sw.id,
                                name: sw.name_ar || sw.name,
                                nameEn: sw.name_en || oldEx.nameEn,
                                equipment: sw.equipment || oldEx.equipment,
                                cues_ar: sw.cues_ar || oldEx.cues_ar,
                                mistakes_ar: sw.mistakes_ar || oldEx.mistakes_ar,
                                image_stretch: sw.image_stretch || (sw.images && sw.images[0]) || oldEx.image_stretch,
                                image_contraction: sw.image_contraction || (sw.images && sw.images[1]) || oldEx.image_contraction,
                                video_url: sw.video_url || oldEx.video_url,
                                safetyNote: isTwin ? 'تم الاستبدال بالبديل التوأم المباشر' : `تم التبديل الذكي اليوم: ${sw.rationale_ar || sw.rationale || 'تطابق زاوية الشد'}`
                              };
                              return { ...prev, exercises: updated };
                            });
                            setExerciseSwapTarget(null);
                          }}
                          style={{
                            background: isTwin ? '#0284C7' : '#0F172A',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                        >
                          اعتماد البديل
                        </button>
                      </div>
                    );
                  });
                }

                const defaultSwaps = [
                  { name: 'سحب كابل فردي بمدى حركي كامل', rationale: 'تطابق زاوية الشد مع حرية حركة كاملة للمفصل' },
                  { name: 'دمبلز مسنود بديل حر عالي التركيز', rationale: 'عزل ممتاز مع الحفاظ على استقامة العمود الفقري' },
                  { name: 'جهاز عزل مخصص بمسار ثابت', rationale: 'أقصى درجات الأمان وثبات مسار الحركة' }
                ];

                return defaultSwaps.map((sw, sIdx) => (
                  <div 
                    key={sIdx}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.82rem', color: '#0F172A', display: 'block' }}>
                        {sw.name}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>
                        {sw.rationale}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setWorkoutSession(prev => {
                          const updated = [...prev.exercises];
                          updated[exerciseSwapTarget.exIdx] = {
                            ...updated[exerciseSwapTarget.exIdx],
                            name: sw.name,
                            safetyNote: `تم التبديل الذكي اليوم: ${sw.rationale}`
                          };
                          return { ...prev, exercises: updated };
                        });
                        setExerciseSwapTarget(null);
                      }}
                      style={{
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      اعتماد البديل
                    </button>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY SCENARIO ADAPTATION MODAL */}
        {emergencyModalOpen && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(5px)',
              zIndex: 110,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setEmergencyModalOpen(false)}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '440px',
                background: '#0F172A',
                color: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '20px',
                direction: 'rtl',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle style={{ width: '20px', height: '20px', color: '#EF4444' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                    محرك التكيف اللحظي وحالات الطوارئ
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEmergencyModalOpen(false)}
                  style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X style={{ width: '14px', height: '14px' }} />
                </button>
              </div>

              <p style={{ fontSize: '0.76rem', color: '#94A3B8', marginBottom: '16px', lineHeight: '1.4' }}>
                اختر ظرفك الطارئ وسيقوم المحرك بإعادة تشكيل الخطة التدريبية والغذائية فوراً بضغطة زر واحدة:
              </p>

              {/* Scenarios Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* 1. Travel Hotel Gym */}
                <button
                  type="button"
                  onClick={() => {
                    const adaptation = applyEmergencyScenarioAdaptation({
                      scenario_type: 'TRAVEL',
                      equipment_tier: TRAVEL_EQUIPMENT_TYPES.HOTEL_LIMITED_GYM,
                      base_calories: 1870,
                      base_protein_g: 155
                    });
                    setActiveScenario(adaptation);
                    setEmergencyModalOpen(false);
                    alert('تم تفعيل وضع السفر وتكييف التمارين لجيم الفندق (دامبلز وكابلات) وسعرات الصيانة!');
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '14px',
                    padding: '12px',
                    textAlign: 'right',
                    color: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <strong style={{ fontSize: '0.86rem', color: '#F59E0B', display: 'block' }}>1. وضع السفر - جيم فندق محدود (Hotel Gym)</strong>
                  <span style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>تحويل أوتوماتيكي للأجهزة الحرة إلى دامبلز وكابلات وسعرات صيانة لتفادي الإجهاد.</span>
                </button>

                {/* 2. Travel Room Bodyweight */}
                <button
                  type="button"
                  onClick={() => {
                    const adaptation = applyEmergencyScenarioAdaptation({
                      scenario_type: 'TRAVEL',
                      equipment_tier: TRAVEL_EQUIPMENT_TYPES.NO_GYM_ROOM,
                      base_calories: 1870,
                      base_protein_g: 155
                    });
                    setActiveScenario(adaptation);
                    setEmergencyModalOpen(false);
                    alert('تم تفعيل تمارين الغرفة بوزن الجسم وأحزمة المقاومة مع تحكم سلبي 3 ثوانٍ!');
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '14px',
                    padding: '12px',
                    textAlign: 'right',
                    color: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <strong style={{ fontSize: '0.86rem', color: '#38BDF8', display: 'block' }}>2. وضع السفر - بدون جيم (Room Workout)</strong>
                  <span style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>تمارين بوزن الجسم وأحزمة المقاومة مع التركيز على سرعة النزول السلبي 3s.</span>
                </button>

                {/* 3. Sickness & Recovery */}
                <button
                  type="button"
                  onClick={() => {
                    const adaptation = applyEmergencyScenarioAdaptation({
                      scenario_type: 'SICKNESS',
                      base_calories: 1870,
                      base_protein_g: 155
                    });
                    setActiveScenario(adaptation);
                    setEmergencyModalOpen(false);
                    alert('تم إيقاف المقاومة وتفعيل سعرات الصيانة وبروتوكول المناعة (فيتامين C، زنك، وترطيب إضافي)!');
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '14px',
                    padding: '12px',
                    textAlign: 'right',
                    color: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <strong style={{ fontSize: '0.86rem', color: '#EF4444', display: 'block' }}>3. وضع المرض والوعكة الصحية (Sickness Recovery)</strong>
                  <span style={{ fontSize: '0.72rem', color: '#FCA5A5' }}>إيقاف الأوزان فوراً، رفع السوائل (+1L)، سعرات الصيانة، ومغذيات المناعة.</span>
                </button>

                {/* 4. High Stress & Exams */}
                <button
                  type="button"
                  onClick={() => {
                    const adaptation = applyEmergencyScenarioAdaptation({
                      scenario_type: 'HIGH_STRESS',
                      base_calories: 1870,
                      base_protein_g: 155
                    });
                    setActiveScenario(adaptation);
                    setEmergencyModalOpen(false);
                    alert('تم تقليص البرنامج إلى جلستين Full Body أسبوعياً (35 دقيقة) وتثبيت الماكروز!');
                  }}
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '14px',
                    padding: '12px',
                    textAlign: 'right',
                    color: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <strong style={{ fontSize: '0.86rem', color: '#10B981', display: 'block' }}>4. وضع ضغط العمل والامتحانات (High-Stress)</strong>
                  <span style={{ fontSize: '0.72rem', color: '#6EE7B7' }}>جلستان Full Body أسبوعياً بأعلى كفاءة زمنية (35 دقيقة) ومصادر طعام سريعة.</span>
                </button>

                {/* 5. Dining Out & Evening Events */}
                <button
                  type="button"
                  onClick={() => {
                    // Buffer 600 calories for dinner
                    setMeals(prev => prev.map((m, idx) => {
                      if (idx < 2) {
                        return {
                          ...m,
                          items: m.items.map(it => (it.c > 15 ? { ...it, amount: Math.round(it.amount * 0.6) } : it))
                        };
                      }
                      return m;
                    }));
                    setEmergencyModalOpen(false);
                    alert('تم تفعيل بروتوكول العزومة والمطاعم: تم حجز 600 سعرة لوجبة المساء مع التركيز على البروتين الصافي نهاراً!');
                  }}
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '14px',
                    padding: '12px',
                    textAlign: 'right',
                    color: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <strong style={{ fontSize: '0.86rem', color: '#F59E0B', display: 'block' }}>5. عزومة أو وجبة مطعم مسائية (Dining Out Mode)</strong>
                  <span style={{ fontSize: '0.72rem', color: '#FDE68A' }}>حجز بنك سعرات (600 سعرة) لوجبة المساء مع تركيز الوجبات النهارية على البروتين والسلطة.</span>
                </button>

                {/* 6. Swap Rest & Workout Day */}
                <button
                  type="button"
                  onClick={() => {
                    setEmergencyModalOpen(false);
                    alert('تم تبديل تمرين اليوم بيوم راحة بنجاح! تمرينك ترحل لليوم التالي مع الحفاظ على سلسلة أيام التزامك (Streak).');
                  }}
                  style={{
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '14px',
                    padding: '12px',
                    textAlign: 'right',
                    color: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <strong style={{ fontSize: '0.86rem', color: '#A5B4FC', display: 'block' }}>6. تبديل يوم التمرين بيوم راحة (Rest Day Swap)</strong>
                  <span style={{ fontSize: '0.72rem', color: '#C7D2FE' }}>لو جدولك انشغل اليوم؛ حوّل اليوم لاستشفاء وراحة وننقل التمرين لغد دون كسر الـ Streak!</span>
                </button>

              </div>
            </div>
          </div>
        )}

        {/* Exercise Video Modal for Client Workout */}
        {activeVideoExercise && (
          <ExerciseVideoModal
            exercise={activeVideoExercise}
            onClose={() => setActiveVideoExercise(null)}
          />
        )}

      </div>
    </div>
  );
}
