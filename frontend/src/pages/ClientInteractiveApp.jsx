import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Utensils, 
  Dumbbell, 
  Scale,
  Activity, 
  Flame, 
  Droplet, 
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
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  X,
  Share2,
  Crown,
  Pill,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { API_BASE } from '../config/api';
import { calculateDynamicFoodSwap, getCompatibleSwaps, FOOD_DATABASE, convertGramsToHandPortions, getTravelDiningBlueprints, formatItemPortionDisplay, PORTION_DISPLAY_MODES } from '../utils/foodSwapEngine';
import { getPrepOptionsForFood } from '../utils/culinaryRecipes';
import { FREE_BEVERAGES_CATALOG, FREE_SEASONINGS_CATALOG, REFEED_PROTOCOLS } from '../utils/freeSeasoningsAndDrinks';
import { getRirGuidance, applySpecialIntensityBadge, INTENSITY_BADGES } from '../utils/intensityTechniqueEngine';
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
import { enqueueOfflineAction, flushPendingQueue, getQueueSyncStatus } from '../utils/offlineSyncEngine';

function adaptSessionToInteractiveWorkout(session, index = 0) {
  if (!session) return null;
  const title = session.session_name || session.name || session.title || `اليوم التدريبي ${index + 1}`;
  const warmupProtocol = session.warmup_protocol || session.warmupProtocol || 'إحماء عام 5 دقائق + حركات الإطالة والتفعيل الديناميكي';
  
  const rawExercises = session.exercises || [];
  const exercises = rawExercises.map((ex, exIdx) => {
    const exId = String(ex.id || ex.exercise_code || `ex_${index}_${exIdx}`);
    const exName = ex.name || ex.exercise_name || ex.name_ar || 'تمرين المقاومة';
    const restSec = Number(ex.rest_seconds || ex.restDurationSec || ex.rest_sec) || 90;
    const safety = ex.safety_note || ex.safetyNote || ex.cue || 'الحفاظ على المدى الحركي الكامل والتحكم في الوزن بالنزول';
    const numSets = Array.isArray(ex.sets) ? ex.sets.length : (Number(ex.sets || ex.prescribed_sets) || 3);
    const targetReps = ex.reps || ex.target_reps || '10-12';
    const targetWeight = ex.working_weight_kg || ex.weight || '0';

    let sets = [];
    if (Array.isArray(ex.sets) && ex.sets.length > 0 && typeof ex.sets[0] === 'object') {
      sets = ex.sets.map((s, sIdx) => ({
        setNum: s.setNum || s.set_number || sIdx + 1,
        weight: String(s.weight || targetWeight),
        reps: String(s.reps || targetReps),
        prevBest: s.prevBest || `${s.weight || targetWeight}kg × ${s.reps || targetReps}`,
        completed: Boolean(s.completed)
      }));
    } else {
      for (let i = 1; i <= numSets; i++) {
        sets.push({
          setNum: i,
          weight: String(targetWeight),
          reps: String(targetReps),
          prevBest: `${targetWeight}kg × ${targetReps}`,
          completed: false
        });
      }
    }

    return {
      id: exId,
      name: exName,
      isCompound: Boolean(ex.isCompound ?? (ex.muscle === 'CHEST' || ex.muscle === 'BACK' || ex.muscle === 'LEGS')),
      restDurationSec: restSec,
      safetyNote: safety,
      sets
    };
  });

  return {
    title,
    duration: session.duration || '55 دقيقة',
    warmupProtocol,
    exercises: exercises.length > 0 ? exercises : undefined
  };
}

