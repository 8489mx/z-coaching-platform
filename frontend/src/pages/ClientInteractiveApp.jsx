import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { extractClientFastingProfile } from '../utils/seasonalFastingRadar';
import { 
  Utensils, 
  Dumbbell, 
  Activity, 
  Check, 
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
import { getPracticalCardioPrescription, CARDIO_TYPES } from '../utils/cardioZonesEngine';
import { evaluateWeeklyCheckinAudit, CHECKIN_DECISION_CODES } from '../utils/weeklyAuditEngine';
import { applyEmergencyScenarioAdaptation, TRAVEL_EQUIPMENT_TYPES } from '../utils/emergencyScenarioEngine';
import { evaluateDoubleProgression, EXERCISE_CATEGORIES, evaluateAutoDeloadRequirement } from '../utils/progressiveOverloadEngine';
import { calculateReverseDietingStep, REVERSE_DIET_STATUS } from '../utils/reverseDietingEngine';
import { calculateNeatTitrationStep, NEAT_LEVELS } from '../utils/neatTitrationEngine';
import { convertPortionCookingYield } from '../utils/kitchenYieldEngine';
import { generateScientificRampWarmup, calculateBarbellPlates } from '../utils/warmupPlateEngine';
import { getTorqueMatchedSwaps, applyFatigueModeReduction } from '../utils/biomechanicalSwapEngine';
import { calculateDailyHydrationTarget } from '../utils/hydrationSweatEngine';
import { enqueueOfflineAction, flushPendingQueue, getQueueSyncStatus, ACTION_TYPES } from '../utils/offlineSyncEngine';
import { adaptProgramToInteractiveMeals, adaptSessionToInteractiveWorkout } from './ClientInteractiveApp/utils/programAdapters';
import ClientHeader from './ClientInteractiveApp/components/ClientHeader';
import MealsTab from './ClientInteractiveApp/components/MealsTab';
import WorkoutTab from './ClientInteractiveApp/components/WorkoutTab';
import FreeGuidesModal from './ClientInteractiveApp/components/FreeGuidesModal';
import FoodPrepModal from './ClientInteractiveApp/components/FoodPrepModal';
import MasterPdfModal from './ClientInteractiveApp/components/MasterPdfModal';
import FoodSwapModal from './ClientInteractiveApp/components/FoodSwapModal';
import ExerciseSwapModal from './ClientInteractiveApp/components/ExerciseSwapModal';

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
  const [travelConfirmTarget, setTravelConfirmTarget] = useState(null);
  const [travelChosenTier, setTravelChosenTier] = useState(null);
  const [returnTravelModalOpen, setReturnTravelModalOpen] = useState(false);
  const [exerciseSwapTarget, setExerciseSwapTarget] = useState(null);

  const [activePrepItem, setActivePrepItem] = useState(null);
  const [freeGuideModalOpen, setFreeGuideModalOpen] = useState(false);
  const [freeGuideTab, setFreeGuideTab] = useState('DRINKS');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [prehabCompleted, setPrehabCompleted] = useState(false);
  const [checkinWeight, setCheckinWeight] = useState(clientData.weight || '78.5');
  const [checkinWaist, setCheckinWaist] = useState('82.0');
  const [checkinAdherence, setCheckinAdherence] = useState(90);
  const [checkinPmsActive, setCheckinPmsActive] = useState(false);
  const [checkinAuditResult, setCheckinAuditResult] = useState(null);
  const [cardioPrescription, setCardioPrescription] = useState(() => getPracticalCardioPrescription({ type: CARDIO_TYPES.LISS_TALK_TEST }));
  const [swapMealId, setSwapMealId] = useState(null);
  const [activeVideoExercise, setActiveVideoExercise] = useState(null);

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
                {/* Top App Header & Alerts */}
        <ClientHeader
          clientData={clientData}
          syncStatus={syncStatus}
          isSyncing={isSyncing}
          handleTriggerSync={handleTriggerSync}
          setEmergencyModalOpen={setEmergencyModalOpen}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
        />


{/* MAIN BODY CONTENT */}
        <main style={{ padding: '16px', flex: 1 }}>
          
          {/* TAB 1: MEALS & SMART SWAPS */}
          {activeTab === 'meals' && (
            <MealsTab
              consumedMacros={consumedMacros}
              targetMacros={targetMacros}
              meals={meals}
              handleToggleMealCompleted={handleToggleMealCompleted}
              setActivePrepItem={setActivePrepItem}
              setActiveSwapItem={setActiveSwapItem}
              setSwapMealId={setSwapMealId}
              setFreeGuideModalOpen={setFreeGuideModalOpen}
              setPdfModalOpen={setPdfModalOpen}
              supplementsList={supplementsList}
              supplementsTaken={supplementsTaken}
              toggleSupplementTaken={toggleSupplementTaken}
            />
          )}

          {/* TAB 2: WORKOUT PLAN REFERENCE */}
          {activeTab === 'workout' && (
            <WorkoutTab
              trainingWeeks={trainingWeeks}
              currentTrainingWeek={currentTrainingWeek}
              setCurrentTrainingWeek={setCurrentTrainingWeek}
              selectedWeekData={selectedWeekData}
              workoutSession={workoutSession}
              dailyReadiness={dailyReadiness}
              handleSetDailyReadiness={handleSetDailyReadiness}
              clientData={clientData}
              prehabCompleted={prehabCompleted}
              setPrehabCompleted={setPrehabCompleted}
              cardioPrescription={cardioPrescription}
              setExerciseSwapTarget={setExerciseSwapTarget}
              exerciseWorkingWeights={exerciseWorkingWeights}
              handleUpdateExerciseWeight={handleUpdateExerciseWeight}
              handleToggleExerciseCompleted={handleToggleExerciseCompleted}
              setActiveVideoExercise={setActiveVideoExercise}
            />
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
        <FoodSwapModal
          activeSwapItem={activeSwapItem}
          onClose={() => setActiveSwapItem(null)}
          onExecuteSwap={handleExecuteSwap}
          clinicalProfile={clientData?.clinicalProfile}
        />


        {/* ZERO-CALORIE FREE BEVERAGES & SEASONINGS MODAL */}
        <FreeGuidesModal
          isOpen={freeGuideModalOpen}
          onClose={() => setFreeGuideModalOpen(false)}
          freeGuideTab={freeGuideTab}
          setFreeGuideTab={setFreeGuideTab}
        />

        {/* ACCESSIBLE HOME PREP OPTIONS MODAL */}
        <FoodPrepModal
          activePrepItem={activePrepItem}
          onClose={() => setActivePrepItem(null)}
        />

      {/* 1-CLICK MASTER PDF PLAN MODAL */}
      <MasterPdfModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        clientName={clientData?.name || 'المشترك'}
        clientCode={clientData?.code || '882'}
        packageTier={clientData?.package || 'MAX'}
        currentWeek={currentTrainingWeek}
      />

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
      <ExerciseSwapModal
        exerciseSwapTarget={exerciseSwapTarget}
        onClose={() => setExerciseSwapTarget(null)}
        setWorkoutSession={setWorkoutSession}
      />

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