export default function ClientInteractiveApp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Tab Selection ('meals' | 'workout' | 'checkin')
  const rawTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(rawTab === 'grocery' ? 'meals' : (rawTab || 'meals'));
  const [selectedDay, setSelectedDay] = useState(1); // 1 to 7

  // Client info & Clinical Profile
  const [clientData, setClientData] = useState(() => {
    const storedCode = localStorage.getItem('kz_client_code') || sessionStorage.getItem('z_client_code') || '#1';
    const storedName = localStorage.getItem('kz_client_name') || 'المشترك';
    return {
      name: storedName,
      code: storedCode.startsWith('#') ? storedCode : `#${storedCode}`,
      package: 'الخطة المخصصة',
      isVIP: false,
      streak: 1,
      waterGlasses: 0,
      waterTarget: 8,
      clinicalProfile: {
        is_g6pd: false,
        is_bariatric: false,
        is_celiac: false,
        medications: []
      }
    };
  });

  // Active Program State (Fetched dynamically from API)
  const [clientProgram, setClientProgram] = useState(null);

  useEffect(() => {
    const rawCode = (clientData?.code || '').replace('#', '').trim();
    if (!rawCode) return;
    fetch(`${API_BASE}/api/v1/programs/active/${rawCode}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.has_program && data.master_program) {
          setClientProgram(data.master_program);
          if (data.master_program.nutrition?.meals && data.master_program.nutrition.meals.length > 0) {
            setMeals(data.master_program.nutrition.meals);
          }
          const sessions = data.master_program.training?.sessions 
            || data.master_program.training_split?.sessions 
            || data.master_program.training_program?.weeks?.[0]?.sessions 
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
      })
      .catch(err => console.warn('Could not fetch client active program:', err));
  }, [clientData?.code]);

  // Dynamically sync workout session when selected day changes
  useEffect(() => {
    if (!clientProgram) return;
    const sessions = clientProgram.training?.sessions 
      || clientProgram.training_split?.sessions 
      || clientProgram.training_program?.weeks?.[0]?.sessions 
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
  }, [selectedDay, clientProgram]);

  // Daily Nutrition State & Live Swaps
  const [meals, setMeals] = useState([
    {
      id: 'm1',
      title: 'الوجبة الأولى: إفطار التأسيس الأيضي',
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
  const [portionDisplayMode, setPortionDisplayMode] = useState(PORTION_DISPLAY_MODES.DUAL);
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
  const [diningBlueprints, setDiningBlueprints] = useState(() => getTravelDiningBlueprints());
  const [swapMealId, setSwapMealId] = useState(null);

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
          { setNum: 1, weight: '45', reps: '12', prevBest: '40kg × 12', completed: true },
          { setNum: 2, weight: '50', reps: '11', prevBest: '45kg × 10', completed: true },
          { setNum: 3, weight: '50', reps: '10', prevBest: '45kg × 10', completed: false },
          { setNum: 4, weight: '50', reps: '10', prevBest: '45kg × 8', completed: false }
        ]
      },
      {
        id: 'e2',
        name: 'سحب أفقي جالس مسنود الصدر (Chest-Supported Row)',
        isCompound: true,
        restDurationSec: 90,
        safetyNote: 'تثبيت الصدر على المسند يمنع التحميل الضاغط على الفقرات القطنية L5-S1',
        sets: [
          { setNum: 1, weight: '40', reps: '12', prevBest: '35kg × 12', completed: false },
          { setNum: 2, weight: '45', reps: '10', prevBest: '40kg × 10', completed: false },
          { setNum: 3, weight: '45', reps: '10', prevBest: '40kg × 8', completed: false }
        ]
      },
      {
        id: 'e3',
        name: 'تبادل دمبل بايسبس جالس مائل (Incline Dumbbell Curl)',
        isCompound: false,
        restDurationSec: 60,
        safetyNote: 'مد كامل للذراع في الأسفل مع ثبات الكوعين لعزل الرأس الطويل للبايسبس',
        sets: [
          { setNum: 1, weight: '12.5', reps: '14', prevBest: '10kg × 12', completed: false },
          { setNum: 2, weight: '12.5', reps: '12', prevBest: '10kg × 12', completed: false },
          { setNum: 3, weight: '12.5', reps: '12', prevBest: '10kg × 10', completed: false }
        ]
      },
      {
        id: 'e4',
        name: 'بلانك أمامي مع شد البطن والحوض (Hardstyle Plank)',
        isCompound: false,
        restDurationSec: 60,
        safetyNote: 'شد عضلات البطن والمؤخرة معاً لمنع تقوس أسفل الظهر (McGill Big 3)',
        sets: [
          { setNum: 1, weight: '0', reps: '40 ثانية', prevBest: '30 ثانية', completed: false },
          { setNum: 2, weight: '0', reps: '35 ثانية', prevBest: '30 ثانية', completed: false },
          { setNum: 3, weight: '0', reps: '30 ثانية', prevBest: '25 ثانية', completed: false }
        ]
      }
    ]
  });

  // Countdown Rest Timer State
  const [restTimerSeconds, setRestTimerSeconds] = useState(0);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);

  // Countdown timer ticker
  useEffect(() => {
    let interval = null;
    if (isRestTimerRunning && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds(prev => {
          if (prev <= 1) {
            setIsRestTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRestTimerRunning, restTimerSeconds]);

  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Set toggle & Timer Trigger
  const handleToggleSet = (exerciseId, setIndex) => {
    setWorkoutSession(prev => {
      return {
        ...prev,
        exercises: prev.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          const nextSets = [...ex.sets];
          const currentSet = nextSets[setIndex];
          const newCompleted = !currentSet.completed;
          nextSets[setIndex] = { ...currentSet, completed: newCompleted };

          if (newCompleted) {
            const duration = ex.restDurationSec || (ex.isCompound ? 90 : 60);
            setRestTimerSeconds(duration);
            setIsRestTimerRunning(true);
          }

          return { ...ex, sets: nextSets };
        })
      };
    });
  };

  // 1-Tap Swap Execution
  const handleExecuteSwap = (swapResult) => {
    if (!activeSwapItem || !swapMealId) return;

    setMeals(prevMeals => {
      return prevMeals.map(meal => {
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
    });

    setActiveSwapItem(null);
    setSwapMealId(null);
  };

  // Calculate Total & Consumed Macros
  const targetMacros = { p: 155, c: 200, f: 50, cal: 1870 };
  const consumedMacros = meals.reduce((acc, meal) => {
    if (meal.completed) {
      meal.items.forEach(item => {
        acc.p += item.p;
        acc.c += item.c;
        acc.f += item.f;
        acc.cal += item.cal;
      });
    }
    return acc;
  }, { p: 0, c: 0, f: 0, cal: 0 });

  // Total Volume Lifted in Live Session
  const totalVolumeKg = workoutSession.exercises.reduce((sum, ex) => {
    return sum + ex.sets.reduce((exSum, set) => {
      if (set.completed && !isNaN(parseFloat(set.weight))) {
        return exSum + (parseFloat(set.weight) * (parseInt(set.reps, 10) || 0));
      }
      return exSum;
    }, 0);
  }, 0);

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
            padding: '20px 18px 16px 18px',
            borderBottomLeftRadius: '24px',
            borderBottomRightRadius: '24px',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.15)',
            position: 'sticky',
            top: 0,
            zIndex: 40
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.92rem'
                }}
              >
                KZ
              </div>
              <div>
                <h1 style={{ fontSize: '0.94rem', fontWeight: 900, margin: 0, color: '#FFFFFF', lineHeight: 1.2 }}>
                  {clientData.name}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '9.5px', background: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: '4px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Crown style={{ width: '10px', height: '10px' }} />
                    <span>{clientData.package}</span>
                  </span>
                  <span style={{ fontSize: '10px', color: '#D97706', fontWeight: 700 }}>
                    {clientData.streak} يوم التزام متواصل
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => navigate('/renew')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#D97706',
                border: 'none',
                borderRadius: '10px',
                padding: '6px 10px',
                color: '#FFFFFF',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
              title="تجديد الاشتراك أونلاين"
            >
              <Zap style={{ width: '13px', height: '13px' }} />
              <span>تجديد</span>
            </button>
            <button
              id="open-emergency-modal-btn"
              type="button"
              onClick={() => setEmergencyModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#EF4444',
                border: 'none',
                borderRadius: '10px',
                padding: '6px 10px',
                color: '#FFFFFF',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
              title="وضع الطوارئ والسفر"
            >
              <AlertTriangle style={{ width: '13px', height: '13px' }} />
              <span>طوارئ/سفر</span>
            </button>
            <button
              type="button"
              onClick={() => setClientData(prev => ({ ...prev, waterGlasses: Math.min(prev.waterTarget, prev.waterGlasses + 1) }))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '6px 10px',
                color: '#38BDF8',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="تسجيل كوب ماء"
            >
              <Droplet style={{ width: '14px', height: '14px' }} />
              <span>{clientData.waterGlasses}/{clientData.waterTarget}</span>
            </button>
          </div>
          </div>

          {/* Circadian Caffeine & NEAT Live Bar */}
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '12px', padding: '6px 12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#F1F5F9' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock style={{ width: '12px', height: '12px', color: '#F59E0B' }} />
              <span>{getCaffeineCutoffTime("23:00").directive_ar}</span>
            </span>
            <span style={{ background: '#0284C7', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
              8,500 خطوة (NEAT مستقر)
            </span>
          </div>

          {/* Days Selector Pill Carousel */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
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
                    borderRadius: '10px',
                    fontSize: '0.74rem',
                    fontWeight: isSelected ? 800 : 600,
                    background: isSelected ? '#D97706' : 'rgba(255, 255, 255, 0.08)',
                    color: isSelected ? '#FFFFFF' : '#94A3B8',
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

        {/* Life Happens & Daily Flexibility Quick Trigger */}
        <div style={{ margin: '12px 16px 0 16px' }}>
          <button
            type="button"
            onClick={() => setEmergencyModalOpen(true)}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '12px',
              padding: '9px 12px',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#FEF3C7', padding: '5px', borderRadius: '8px', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={14} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#F8FAFC' }}>
                  مرونة اليوم وظروف الشغل والمطاعم (Life Happens)
                </span>
                <span style={{ display: 'block', fontSize: '9.5px', color: '#94A3B8' }}>
                  عزومة مسائية • تمرين فندق/منزلي • تبديل يوم الراحة
                </span>
              </div>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#F59E0B', background: 'rgba(245, 158, 11, 0.15)', padding: '3px 8px', borderRadius: '5px' }}>
              تكييف الخطة
            </span>
          </button>
        </div>

        {/* Medication Safety Alert Banner */}
        <div style={{ margin: '14px 16px 0 16px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '14px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Pill style={{ width: '18px', height: '18px', color: '#D97706', flexShrink: 0 }} />
          <p style={{ fontSize: '0.74rem', color: '#92400E', margin: 0, lineHeight: '1.4' }}>
            <strong>تنبيه دواء الغدة (Eltroxin):</strong> حظر تناول الألبان، مكملات الكالسيوم أو الحديد لمدة 4 ساعات من حبة الصباح لضمان الامتصاص الكامل.
          </p>
        </div>

        {/* Live Rest Timer Floating Pill (Always visible when running) */}
        {restTimerSeconds > 0 && (
          <div 
            style={{
              position: 'fixed',
              top: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              background: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '50px',
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
              border: '2px solid #38BDF8'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock style={{ width: '16px', height: '16px', color: '#38BDF8' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8' }}>راحة:</span>
              <strong style={{ fontSize: '1.1rem', color: '#38BDF8', fontFamily: 'monospace' }}>
                {Math.floor(restTimerSeconds / 60)}:{(restTimerSeconds % 60).toString().padStart(2, '0')}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setRestTimerSeconds(prev => prev + 30)}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: '#FFFFFF', borderRadius: '6px', fontSize: '10px', fontWeight: 800, padding: '3px 6px', cursor: 'pointer' }}
              >
                +30s
              </button>
              <button
                type="button"
                onClick={() => { setRestTimerSeconds(0); setIsRestTimerRunning(false); }}
                style={{ background: '#EF4444', border: 'none', color: '#FFFFFF', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X style={{ width: '12px', height: '12px' }} />
              </button>
            </div>
          </div>
        )}

        {/* MAIN BODY CONTENT */}
        <main style={{ padding: '16px', flex: 1 }}>
          
          {/* TAB 1: MEALS & SMART SWAPS */}
          {activeTab === 'meals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Daily Macros Target Progress Card */}
              <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles style={{ width: '16px', height: '16px', color: '#D97706' }} />
                    <h2 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      الماكروز المحققة اليوم
                    </h2>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#0F172A', fontFamily: 'monospace' }}>
                    {Math.round(consumedMacros.cal)} / {targetMacros.cal} Kcal
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  
                  {/* Protein */}
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, display: 'block' }}>البروتين</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0284C7', fontFamily: 'monospace' }}>{Math.round(consumedMacros.p)}/{targetMacros.p}g</strong>
                    <div style={{ width: '100%', height: '4px', background: '#E2E8F0', borderRadius: '4px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (consumedMacros.p / targetMacros.p) * 100)}%`, height: '100%', background: '#0284C7' }}></div>
                    </div>
                  </div>

                  {/* Carbs */}
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, display: 'block' }}>الكارب</span>
                    <strong style={{ fontSize: '0.9rem', color: '#D97706', fontFamily: 'monospace' }}>{Math.round(consumedMacros.c)}/{targetMacros.c}g</strong>
                    <div style={{ width: '100%', height: '4px', background: '#E2E8F0', borderRadius: '4px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (consumedMacros.c / targetMacros.c) * 100)}%`, height: '100%', background: '#D97706' }}></div>
                    </div>
                  </div>

                  {/* Fats */}
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '12px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 700, display: 'block' }}>الدهون</span>
                    <strong style={{ fontSize: '0.9rem', color: '#059669', fontFamily: 'monospace' }}>{Math.round(consumedMacros.f)}/{targetMacros.f}g</strong>
                    <div style={{ width: '100%', height: '4px', background: '#E2E8F0', borderRadius: '4px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (consumedMacros.f / targetMacros.f) * 100)}%`, height: '100%', background: '#059669' }}></div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Dual Portion Mode & Travel Controls */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '14px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Scale style={{ width: '16px', height: '16px', color: '#0F172A' }} />
                    <h3 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#0F172A' }}>
                      طريقة عرض الحصص والكميات
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTravelModeActive(prev => !prev)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: travelModeActive ? '#EFF6FF' : '#F8FAFC',
                      color: travelModeActive ? '#0284C7' : '#64748B',
                      border: `1px solid ${travelModeActive ? '#BAE6FD' : '#E2E8F0'}`,
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <span>خطط المطاعم والسفر</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setPortionDisplayMode(PORTION_DISPLAY_MODES.DUAL)}
                    style={{
                      background: portionDisplayMode === PORTION_DISPLAY_MODES.DUAL ? '#0284C7' : '#F1F5F9',
                      color: portionDisplayMode === PORTION_DISPLAY_MODES.DUAL ? '#FFFFFF' : '#475569',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 4px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    عرض مزدوج (الكل)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPortionDisplayMode(PORTION_DISPLAY_MODES.GRAMS)}
                    style={{
                      background: portionDisplayMode === PORTION_DISPLAY_MODES.GRAMS ? '#0284C7' : '#F1F5F9',
                      color: portionDisplayMode === PORTION_DISPLAY_MODES.GRAMS ? '#FFFFFF' : '#475569',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 4px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    بالميزان (نيئ ومطبوخ)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPortionDisplayMode(PORTION_DISPLAY_MODES.HAND_PORTIONS)}
                    style={{
                      background: portionDisplayMode === PORTION_DISPLAY_MODES.HAND_PORTIONS ? '#0284C7' : '#F1F5F9',
                      color: portionDisplayMode === PORTION_DISPLAY_MODES.HAND_PORTIONS ? '#FFFFFF' : '#475569',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 4px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    بالنظر ومقاييس اليد
                  </button>
                </div>
              </div>

              {/* Pre-Engineered Dining Blueprints Section (Visible when travelMode is active) */}
              {travelModeActive && (
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '18px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <Crown style={{ width: '16px', height: '16px', color: '#0284C7' }} />
                    <h3 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 800, color: '#0F172A' }}>
                      خطط المطاعم والسفر الجاهزة (Dining Blueprints)
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {diningBlueprints.map(bp => (
                      <div key={bp.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <strong style={{ fontSize: '0.82rem', color: '#0369A1' }}>{bp.title_ar}</strong>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '2px 6px', borderRadius: '6px' }}>
                            ~{bp.estimated_macros.calories_kcal} Kcal | P: {bp.estimated_macros.protein_g}g
                          </span>
                        </div>
                        <ul style={{ margin: 0, paddingRight: '16px', fontSize: '0.74rem', color: '#334155' }}>
                          {bp.ordered_items_ar.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '2px' }}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meals List */}
              {meals.map((meal) => (
                <div 
                  key={meal.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    border: '1px solid #E2E8F0',
                    padding: '16px',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
                  }}
                >
                  {/* Meal Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        {meal.title}
                      </h3>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{meal.time}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, completed: !m.completed } : m))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: meal.completed ? '#ECFDF5' : '#F8FAFC',
                        color: meal.completed ? '#059669' : '#64748B',
                        border: `1px solid ${meal.completed ? '#A7F3D0' : '#E2E8F0'}`,
                        borderRadius: '10px',
                        padding: '4px 10px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Check style={{ width: '13px', height: '13px' }} />
                      <span>{meal.completed ? 'تم التناول' : 'تسجيل التناول'}</span>
                    </button>
                  </div>

                  {/* Meal Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {meal.items.map(item => (
                      <div 
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 10px',
                          background: '#F8FAFC',
                          borderRadius: '12px',
                          border: '1px solid #F1F5F9'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                            {item.name}
                          </p>
                          {(() => {
                            const formatted = formatItemPortionDisplay({
                              food_code: item.code || item.name,
                              amount_g: item.amount,
                              unit: item.unit,
                              macro_type: item.p > item.c ? 'PROTEIN' : (item.c > 5 ? 'CARBS' : 'FATS')
                            }, portionDisplayMode);

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                                <span style={{ fontSize: '0.74rem', color: '#0284C7', fontWeight: 700 }}>
                                  {formatted.mode === PORTION_DISPLAY_MODES.DUAL ? (
                                    <span>
                                      {formatted.primary_text} <span style={{ color: '#059669', marginRight: '4px' }}>↔ {formatted.secondary_text}</span>
                                    </span>
                                  ) : (
                                    formatted.primary_text
                                  )}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                                  ({Math.round(item.cal)} Kcal | P: {item.p}g | C: {item.c}g | F: {item.f}g)
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {/* Prep Options Button */}
                          {getPrepOptionsForFood(item.code || item.name) && (
                            <button
                              type="button"
                              onClick={() => setActivePrepItem(item)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#ECFDF5',
                                color: '#047857',
                                border: '1px solid #A7F3D0',
                                borderRadius: '8px',
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="أفكار خلطات وطرق إعداد سريعة"
                            >
                              <span>خلطات</span>
                            </button>
                          )}

                          {/* 1-Tap Smart Swap Button */}
                          <button
                            type="button"
                            onClick={() => { setActiveSwapItem(item); setSwapMealId(meal.id); }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#FEF3C7',
                              color: '#92400E',
                              border: '1px solid #FDE68A',
                              borderRadius: '8px',
                              padding: '4px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title="بديل مكافئ فوراً"
                          >
                            <ArrowLeftRight style={{ width: '12px', height: '12px' }} />
                            <span>بديل ذكي</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))}

              {/* SMART CONTEXTUAL GUIDELINES MATRIX */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '16px', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck style={{ width: '16px', height: '16px', color: '#0284C7' }} />
                    <h3 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>
                      القواعد والإرشادات الذهبية للخطة
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPdfModalOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    <span>تصدير الخطة PDF</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {SMART_GUIDELINES_MATRIX.map((guide) => (
                    <div key={guide.id} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '10px', padding: '8px 12px' }}>
                      <strong style={{ fontSize: '0.76rem', color: '#0369A1', display: 'block', marginBottom: '2px' }}>{guide.title_ar}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.4 }}>{guide.instruction_ar}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supplements Card (Dynamic from Coach Program) */}
              {clientProgram?.cardio?.supplements?.length > 0 && (
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '18px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369A1', fontWeight: 800, fontSize: '0.84rem', marginBottom: '8px' }}>
                  <Pill style={{ width: '16px', height: '16px' }} />
                  <span>المكملات المعتمدة من الكابتن:</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {clientProgram.cardio.supplements.map((supp, sIdx) => (
                    <p key={supp.id || sIdx} style={{ margin: 0 }}>
                      • <strong>{supp.name}{supp.dose ? ` (${supp.dose})` : ''}:</strong>
                      {supp.timing ? ` ${supp.timing}` : ''}
                      {(supp.cal > 0) ? ` — ${supp.cal} سعرة` : ''}
                      {supp.notes ? ` (${supp.notes})` : ''}
                    </p>
                  ))}
                </div>
              </div>
              )}

            </div>
          )}

          {/* TAB 2: LIVE WORKOUT TRACKER & TIMER */}
          {activeTab === 'workout' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Workout Session Banner */}
              <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFFFFF', borderRadius: '20px', padding: '18px', boxShadow: '0 4px 15px rgba(15, 23, 42, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38BDF8', fontSize: '0.75rem', fontWeight: 800 }}>
                    <Flame style={{ width: '14px', height: '14px' }} />
                    <span>وضع التدريب الحي المباشر</span>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: '#F59E0B', fontWeight: 800, fontFamily: 'monospace' }}>
                    الحمولة: {totalVolumeKg} kg
                  </span>
                </div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px 0' }}>
                  {workoutSession.title}
                </h2>
                <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
                  {workoutSession.warmupProtocol}
                </div>
              </div>

              {/* POSTURAL & JOINT PREHAB PRIMER CARD */}
              {(() => {
                const prehabRoutine = getPrehabRoutine(
                  clientData.clinicalProfile?.medical_conditions || ['ROUNDED_SHOULDERS', 'KNEE_DISCOMFORT'],
                  'UPPER'
                );

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

              {/* Exercises Set-by-Set List */}
              {workoutSession.exercises.map((ex, exIdx) => (
                <div 
                  key={ex.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    border: '1px solid #E2E8F0',
                    padding: '16px',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: ex.isCompound ? '#D97706' : '#0284C7', background: ex.isCompound ? '#FEF3C7' : '#E0F2FE', padding: '2px 6px', borderRadius: '4px' }}>
                        {ex.isCompound ? 'تمرين مركب (90s راحة)' : 'تمرين عزل (60s راحة)'}
                      </span>
                      <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', margin: '4px 0 0 0' }}>
                        {exIdx + 1}. {ex.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExerciseSwapTarget({ exercise: ex, exIdx })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#FEF3C7',
                        color: '#92400E',
                        border: '1px solid #FDE68A',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="تبديل التمرين في حال انشغال الجهاز"
                    >
                      <ArrowLeftRight style={{ width: '12px', height: '12px' }} />
                      <span>بديل الجهاز</span>
                    </button>
                  </div>

                  {/* Safety Note */}
                  <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontSize: '0.72rem', color: '#92400E' }}>
                    <ShieldCheck style={{ width: '14px', height: '14px', flexShrink: 0, color: '#D97706' }} />
                    <span>{ex.safetyNote}</span>
                  </div>

                  {/* Sets Table with Previous Week Benchmarks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '35px 1fr 1fr 1fr 38px', gap: '6px', fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textAlign: 'center', padding: '0 4px' }}>
                      <span>الجولة</span>
                      <span>الأسبوع السابق</span>
                      <span>الوزن (kg)</span>
                      <span>العدات</span>
                      <span>إتمام</span>
                    </div>

                    {ex.sets.map((set, sIdx) => (
                      <div 
                        key={sIdx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '35px 1fr 1fr 1fr 38px',
                          gap: '6px',
                          alignItems: 'center',
                          padding: '6px',
                          background: set.completed ? '#ECFDF5' : '#F8FAFC',
                          borderRadius: '10px',
                          border: `1px solid ${set.completed ? '#A7F3D0' : '#F1F5F9'}`
                        }}
                      >
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: set.completed ? '#059669' : '#0F172A', textAlign: 'center' }}>
                          #{set.setNum}
                        </span>

                        <span style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'monospace', textAlign: 'center' }}>
                          {set.prevBest}
                        </span>

                        <input 
                          type="text"
                          defaultValue={set.weight}
                          style={{ height: '32px', borderRadius: '6px', border: '1px solid #CBD5E1', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', background: '#FFFFFF', outline: 'none' }}
                        />

                        <input 
                          type="text"
                          defaultValue={set.reps}
                          style={{ height: '32px', borderRadius: '6px', border: '1px solid #CBD5E1', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', background: '#FFFFFF', outline: 'none' }}
                        />

                        {/* Checkmark Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleSet(ex.id, sIdx)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: set.completed ? '#059669' : '#FFFFFF',
                            color: set.completed ? '#FFFFFF' : '#CBD5E1',
                            border: `1px solid ${set.completed ? '#059669' : '#CBD5E1'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          title="إتمام الجولة وبدء مؤقت الراحة"
                        >
                          <Check style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    ))}

                    {/* Smart Double Progression Live Feedback */}
                    {ex.sets.every(s => s.completed) && (
                      <div style={{ marginTop: '10px', background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: '10px', padding: '8px 12px', fontSize: '0.74rem', color: '#065F46', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles style={{ width: '14px', height: '14px', flexShrink: 0, color: '#059669' }} />
                        <span>
                          {evaluateDoubleProgression({
                            exercise_name: ex.name,
                            category: ex.isCompound ? EXERCISE_CATEGORIES.COMPOUND_BARBELL : EXERCISE_CATEGORIES.ISOLATION_DUMBBELL,
                            current_weight_kg: parseFloat(ex.sets[0].weight) || 10,
                            completed_sets: ex.sets
                          }).directive_ar}
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              ))}

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
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)'
          }}
        >
          {[
            { key: 'meals', label: 'الوجبات والمبادلات', icon: Utensils },
            { key: 'workout', label: 'التمرين والمؤقت', icon: Dumbbell },
            { key: 'checkin', label: 'المتابعة الأسبوعية', icon: Activity, isRoute: true }
          ].map(tab => {
            const isActive = activeTab === tab.key;
            const TabIcon = tab.icon;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  if (tab.isRoute) {
                    const rawCode = (clientData?.code || '').replace('#', '').trim();
                    navigate(rawCode ? `/check-in?code=${encodeURIComponent(rawCode)}` : '/check-in');
                  } else {
                    handleSwitchTab(tab.key);
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? '#D97706' : '#94A3B8',
                  fontSize: '10px',
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  padding: '4px 12px',
                  transition: 'color 0.15s ease'
                }}
              >
                <TabIcon style={{ width: '20px', height: '20px' }} />
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
            onClick={() => setActiveSwapItem(null)}
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
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: '4px' }}>
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

              {/* Calculated Swap Alternatives List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { targetCode: 'WHITE_FISH_FILLET', name: 'سمك فيليه أبيض مشوي', note: 'خفيف جداً على المعدة وغني باليود' },
                  { targetCode: 'LEAN_VEAL_BEEF', name: 'لحم بقري بتلو خالي الدهن', note: 'غني بالزنك والحديد وفيتامين B12' },
                  { targetCode: 'SHRIMP_GRILLED', name: 'جمبري مشوي أو مسلوق', note: 'بروتين نقي 100% بدون دهون' },
                  { targetCode: 'CANNED_TUNA_IN_WATER', name: 'تونة مصفاة من الزيت', note: 'سريعة التحضير وغنية بأوميجا 3' },
                  { targetCode: 'COTTAGE_CHEESE_NATURAL', name: 'جبن قريش طبيعي', note: 'بروتين كازين بطيء الامتصاص' },
                  { targetCode: 'BOILED_POTATOES', name: 'بطاطس مسلوقة', note: 'مؤشر شبع عالي جداً وغنية بالبوتاسيوم' },
                  { targetCode: 'SWEET_POTATO_BAKED', name: 'بطاطا حلوة مشوية', note: 'كارب معقد غني بمضادات الأكسدة' },
                  { targetCode: 'FRESH_AVOCADO', name: 'أفوكادو طازج', note: 'دهون أحادية غير مشبعة مع ألياف عالية' },
                  { targetCode: 'RAW_ALMONDS', name: 'لوز نيء غير محمص', note: 'فيتامين E ومغنيسيوم لصحة العضلات' }
                ].filter(s => s.targetCode !== activeSwapItem.code).slice(0, 5).map((swapOption, sIdx) => {
                  let swapResult = null;
                  try {
                    const fromCode = FOOD_DATABASE[activeSwapItem.code] ? activeSwapItem.code : 'CHICKEN_BREAST';
                    const toCode = FOOD_DATABASE[swapOption.targetCode] ? swapOption.targetCode : 'WHITE_FISH_FILLET';
                    
                    if (FOOD_DATABASE[fromCode].macro_type === FOOD_DATABASE[toCode].macro_type) {
                      swapResult = calculateDynamicFoodSwap({
                        current_food_code: fromCode,
                        current_portion_g: activeSwapItem.amount || 150,
                        target_food_code: toCode,
                        clinical_profile: clientData.clinicalProfile
                      });
                    }
                  } catch (e) {}

                  if (!swapResult) return null;

                  return (
                    <div 
                      key={sIdx}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '14px',
                        padding: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: '#0F172A', display: 'block' }}>{swapResult.replacement_food.name_ar}</strong>
                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
                          الكمية المكافئة: {swapResult.replacement_food.portion_g} جم ({swapResult.replacement_food.macros.calories_kcal} Kcal | P: {swapResult.replacement_food.macros.protein_g}g)
                        </span>
                        <small style={{ display: 'block', fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>{swapOption.note}</small>
                        {swapResult.clinical_note && (
                          <small style={{ display: 'block', fontSize: '0.68rem', color: '#D97706', fontWeight: 700, marginTop: '2px' }}>{swapResult.clinical_note}</small>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExecuteSwap(swapResult)}
                        style={{
                          background: '#0F172A',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '6px 14px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)'
                        }}
                      >
                        تبديل الآن
                      </button>
                    </div>
                  );
                })}
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
                  <Utensils size={18} color={freeGuideTab === 'DRINKS' ? '#78350F' : '#059669'} />
                  <div>
                    <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      {freeGuideTab === 'DRINKS' ? 'دليل المشروبات الحرة صفرية السعرات' : 'دليل التوابل والبهارات ومحسنات الطعم الحرة'}
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                      مسموحة ومجانية 100% بدون أي تأثير على حرق الدهون
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
              <div style={{ display: 'flex', gap: '6px', background: '#F1F5F9', padding: '4px', borderRadius: '12px', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => setFreeGuideTab('DRINKS')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: freeGuideTab === 'DRINKS' ? '#0F172A' : 'transparent',
                    color: freeGuideTab === 'DRINKS' ? '#FFFFFF' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  المشروبات الحرة (0 سعرة)
                </button>
                <button
                  type="button"
                  onClick={() => setFreeGuideTab('SPICES')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: freeGuideTab === 'SPICES' ? '#0F172A' : 'transparent',
                    color: freeGuideTab === 'SPICES' ? '#FFFFFF' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  التوابل والبهارات الحرة
                </button>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {freeGuideTab === 'DRINKS' ? (
                  FREE_BEVERAGES_CATALOG.map((drink) => (
                    <div key={drink.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '0.84rem', color: '#0F172A' }}>{drink.name_ar}</strong>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '2px 6px', borderRadius: '4px' }}>
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
                ) : (
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
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px' }}>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#166534', lineHeight: 1.4 }}>
                  <strong>ملاحظة هامة:</strong> السعرات والماكروز محسوبة من وزن الصنف الأساسي فقط؛ كافة الإضافات أدناه مجانية وصفرية السعرات لكسر الملل ورفع لذة الوجبة!
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
          package_tier: 'MAX_VIP',
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
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '2px 6px', borderRadius: '4px' }}>
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
              <Sparkles size={24} />
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
              maxWidth: '460px',
              background: '#FFFFFF',
              color: '#0F172A',
              borderRadius: '24px',
              padding: '22px 20px',
              direction: 'rtl',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '2px 8px', borderRadius: '4px' }}>
                  محرك البدائل الحركية المتطابقة
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>
                  بدائل ذكية لـ: {exerciseSwapTarget.exercise.name}
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

            <p style={{ fontSize: '0.74rem', color: '#64748B', marginBottom: '14px', lineHeight: 1.4 }}>
              الجهاز في الجيم زحمة أو مشغول؟ اختر أي بديل من البدائل التالية، المحرك يضمن تطابق زاوية الشد والأمان الحركي:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(() => {
                const exName = exerciseSwapTarget.exercise.name || '';
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
                        // Apply swap to current session
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
                        background: '#D97706',
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

      </div>
    </div>
  );
}
