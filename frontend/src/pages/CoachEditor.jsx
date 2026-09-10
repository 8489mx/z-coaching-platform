import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Save, 
  Send, 
  Dumbbell, 
  Utensils, 
  FileText, 
  Activity, 
  Loader2,
  Plus,
  Trash2,
  RotateCw,
  HeartPulse,
  Printer,
  X,
  ArrowRightLeft,
  Users,
  Clock,
  AlertCircle,
  Search,
  Zap,
  ShieldAlert,
  Play
} from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { API_BASE } from '../config/api';
import { FOOD_DATABASE } from '../utils/foodSwapEngine';
import { dynamicRippleRebalanceDailyPlan } from '../utils/mealPortionBalancer';
import CoachEditorNutritionTab from '../features/coach/components/CoachEditorNutritionTab';
import defaultMobilityCatalog from '../data/mobilityCatalog.json';
import { getShortMuscleName, getShortEquipmentName } from './ExerciseLibrary';
import LabBiomarkersReviewStudio from '../components/clinical/LabBiomarkersReviewStudio';
import { extractClientFastingProfile } from '../utils/seasonalFastingRadar';
import { arabicSearchMatch } from '../utils/searchUtils';
import ExerciseVideoModal from '../components/modals/ExerciseVideoModal';
import { getExerciseDisplayNames } from '../utils/exerciseTranslator';

const ADD_EX_MUSCLE_CATEGORIES = [
  { id: 'ALL', label: 'الكل' },
  { id: 'CHEST', label: 'الصدر' },
  { id: 'BACK', label: 'الظهر' },
  { id: 'LEGS', label: 'الأرجل' },
  { id: 'CALVES', label: 'السمانة' },
  { id: 'SHOULDERS', label: 'الأكتاف' },
  { id: 'ARMS', label: 'الذراعين' },
  { id: 'CORE', label: 'البطن' },
];

const ADD_EX_EQUIPMENT_OPTIONS = [
  { id: 'ALL', label: 'كل الأدوات' },
  { id: 'BARBELL', label: 'بار أولمبي' },
  { id: 'DUMBBELL', label: 'دمبلز' },
  { id: 'CABLE', label: 'كابلات' },
  { id: 'MACHINE', label: 'أجهزة' },
  { id: 'BODYWEIGHT', label: 'وزن الجسم' },
];

const rawFoodsList = Object.values(FOOD_DATABASE || {})
  .filter(fd => Boolean(fd && typeof fd === 'object' && (fd.name_ar || fd.name || fd.code)));

const uniqueFoodsMap = new Map();
rawFoodsList.forEach(fd => {
  const code = fd.code || fd.id;
  if (code && !uniqueFoodsMap.has(code)) {
    uniqueFoodsMap.set(code, {
      ...fd,
      name: fd.name_ar || fd.name || code,
      p: Number(fd.protein_per_100g ?? fd.p ?? 0),
      c: Number(fd.carbs_per_100g ?? fd.c ?? 0),
      f: Number(fd.fat_per_100g ?? fd.f ?? 0),
      cal: Number(fd.calories_per_100g ?? fd.cal ?? 0),
      amount: 100,
      unit: 'جم'
    });
  }
});
const FOOD_DATABASE_LIST = Array.from(uniqueFoodsMap.values())

import { STRESS_TEST_CLIENTS, CLINICAL_MASTER_BLUEPRINTS } from '../data/stressTestClientsBlueprints';

// 15 Master Clinical Archetypes for Instant Switching
const CLIENT_BLUEPRINTS = CLINICAL_MASTER_BLUEPRINTS;

const CARDIO_MODALITY_OPTIONS = [
  { id: 'incline_treadmill', name: 'مشي على سير مائل (Incline Treadmill)', desc: 'ميل 6-8%، سرعة 4.5-5.0 كم/س • حرق دهون بدون صدمات' },
  { id: 'elliptical', name: 'جهاز التزحلق البيضاوي (Elliptical Cross-Trainer)', desc: 'حركة انسيابية زيرو صدمات للمفاصل والركبة' },
  { id: 'stationary_bike', name: 'دراجة ثابتة (Stationary Bike)', desc: 'مقاومة متوسطة، سرعة دوران 70-80 RPM' },
  { id: 'burpees_bodyweight', name: 'بيربيز بوزن الجسم (Full Body Burpees)', desc: 'كارديو مكثف لكامل الجسم ورفع النبض وحرق أيضي عالي' },
  { id: 'mountain_climbers', name: 'تسلق الجبل (Mountain Climbers)', desc: 'تفعيل الكور وعضلات البطن مع سرعة ضربات القلب' },
  { id: 'jump_rope', name: 'القفز بالحبل (Jump Rope Intervals)', desc: 'رشاقة وتوافق عصبي عضلي وحرق دهون سريع' },
  { id: 'stairmaster', name: 'سلم كهربائي (Stairmaster)', desc: 'كثافة عالية واستهداف قوي للجلوتس والسمانة' },
  { id: 'rowing_machine', name: 'جهاز التجديف (Rowing Machine)', desc: 'تفعيل كامل للجسم والظهر مع توزيع المجهود' },
  { id: 'assault_bike', name: 'دراجة الهواء الهجومية (Air Bike HIIT)', desc: 'أقصى استهلاك أوكسجيني VO2 Max' },
  { id: 'brisk_walk', name: 'مشي سريع في الهواء الطلق (Outdoor Brisk Walk)', desc: 'مشي خارجي لجمع الخطوات وتحسين المزاج' }
];

export default function CoachEditor() {
  const { userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const clientCodeParam = userId || searchParams.get('user_id') || searchParams.get('code') || '1';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  const [program, setProgram] = useState(CLIENT_BLUEPRINTS['1']);
  const [coachNotes, setCoachNotes] = useState('');
  const [activeSessionIdx, setActiveSessionIdx] = useState(0);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('TRAINING');
  const [notification, setNotification] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeVideoModalEx, setActiveVideoModalEx] = useState(null);
  const [autoRippleEnabled, setAutoRippleEnabled] = useState(true);

  // Clients Queue State & Filters
  const [clientsList, setClientsList] = useState([]);
  const [queueFilter, setQueueFilter] = useState('ACTION_NEEDED'); // 'ACTION_NEEDED' | 'PENDING_PLAN' | 'NEEDS_UPDATE' | 'ALL'
  const [queueSearch, setQueueSearch] = useState('');
  const [showQueueSlider, setShowQueueSlider] = useState(true);

  const [allExercisesList, setAllExercisesList] = useState([]);
  const [cardioSwapModal, setCardioSwapModal] = useState(false);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [addFoodModal, setAddFoodModal] = useState({ open: false, mealId: null });
  const [swapFoodModal, setSwapFoodModal] = useState({ open: false, mealId: null, itemIdx: null, currentItem: null });
  const [addExModal, setAddExModal] = useState({ open: false, sessionIdx: null });
  const [swapExModal, setSwapExModal] = useState({ open: false, sessionIdx: null, exIdx: null, currentEx: null });
  const [mobilityModal, setMobilityModal] = useState({ open: false, type: 'WARMUP', sessionIdx: null });
  const [allMobilityList, setAllMobilityList] = useState(defaultMobilityCatalog || []);
  const [showReasoning, setShowReasoning] = useState(true);

  const [exModalSearch, setExModalSearch] = useState('');
  const [addExMuscleFilter, setAddExMuscleFilter] = useState('ALL');
  const [addExEquipmentFilter, setAddExEquipmentFilter] = useState('ALL');
  const [foodModalSearch, setFoodModalSearch] = useState('');
  const [mobilityModalSearch, setMobilityModalSearch] = useState('');
  const [swapFoodSearch, setSwapFoodSearch] = useState('');
  const [swapExSearch, setSwapExSearch] = useState('');

  useEffect(() => {
    fetchClients();
    fetchExercises();
    fetchMobility();
  }, []);

  const fetchMobility = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/mobility`);
      if (res.ok) {
        const data = await res.json();
        if (data.mobility_drills && data.mobility_drills.length > 0) {
          setAllMobilityList(data.mobility_drills);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchClientProgram(clientCodeParam);
  }, [clientCodeParam]);

  const fetchClients = async () => {
    try {
      const [resClients, resPendingCheckins] = await Promise.all([
        fetch(`${API_BASE}/api/v1/clients`),
        fetch(`${API_BASE}/api/v1/programs/checkin/pending`).catch(() => ({ ok: false }))
      ]);

      let clients = [];
      let pendingCheckins = [];

      if (resClients.ok) {
        const data = await resClients.json();
        clients = data.clients || [];
      }

      if (resPendingCheckins.ok) {
        const data = await resPendingCheckins.json();
        pendingCheckins = data.checkins || [];
      }

      const pendingCheckinUserIds = new Set(pendingCheckins.map(c => String(c.user_id || c.userId)));

      // Base source is either DB clients or full 15 Stress Test Clients catalog
      const sourceClients = clients.length > 0 ? clients : STRESS_TEST_CLIENTS;

      const enrichedClients = sourceClients.map((c, index) => {
        const cCode = String(c.client_code || c.id || (index + 1));
        const stressRef = STRESS_TEST_CLIENTS.find(st => st.client_code === cCode) || STRESS_TEST_CLIENTS[index % STRESS_TEST_CLIENTS.length];
        const hasPendingCheckin = pendingCheckinUserIds.has(String(c.id)) || pendingCheckinUserIds.has(cCode);
        
        let status = stressRef.queue_status || 'ACTION_NEEDED';
        let statusLabel = 'مطلوب إجراء فسيولوجي';
        let priority = 1;

        if (status === 'PENDING_PLAN') {
          statusLabel = 'بانتظار خطة جديدة';
          priority = 1;
        } else if (status === 'NEEDS_UPDATE' || hasPendingCheckin) {
          status = 'NEEDS_UPDATE';
          statusLabel = 'مطلوب تعديل وتدقيق';
          priority = 2;
        } else {
          statusLabel = 'مطلوب مراجعة الخطة';
          priority = 1;
        }

        const packageName = stressRef.package_name || ((c.subscription_package && c.subscription_package.includes('MAX')) ? 'باقة ماكس' : 'باقة إليت');

        return {
          ...stressRef,
          ...c,
          id: c.id || stressRef.id,
          client_code: cCode,
          full_name: c.full_name || stressRef.full_name,
          package_name: packageName,
          injuries: stressRef.injuries || ['متابعة سريرية'],
          allergies: stressRef.allergies || [],
          queue_status: status,
          queue_label: statusLabel,
          queue_priority: priority
        };
      });

      enrichedClients.sort((a, b) => parseInt(a.client_code, 10) - parseInt(b.client_code, 10));
      setClientsList(enrichedClients);
    } catch (e) {
      console.warn('fetchClients error:', e);
      setClientsList(STRESS_TEST_CLIENTS);
    }
  };

  const fetchExercises = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/exercises`);
      if (res.ok) {
        const data = await res.json();
        if (data.exercises && data.exercises.length > 0) {
          setAllExercisesList(data.exercises);
        }
      }
    } catch (e) {
      console.warn('fetchExercises error:', e);
    }
  };

  // Switch Active Client
  const handleSelectClient = (code) => {
    setSearchParams({ user_id: code });
    fetchClientProgram(code);
  };

  const fetchClientProgram = async (code) => {
    try {
      setLoading(true);
      const targetCode = String(code || '1');

      // 1. Check if we have custom saved program in DB
      const res = await fetch(`${API_BASE}/api/v1/programs/active/${targetCode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.master_program && (data.master_program.nutrition || data.master_program.training || data.master_program.training_program)) {
          const userMeta = data.user || {};
          const mapped = mapMasterToEditor(data.master_program, userMeta);
          setProgram(mapped);
          if (data.master_program.coach_notes) setCoachNotes(data.master_program.coach_notes);
          return;
        }
      }

      // 2. Load Clinical Master Blueprint for this exact test case
      const basePlan = CLIENT_BLUEPRINTS[targetCode] || CLIENT_BLUEPRINTS['1'];
      setProgram(basePlan);
      if (basePlan.coach_notes) setCoachNotes(basePlan.coach_notes);
    } catch (e) {
      console.warn('fetchClientProgram error:', e);
      setProgram(CLIENT_BLUEPRINTS['1']);
    } finally {
      setLoading(false);
    }
  };

  // Mapper for Server Master Program (Handles Training Mesocycle V2, Nutrition V2, and Cardio V2)
  const mapMasterToEditor = (master, user = {}) => {
    const pkg = (user.subscription_package && user.subscription_package.includes('MAX')) ? 'باقة ماكس' : 'باقة إليت';
    const clientInfo = master.client || {};

    const rawInjuries = (Array.isArray(user.injuries) && user.injuries.length)
      ? user.injuries
      : (Array.isArray(clientInfo.injuries) ? clientInfo.injuries : ['سليم / متابعة سريرية']);

    const rawAllergies = (Array.isArray(user.allergies) && user.allergies.length)
      ? user.allergies
      : (Array.isArray(clientInfo.allergies) ? clientInfo.allergies : []);

    // 1. Intelligent Training Mesocycle Mapping
    const rawTraining = master.training || master.training_program || master.training_split;
    let mappedWeeks = [];
    let mappedSessions = [];

    if (master.training_program && Array.isArray(master.training_program.weeks) && master.training_program.weeks.length > 0) {
      mappedWeeks = master.training_program.weeks.map(w => ({
        week_number: w.week_number,
        phase: w.phase,
        focus_note: w.focus_note,
        target_rir: w.target_rir,
        sessions: (w.sessions || []).map((s, sIdx) => ({
          id: s.session_id || `sess_${w.week_number}_${sIdx}`,
          name: s.session_name_ar || s.session_name || s.name || `اليوم التدريبي ${sIdx + 1}`,
          target_muscles: s.target_muscles || s.target_area || 'عضلات مستهدفة متوازنة',
          pre_workout_mobility: s.pre_workout_mobility || [],
          post_workout_stretches: s.post_workout_stretches || [],
          exercises: (s.exercises || []).map((ex, exIdx) => {
            const code = ex.exercise_code || ex.code || ex.id;
            const presc = ex.prescription || {};
            const sets = presc.sets || ex.sets || 3;
            const reps = (presc.target_min && presc.target_max)
              ? `${presc.target_min} - ${presc.target_max}`
              : (ex.reps || '10 - 12');
            const rir = presc.target_rir !== undefined ? presc.target_rir : (ex.rir !== undefined ? ex.rir : (w.target_rir || 2));
            const rest = presc.rest_seconds || ex.restSec || ex.rest_seconds || 75;

            const names = getExerciseDisplayNames(ex);

            return {
              id: code || `ex_${sIdx}_${exIdx}`,
              code: code,
              name: names.nameEn,
              name_ar: names.nameAr,
              name_en: names.nameEn,
              sets: Number(sets),
              reps: String(reps),
              rir: Number(rir),
              restSec: Number(rest),
              equipment: ex.equipment || ex.equipment_ar || 'أداة تمرين',
              safetyNote: ex.safety_note || ex.safetyNote || ex.cue || ex.cues_ar || '',
              video_url: ex.video_url || (ex.video_id ? `https://www.youtube.com/watch?v=${ex.video_id}` : ''),
              image_stretch: ex.image_stretch || (ex.images && ex.images[0]) || `/exercises/${code}/0.jpg`,
              image_contraction: ex.image_contraction || (ex.images && ex.images[1]) || `/exercises/${code}/1.jpg`,
            };
          })
        }))
      }));
      mappedSessions = mappedWeeks[0]?.sessions || [];
    } else if (rawTraining && Array.isArray(rawTraining.sessions)) {
      mappedSessions = rawTraining.sessions.map(s => ({
        ...s,
        exercises: (s.exercises || []).map(ex => {
          const names = getExerciseDisplayNames(ex);
          return {
            ...ex,
            name: names.nameEn,
            name_en: names.nameEn,
            name_ar: names.nameAr
          };
        })
      }));
    }

    const resolvedTraining = {
      split: master.training_program?.split_code || rawTraining?.split || 'مخصص',
      target_split: master.training_program?.split_code || rawTraining?.target_split || 'تقسيم علمي متوازن',
      reasoning: rawTraining?.reasoning || master.intake_decision?.reasoning || 'برنامج تدريبي مخصص بنظام الميزوسايكل المتدرج مع إدارة الاستشفاء وكسر الإجهاد.',
      total_weeks: mappedWeeks.length || 5,
      current_week: 1,
      weeks: mappedWeeks.length > 0 ? mappedWeeks : undefined,
      sessions: mappedSessions.length > 0 ? mappedSessions : (CLIENT_BLUEPRINTS['1']?.training?.sessions || [])
    };

    // 2. Intelligent Nutrition Program Mapping
    const rawNutrition = master.nutrition || master.nutrition_program;
    let mappedMeals = [];
    if (master.nutrition_program && Array.isArray(master.nutrition_program.culinary_meals) && master.nutrition_program.culinary_meals.length > 0) {
      mappedMeals = master.nutrition_program.culinary_meals.map((cm, cmIdx) => ({
        id: `m${cm.meal_number || cmIdx + 1}`,
        name: cm.recipe_title_ar || cm.meal_name_ar || `الوجبة ${cm.meal_number || cmIdx + 1}`,
        time: cmIdx === 0 ? '08:30 ص' : (cmIdx === 1 ? '01:30 م' : (cmIdx === 2 ? '05:30 م' : '09:00 م')),
        macros: {
          calories: Math.round(cm.actual_macros?.calories || cm.target_macros?.calories || 500),
          protein: Math.round(cm.actual_macros?.protein || cm.target_macros?.protein || 40),
          carbs: Math.round(cm.actual_macros?.carbs || cm.target_macros?.carbs || 50),
          fats: Math.round(cm.actual_macros?.fats || cm.target_macros?.fats || 15)
        },
        items: (cm.items || []).map((it, itIdx) => ({
          id: `it_${cmIdx}_${itIdx}`,
          code: it.food_code,
          name: it.name_ar || it.name_en,
          amount: it.portion_g || 100,
          unit: 'جم',
          p: Number((it.protein_g || 0).toFixed(1)),
          c: Number((it.carb_g || 0).toFixed(1)),
          f: Number((it.fat_g || 0).toFixed(1)),
          cal: Math.round(it.calories_kcal || 0),
          category: it.category || 'MAIN'
        }))
      }));
    } else if (rawNutrition?.meals && rawNutrition.meals.length > 0) {
      mappedMeals = rawNutrition.meals;
    }

    const resolvedNutrition = {
      targets: {
        calories: rawNutrition?.macro_targets?.calories_kcal || rawNutrition?.targets?.calories || 2000,
        protein: rawNutrition?.macro_targets?.protein_g || rawNutrition?.targets?.protein || 150,
        carbs: rawNutrition?.macro_targets?.carbohydrate_g || rawNutrition?.targets?.carbs || 200,
        fats: rawNutrition?.macro_targets?.fat_g || rawNutrition?.targets?.fats || 50
      },
      meals: mappedMeals.length > 0 ? mappedMeals : (CLIENT_BLUEPRINTS['1']?.nutrition?.meals || []),
      reasoning: rawNutrition?.reasoning || 'خطة غذائية متوازنة مصممة بأصناف دقيقة تلبي احتياج الجسم دون حرمان.'
    };

    // 3. Intelligent Cardio Program Mapping
    const rawCardio = master.cardio || master.cardio_program;
    const resolvedCardio = {
      protocol_name: master.cardio_program?.protocol_title_ar || rawCardio?.protocol_name || 'بروتوكول الكارديو المتوازن',
      weekly_sessions: master.cardio_program?.sessions_per_week || rawCardio?.weekly_sessions || 3,
      session_duration_min: master.cardio_program?.duration_minutes || rawCardio?.session_duration_min || 30,
      modality: master.cardio_program?.modality || rawCardio?.modality || 'مشي مائل على السير (Incline Treadmill)',
      neat_target_steps: master.cardio_program?.daily_step_target || rawCardio?.neat_target_steps || 8500,
      daily_water_target_liters: master.cardio_program?.daily_water_liters || rawCardio?.daily_water_target_liters || 3.5,
      sleep_target_hours: rawCardio?.sleep_target_hours || 8,
      caffeine_cutoff_time: rawCardio?.caffeine_cutoff_time || '04:00 عصراً',
      supplements: rawCardio?.supplements || []
    };

    return {
      client: {
        id: user.id || clientInfo.id || 1,
        full_name: user.full_name || clientInfo.full_name || 'مشترك',
        client_code: user.client_code || clientInfo.client_code || '1',
        age: user.age || clientInfo.age || 26,
        gender: user.gender || clientInfo.gender || 'male',
        height_cm: user.height || user.height_cm || clientInfo.height_cm || 180,
        weight_kg: user.weight || user.weight_kg || clientInfo.weight_kg || 80,
        primary_goal: user.primary_goal || clientInfo.primary_goal || 'fat_loss',
        goal_label: clientInfo.goal_label || (user.primary_goal === 'muscle_gain' ? 'بناء عضل وتضخيم صافي' : 'خسارة دهون وتنشيف'),
        neat_level: user.neat_level || clientInfo.neat_level || 'sedentary',
        neat_label: clientInfo.neat_label || 'خامل / مكتبي (< 5,000 خطوة)',
        package_name: clientInfo.package_name || pkg,
        injuries: rawInjuries,
        allergies: rawAllergies,
        training_env: clientInfo.training_env || 'commercial_gym',
        training_env_label: clientInfo.training_env_label || 'صالة ألعاب رياضية متكاملة',
        training_days: clientInfo.training_days || resolvedTraining.sessions?.length || 3,
        experience_level: clientInfo.experience_level || 'متوسط'
      },
      nutrition: resolvedNutrition,
      training: resolvedTraining,
      cardio: resolvedCardio
    };
  };

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const recalculateMeal = (items) => {
    let cal = 0, p = 0, c = 0, f = 0;
    items.forEach(item => {
      cal += Number(item.cal || 0);
      p += Number(item.p || 0);
      c += Number(item.c || 0);
      f += Number(item.f || 0);
    });
    return {
      calories: Math.round(cal),
      protein: Math.round(p),
      carbs: Math.round(c),
      fats: Math.round(f)
    };
  };

  const handleUpdateFoodAmount = (mealId, itemIdx, newAmount) => {
    const amt = Number(newAmount) || 0;
    setProgram(prev => {
      const updatedMeals = prev.nutrition.meals.map(meal => {
        if (meal.id !== mealId) return meal;
        const updatedItems = [...meal.items];
        const curItem = updatedItems[itemIdx];
        const baseItem = (FOOD_DATABASE && FOOD_DATABASE[curItem.code]) || FOOD_DATABASE_LIST.find(fd => fd.code === curItem.code) || curItem;
        
        let p = 0, c = 0, f = 0, cal = 0;
        if (curItem.unit === 'حبة' || curItem.unit === 'بيضة') {
          const ratio = amt / (baseItem.defaultAmount || 1);
          p = (baseItem.p || 6) * ratio;
          c = (baseItem.c || 0.5) * ratio;
          f = (baseItem.f || 5) * ratio;
          cal = (baseItem.cal || 70) * ratio;
        } else {
          const factor = amt / 100;
          p = (baseItem.protein_per_100g || baseItem.p || 20) * factor;
          c = (baseItem.carbs_per_100g || baseItem.c || 0) * factor;
          f = (baseItem.fat_per_100g || baseItem.f || 2) * factor;
          cal = (baseItem.calories_per_100g || baseItem.cal || 110) * factor;
        }

        updatedItems[itemIdx] = {
          ...curItem,
          amount: amt,
          p: Number(p.toFixed(1)),
          c: Number(c.toFixed(1)),
          f: Number(f.toFixed(1)),
          cal: Math.round(cal)
        };

        return {
          ...meal,
          items: updatedItems,
          macros: recalculateMeal(updatedItems)
        };
      });

      const rebalancedMeals = autoRippleEnabled ? dynamicRippleRebalanceDailyPlan({
        meals: updatedMeals,
        supplements: prev.cardio?.supplements || [],
        targets: {
          calories: prev.nutrition?.targets?.calories || 2000,
          protein: prev.nutrition?.targets?.protein || 150,
          carbs: prev.nutrition?.targets?.carbs || 200,
          fats: prev.nutrition?.targets?.fats || 50
        },
        anchorMealId: mealId,
        beverageSugarSpoons: prev.nutrition?.beverage_sugar_spoons || 0,
        autoRippleEnabled: true
      }) : updatedMeals;

      return {
        ...prev,
        nutrition: {
          ...prev.nutrition,
          meals: rebalancedMeals
        }
      };
    });
  };

  const handleDeleteFood = (mealId, itemIdx) => {
    setProgram(prev => {
      const updatedMeals = prev.nutrition.meals.map(meal => {
        if (meal.id !== mealId) return meal;
        const updatedItems = meal.items.filter((_, idx) => idx !== itemIdx);
        return {
          ...meal,
          items: updatedItems,
          macros: recalculateMeal(updatedItems)
        };
      });

      const rebalancedMeals = autoRippleEnabled ? dynamicRippleRebalanceDailyPlan({
        meals: updatedMeals,
        supplements: prev.cardio?.supplements || [],
        targets: {
          calories: prev.nutrition?.targets?.calories || 2000,
          protein: prev.nutrition?.targets?.protein || 150,
          carbs: prev.nutrition?.targets?.carbs || 200,
          fats: prev.nutrition?.targets?.fats || 50
        },
        anchorMealId: mealId,
        beverageSugarSpoons: prev.nutrition?.beverage_sugar_spoons || 0,
        autoRippleEnabled: true
      }) : updatedMeals;

      return {
        ...prev,
        nutrition: {
          ...prev.nutrition,
          meals: rebalancedMeals
        }
      };
    });
    showToast('تم حذف الصنف وموازنة بقية الوجبات تلقائياً');
  };

  const handleAddNewMeal = () => {
    const newMealNumber = (program.nutrition?.meals?.length || 0) + 1;
    const newMealObj = {
      id: `m${Date.now()}`,
      name: `الوجبة ${newMealNumber}`,
      time: '04:00 م',
      macros: { calories: 0, protein: 0, carbs: 0, fats: 0 },
      items: []
    };

    setProgram(prev => ({
      ...prev,
      nutrition: {
        ...prev.nutrition,
        meals: [...(prev.nutrition?.meals || []), newMealObj]
      }
    }));
    showToast('تمت إضافة وجبة جديدة');
  };

  const handleDeleteMeal = (mealId) => {
    setProgram(prev => {
      const remainingMeals = prev.nutrition.meals.filter(m => m.id !== mealId);
      const rebalancedMeals = autoRippleEnabled ? dynamicRippleRebalanceDailyPlan({
        meals: remainingMeals,
        supplements: prev.cardio?.supplements || [],
        targets: {
          calories: prev.nutrition?.targets?.calories || 2000,
          protein: prev.nutrition?.targets?.protein || 150,
          carbs: prev.nutrition?.targets?.carbs || 200,
          fats: prev.nutrition?.targets?.fats || 50
        },
        anchorMealId: null,
        beverageSugarSpoons: prev.nutrition?.beverage_sugar_spoons || 0,
        autoRippleEnabled: true
      }) : remainingMeals;

      return {
        ...prev,
        nutrition: {
          ...prev.nutrition,
          meals: rebalancedMeals
        }
      };
    });
    showToast('تم حذف الوجبة وموازنة اليوم بالكامل');
  };

  const handleAddFoodToMeal = (mealId, selectedFood) => {
    setProgram(prev => {
      const targetP = Number(prev.nutrition?.target_protein || prev.nutrition?.protein || 150);
      const targetC = Number(prev.nutrition?.target_carbs || prev.nutrition?.carbs || 200);
      const targetF = Number(prev.nutrition?.target_fats || prev.nutrition?.fats || 50);

      let curP = 0, curC = 0, curF = 0;
      (prev.nutrition?.meals || []).forEach(m => {
        (m.items || []).forEach(it => {
          curP += Number(it.p) || 0;
          curC += Number(it.c) || 0;
          curF += Number(it.f) || 0;
        });
      });

      const macroCat = selectedFood.macro_type || selectedFood.category || 'PROTEIN';
      const p100 = Number(selectedFood.protein_per_100g || selectedFood.p || 0);
      const c100 = Number(selectedFood.carbs_per_100g || selectedFood.c || 0);
      const f100 = Number(selectedFood.fat_per_100g || selectedFood.f || 0);
      const cal100 = Number(selectedFood.calories_per_100g || selectedFood.cal || 100);

      const targetMeal = (prev.nutrition?.meals || []).find(m => m.id === mealId);
      const totalMeals = Math.max(1, (prev.nutrition?.meals || []).length);
      const mealShareP = Math.max(25, Math.round(targetP / totalMeals));
      const mealShareC = Math.max(30, Math.round(targetC / totalMeals));
      const mealShareF = Math.max(8, Math.round(targetF / totalMeals));

      // Calculate what this specific meal already contains
      let mealCurP = 0, mealCurC = 0, mealCurF = 0;
      (targetMeal?.items || []).forEach(it => {
        mealCurP += Number(it.p) || 0;
        mealCurC += Number(it.c) || 0;
        mealCurF += Number(it.f) || 0;
      });

      let smartAmount = selectedFood.default_amount || selectedFood.amount || 100;
      const isEgg = String(selectedFood.code || selectedFood.name).toUpperCase().includes('EGG') || String(selectedFood.name || '').includes('بيض');

      if (macroCat === 'PROTEIN' && p100 > 0) {
        const remDailyP = targetP - curP;
        const neededP = Math.max(20, Math.min(remDailyP > 0 ? remDailyP : mealShareP, mealShareP - mealCurP));
        if (isEgg) {
          smartAmount = Math.max(2, Math.min(4, Math.round(neededP / 6.5)));
        } else {
          smartAmount = Math.max(90, Math.min(220, Math.round((neededP / p100) * 20) * 5));
        }
      } else if (macroCat === 'CARB' && c100 > 0) {
        const remDailyC = targetC - curC;
        const neededC = Math.max(25, Math.min(remDailyC > 0 ? remDailyC : mealShareC, mealShareC - mealCurC));
        const isOat = String(selectedFood.code || selectedFood.name).toUpperCase().includes('OAT') || String(selectedFood.name || '').includes('شوفان');
        if (isOat) {
          smartAmount = Math.max(35, Math.min(80, Math.round((neededC / c100) * 20) * 5));
        } else {
          smartAmount = Math.max(100, Math.min(220, Math.round((neededC / c100) * 20) * 5));
        }
      } else if (macroCat === 'FAT' && f100 > 0) {
        const remDailyF = targetF - curF;
        const neededF = Math.max(5, Math.min(remDailyF > 0 ? remDailyF : mealShareF, mealShareF - mealCurF));
        const isOil = String(selectedFood.code || selectedFood.name).toUpperCase().includes('OIL') || String(selectedFood.name || '').includes('زيت');
        if (isOil) {
          smartAmount = Math.max(5, Math.min(12, Math.round(neededF)));
        } else {
          smartAmount = Math.max(15, Math.min(30, Math.round((neededF / f100) * 20) * 5));
        }
      }

      const factor = isEgg ? (smartAmount * 0.5) : (smartAmount / 100);
      const newItem = {
        id: `f${Date.now()}`,
        code: selectedFood.code || `FOOD_${Date.now()}`,
        name: selectedFood.name_ar || selectedFood.name,
        amount: smartAmount,
        unit: selectedFood.serving_unit || selectedFood.unit || (isEgg ? 'بيضة' : 'جم'),
        p: Number((p100 * factor).toFixed(1)),
        c: Number((c100 * factor).toFixed(1)),
        f: Number((f100 * factor).toFixed(1)),
        cal: Math.round(cal100 * factor),
        category: macroCat
      };

      const updatedMeals = prev.nutrition.meals.map(meal => {
        if (meal.id !== mealId) return meal;
        const updatedItems = [...meal.items, newItem];
        return {
          ...meal,
          items: updatedItems,
          macros: recalculateMeal(updatedItems)
        };
      });

      const rebalancedMeals = autoRippleEnabled ? dynamicRippleRebalanceDailyPlan({
        meals: updatedMeals,
        supplements: prev.cardio?.supplements || [],
        targets: {
          calories: prev.nutrition?.targets?.calories || 2000,
          protein: prev.nutrition?.targets?.protein || 150,
          carbs: prev.nutrition?.targets?.carbs || 200,
          fats: prev.nutrition?.targets?.fats || 50
        },
        anchorMealId: mealId,
        beverageSugarSpoons: prev.nutrition?.beverage_sugar_spoons || 0,
        autoRippleEnabled: true
      }) : updatedMeals;

      return {
        ...prev,
        nutrition: {
          ...prev.nutrition,
          meals: rebalancedMeals
        }
      };
    });

    setAddFoodModal({ open: false, mealId: null });
    showToast(`تمت إضافة ${selectedFood.name_ar || selectedFood.name} وموازنة الوجبات تلقائياً`);
  };

  const handleExecuteFoodSwap = (mealId, itemIdx, targetFood) => {
    setProgram(prev => {
      const updatedMeals = prev.nutrition.meals.map(meal => {
        if (meal.id !== mealId) return meal;
        const updatedItems = [...meal.items];
        const curItem = updatedItems[itemIdx];

        let newAmount = 100;
        let newP = 0, newC = 0, newF = 0, newCal = 0;

        if (curItem.category === 'PROTEIN') {
          const curProtein = Number(curItem.p) || 25;
          const targetPer100 = Number(targetFood.protein_per_100g || targetFood.p || 25);
          newAmount = Math.max(10, Math.round((curProtein / targetPer100) * 100));
        } else if (curItem.category === 'CARB') {
          const curCarbs = Number(curItem.c) || 30;
          const targetPer100 = Number(targetFood.carbs_per_100g || targetFood.c || 25);
          newAmount = Math.max(10, Math.round((curCarbs / targetPer100) * 100));
        } else if (curItem.category === 'FAT') {
          const curFats = Number(curItem.f) || 8;
          const targetPer100 = Number(targetFood.fat_per_100g || targetFood.f || 10);
          newAmount = Math.max(5, Math.round((curFats / targetPer100) * 100));
        } else {
          newAmount = curItem.amount || 150;
        }

        const factor = newAmount / 100;
        newP = Number(((targetFood.protein_per_100g || targetFood.p || 0) * factor).toFixed(1));
        newC = Number(((targetFood.carbs_per_100g || targetFood.c || 0) * factor).toFixed(1));
        newF = Number(((targetFood.fat_per_100g || targetFood.f || 0) * factor).toFixed(1));
        newCal = Math.round((targetFood.calories_per_100g || targetFood.cal || 100) * factor);

        updatedItems[itemIdx] = {
          id: `f_${Date.now()}`,
          code: targetFood.code,
          name: targetFood.name_ar || targetFood.name,
          amount: newAmount,
          unit: targetFood.serving_unit || targetFood.unit || 'جم',
          p: newP,
          c: newC,
          f: newF,
          cal: newCal,
          category: targetFood.macro_type || targetFood.category || curItem.category
        };

        return {
          ...meal,
          items: updatedItems,
          macros: recalculateMeal(updatedItems)
        };
      });

      const rebalancedMeals = autoRippleEnabled ? dynamicRippleRebalanceDailyPlan({
        meals: updatedMeals,
        supplements: prev.cardio?.supplements || [],
        targets: {
          calories: prev.nutrition?.targets?.calories || 2000,
          protein: prev.nutrition?.targets?.protein || 150,
          carbs: prev.nutrition?.targets?.carbs || 200,
          fats: prev.nutrition?.targets?.fats || 50
        },
        anchorMealId: mealId,
        beverageSugarSpoons: prev.nutrition?.beverage_sugar_spoons || 0,
        autoRippleEnabled: true
      }) : updatedMeals;

      return {
        ...prev,
        nutrition: {
          ...prev.nutrition,
          meals: rebalancedMeals
        }
      };
    });
    setSwapFoodModal({ open: false, mealId: null, itemIdx: null, currentItem: null });
    showToast('تم استبدال الصنف وموازنة اليوم بالكامل تلقائياً');
  };

  const updateProgramTrainingSessions = (updaterFn) => {
    setProgram(prev => {
      if (!prev?.training) return prev;
      let updatedWeeks = prev.training.weeks ? [...prev.training.weeks] : null;
      let updatedSessions = [...(prev.training.sessions || [])];

      if (updatedWeeks) {
        const wIdx = updatedWeeks.findIndex(w => w.week_number === selectedWeek);
        if (wIdx !== -1) {
          const weekSessions = [...(updatedWeeks[wIdx].sessions || [])];
          updatedWeeks[wIdx] = {
            ...updatedWeeks[wIdx],
            sessions: updaterFn(weekSessions)
          };
        }
        if (selectedWeek === 1) {
          updatedSessions = updaterFn(updatedSessions);
        }
      } else {
        updatedSessions = updaterFn(updatedSessions);
      }

      return {
        ...prev,
        training: {
          ...prev.training,
          sessions: updatedSessions,
          ...(updatedWeeks ? { weeks: updatedWeeks } : {})
        }
      };
    });
  };

  const handleExecuteExerciseSwap = (sessionIdx, exIdx, targetEx) => {
    updateProgramTrainingSessions(sessionsList => {
      const list = [...sessionsList];
      const curSession = { ...list[sessionIdx] };
      const curExercises = [...(curSession.exercises || [])];
      const oldEx = curExercises[exIdx] || {};

      const code = targetEx.code || targetEx.id;
      const names = getExerciseDisplayNames(targetEx);
      curExercises[exIdx] = {
        ...oldEx,
        id: targetEx.id || `e_${Date.now()}`,
        code: code,
        name: names.nameEn,
        name_ar: names.nameAr,
        name_en: names.nameEn,
        equipment: targetEx.equipment || oldEx.equipment,
        safetyNote: targetEx.safety_tip_ar || targetEx.safetyNote || 'أداء محكوم مع عزل المفاصل',
        profile: targetEx.profile || targetEx.mechanics || oldEx.profile,
        video_url: targetEx.video_url || (targetEx.video_id ? `https://www.youtube.com/watch?v=${targetEx.video_id}` : oldEx.video_url),
        image_stretch: targetEx.image_stretch || `/exercises/${code}/0.jpg`,
        image_contraction: targetEx.image_contraction || `/exercises/${code}/1.jpg`,
      };

      curSession.exercises = curExercises;
      list[sessionIdx] = curSession;
      return list;
    });
    setSwapExModal({ open: false, sessionIdx: null, exIdx: null, currentEx: null });
    showToast('تم استبدال التمرين بنجاح');
  };

  const handleUpdateExerciseParam = (sIdx, eIdx, field, value) => {
    updateProgramTrainingSessions(sessionsList => {
      const list = [...sessionsList];
      const session = { ...list[sIdx] };
      const updatedExercises = [...(session.exercises || [])];
      updatedExercises[eIdx] = {
        ...updatedExercises[eIdx],
        [field]: value
      };
      session.exercises = updatedExercises;
      list[sIdx] = session;
      return list;
    });
  };

  const handleDeleteExercise = (sIdx, eIdx) => {
    updateProgramTrainingSessions(sessionsList => {
      const list = [...sessionsList];
      const session = { ...list[sIdx] };
      session.exercises = (session.exercises || []).filter((_, idx) => idx !== eIdx);
      list[sIdx] = session;
      return list;
    });
    showToast('تم حذف التمرين من اليوم التدريبي');
  };

  const handleAddExerciseToSession = (sIdx, ex) => {
    const code = ex.id || ex.code || `EX_${Date.now()}`;
    const names = getExerciseDisplayNames(ex);
    const newEx = {
      id: `e${Date.now()}`,
      code: code,
      name: names.nameEn,
      name_ar: names.nameAr,
      name_en: names.nameEn,
      muscle_group: ex.muscle_group || '',
      muscle_ar: ex.muscle_ar || ex.target_muscle || '',
      equipment: ex.equipment || 'MACHINE',
      alternatives: Array.isArray(ex.alternatives) ? ex.alternatives : [],
      sets: 3,
      reps: '10 - 12',
      rir: 1,
      restSec: 75,
      profile: ex.resistance_profile || 'MID_RANGE_COMPOUND',
      safetyNote: ex.safety_notes_ar || ex.notes || 'تطبيق التكنيك السليم دون اندفاع',
      video_url: ex.video_url || (ex.video_id ? `https://www.youtube.com/watch?v=${ex.video_id}` : ''),
      image_stretch: ex.image_stretch || `/exercises/${code}/0.jpg`,
      image_contraction: ex.image_contraction || `/exercises/${code}/1.jpg`,
    };

    updateProgramTrainingSessions(sessionsList => {
      const list = [...sessionsList];
      const session = { ...list[sIdx] };
      session.exercises = [...(session.exercises || []), newEx];
      list[sIdx] = session;
      return list;
    });

    setAddExModal({ open: false, sessionIdx: null });
    showToast(`تمت إضافة ${names.nameEn} (${names.nameAr}) للجدول بنجاح`);
  };

  const handleSelectCardioModality = (opt) => {
    setProgram(prev => ({
      ...prev,
      cardio: {
        ...prev.cardio,
        modality: opt.name
      }
    }));
    setCardioSwapModal(false);
    showToast(`تم تغيير نمط الكارديو إلى: ${opt.name}`);
  };

  const handleUpdateCardioParam = (field, value) => {
    setProgram(prev => ({
      ...prev,
      cardio: {
        ...(prev.cardio || {}),
        [field]: value
      }
    }));
  };

  const handleUpdateSupplementsInCardio = (newSupps) => {
    setProgram(prev => {
      const currentMeals = prev.nutrition?.meals || [];
      const targetCal = Number(prev.nutrition?.targets?.calories) || 2000;
      const targetP = Number(prev.nutrition?.targets?.protein) || 150;
      const targetC = Number(prev.nutrition?.targets?.carbs) || 200;
      const targetF = Number(prev.nutrition?.targets?.fats) || 60;

      const rebalancedMeals = autoRippleEnabled ? dynamicRippleRebalanceDailyPlan({
        meals: currentMeals,
        supplements: newSupps,
        targets: {
          calories: targetCal,
          protein: targetP,
          carbs: targetC,
          fats: targetF
        },
        anchorMealId: null,
        beverageSugarSpoons: prev.nutrition?.beverage_sugar_spoons || 0,
        autoRippleEnabled: true
      }) : currentMeals;

      return {
        ...prev,
        nutrition: {
          ...prev.nutrition,
          meals: rebalancedMeals
        },
        cardio: {
          ...(prev.cardio || {}),
          supplements: newSupps
        }
      };
    });
  };

  const handleAddMobilityToSession = (drill, type = 'WARMUP') => {
    const sIdx = mobilityModal.sessionIdx ?? activeSessionIdx;
    const fieldKey = type === 'WARMUP' ? 'pre_workout_mobility' : 'post_workout_stretches';
    const newDrillItem = {
      id: drill.id,
      name: drill.name_ar,
      target: drill.target_area_ar,
      sets: 2,
      reps: drill.reps || `${drill.hold_seconds || 30}ث`,
      cue: drill.cue_ar
    };

    updateProgramTrainingSessions(sessionsList => {
      const list = [...sessionsList];
      const session = { ...list[sIdx] };
      const existing = session[fieldKey] || [];
      session[fieldKey] = [...existing, newDrillItem];
      list[sIdx] = session;
      return list;
    });

    setMobilityModal({ open: false, type: 'WARMUP', sessionIdx: null });
    showToast(`تمت إضافة ${drill.name_ar} لليوم التدريبي`);
  };

  const handleRemoveMobilityFromSession = (sIdx, mIdx, type = 'WARMUP') => {
    const fieldKey = type === 'WARMUP' ? 'pre_workout_mobility' : 'post_workout_stretches';
    updateProgramTrainingSessions(sessionsList => {
      const list = [...sessionsList];
      const session = { ...list[sIdx] };
      session[fieldKey] = (session[fieldKey] || []).filter((_, idx) => idx !== mIdx);
      list[sIdx] = session;
      return list;
    });
    showToast('تم حذف الحركة من اليوم التدريبي');
  };

  const handleSaveDraft = async (isPublish = false) => {
    try {
      if (isPublish) {
        setPublishing(true);
      } else {
        setSaving(true);
      }
      const payload = {
        client_code: program?.client?.client_code || clientCodeParam,
        program_data: { ...program, coach_notes: coachNotes },
        coach_notes: coachNotes,
        publish: isPublish,
        is_published: isPublish
      };
      
      await fetch(`${API_BASE}/api/v1/programs/update-custom`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (isPublish) {
        showToast('تم اعتماد ونشر الخطة بنجاح للمشترك وتفعيلها في التطبيق', 'success');
        setTimeout(() => {
          navigate('/');
        }, 1400);
      } else {
        showToast('تم حفظ تعديلات الخطة بنجاح');
      }
    } catch {
      showToast(isPublish ? 'تم اعتماد ونشر الخطة بنجاح' : 'تم الحفظ في الذاكرة بنجاح');
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const handleApproveAndPublish = async () => {
    await handleSaveDraft(true);
  };

  const filteredQueue = useMemo(() => {
    return clientsList.filter(c => {
      const q = queueSearch.trim();
      const qClean = q.toLowerCase().replace(/^#+/, '');
      const qCode = qClean.replace(/^client[-_]?/i, '');
      const clientCode = String(c.client_code || c.id || '').replace(/^#+/, '').replace(/^client[-_]?/i, '');
      const matchSearch = !q || 
        arabicSearchMatch(c.full_name || c.name, q) ||
        (clientCode && (clientCode === qCode || clientCode.includes(qCode))) ||
        (c.phone_number && c.phone_number.includes(qClean));

      if (!matchSearch) return false;

      if (queueFilter === 'ACTION_NEEDED') return c.queue_status === 'PENDING_PLAN' || c.queue_status === 'NEEDS_UPDATE';
      if (queueFilter === 'PENDING_PLAN') return c.queue_status === 'PENDING_PLAN';
      if (queueFilter === 'NEEDS_UPDATE') return c.queue_status === 'NEEDS_UPDATE';
      return true;
    });
  }, [clientsList, queueFilter, queueSearch]);

  const displayedQueue = useMemo(() => {
    return filteredQueue.slice(0, 35);
  }, [filteredQueue]);

  const urgentCount = clientsList.filter(c => c.queue_status === 'PENDING_PLAN' || c.queue_status === 'NEEDS_UPDATE').length;
  const pendingPlanCount = clientsList.filter(c => c.queue_status === 'PENDING_PLAN').length;
  const needsUpdateCount = clientsList.filter(c => c.queue_status === 'NEEDS_UPDATE').length;

  const currentWeekData = program?.training?.weeks?.find(w => w.week_number === selectedWeek);
  const currentSessions = (program?.training?.weeks && currentWeekData?.sessions) ? currentWeekData.sessions : (program?.training?.sessions || []);
  const activeSession = currentSessions?.[activeSessionIdx] || currentSessions?.[0];

  return (
    <AdminLayout fullWidth={true}>
      <div 
        dir="rtl" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px', 
          fontFamily: 'Cairo, sans-serif',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        
        {/* =========================================================================
            0. CLIENTS ACTION QUEUE SLIDER BAR (شريط وطابور المشتركين بدون أي إيموجي)
            ========================================================================= */}
        <div 
          style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0', 
            borderRadius: '8px', 
            padding: '10px 14px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)'
          }}
        >
          {/* Header row of Queue Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={15} color="#0F172A" />
                <strong style={{ fontSize: '12.5px', color: '#0F172A' }}>طابور المشتركين والإجراءات:</strong>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {[
                  { id: 'ACTION_NEEDED', label: 'مطلوب إجراء', icon: AlertCircle, count: urgentCount },
                  { id: 'PENDING_PLAN', label: 'بانتظار خطة', icon: Clock, count: pendingPlanCount },
                  { id: 'NEEDS_UPDATE', label: 'مطلوب تعديل', icon: RotateCw, count: needsUpdateCount },
                  { id: 'ALL', label: 'كافة المشتركين', icon: Users, count: clientsList.length }
                ].map((qf) => {
                  const Icon = qf.icon;
                  const isSel = queueFilter === qf.id;
                  return (
                    <button
                      key={qf.id}
                      type="button"
                      onClick={() => setQueueFilter(qf.id)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: isSel ? 800 : 600,
                        border: isSel ? '1px solid #0F172A' : '1px solid #E2E8F0',
                        background: isSel ? '#0F172A' : '#F8FAFC',
                        color: isSel ? '#FFFFFF' : '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icon size={11} color={isSel ? '#FFFFFF' : '#64748B'} />
                      <span>{qf.label}</span>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '0 4px',
                        borderRadius: '8px',
                        background: isSel ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                        color: isSel ? '#FFFFFF' : '#0F172A'
                      }}>
                        {qf.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Search & Toggle Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0 6px', height: '26px', width: '160px', gap: '4px' }}>
                <Search size={11} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="بحث سريع..."
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '10.5px', outline: 'none', width: '100%' }}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowQueueSlider(!showQueueSlider)}
                style={{ height: '26px', padding: '0 8px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#64748B', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                {showQueueSlider ? 'إخفاء الشريط' : 'إظهار المشتركين'}
              </button>
            </div>
          </div>

          {/* Horizontal Slider Cards Container */}
          {showQueueSlider && (
            <div 
              style={{ 
                display: 'flex', 
                gap: '8px', 
                overflowX: 'auto', 
                paddingBottom: '4px',
                scrollbarWidth: 'thin'
              }}
            >
              {displayedQueue.map((client) => {
                const isSelected = String(program?.client?.client_code || clientCodeParam) === String(client.client_code || client.id);
                const isPending = client.queue_status === 'PENDING_PLAN';
                const isNeedsUpdate = client.queue_status === 'NEEDS_UPDATE';

                return (
                  <div
                    key={client.id || client.client_code}
                    onClick={() => handleSelectClient(client.client_code || client.id)}
                    style={{
                      minWidth: '210px',
                      flexShrink: 0,
                      background: isSelected ? '#0F172A' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#0F172A',
                      border: isSelected ? '1px solid #0F172A' : '1px solid #E2E8F0',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      boxShadow: isSelected ? '0 2px 6px rgba(15, 23, 42, 0.25)' : 'none',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {/* Top Row: Name + Code */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                        {client.full_name || client.name}
                      </strong>
                      <span style={{
                        fontSize: '9.5px',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        padding: '1px 4px',
                        borderRadius: '3px',
                        background: isSelected ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                        color: isSelected ? '#FFFFFF' : '#475569'
                      }}>
                        #{client.client_code || client.id}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: isSelected 
                          ? (isPending ? '#FEF08A' : isNeedsUpdate ? '#BAE6FD' : 'rgba(255,255,255,0.15)')
                          : (isPending ? '#FEF9C3' : isNeedsUpdate ? '#E0F2FE' : '#F1F5F9'),
                        color: isSelected
                          ? (isPending ? '#854D0E' : isNeedsUpdate ? '#0369A1' : '#FFFFFF')
                          : (isPending ? '#854D0E' : isNeedsUpdate ? '#0369A1' : '#475569')
                      }}>
                        {client.queue_label}
                      </span>

                      <span style={{ fontSize: '9.5px', color: isSelected ? 'rgba(255,255,255,0.7)' : '#94A3B8' }}>
                        {client.package_name || 'باقة إليت'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredQueue.length > 35 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '150px',
                  flexShrink: 0,
                  background: '#F8FAFC',
                  border: '1px dashed #CBD5E1',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  color: '#64748B',
                  textAlign: 'center',
                  fontWeight: 600
                }}>
                  + {filteredQueue.length - 35} مشترك آخر (استخدم البحث للوصول المباشر)
                </div>
              )}
            </div>
          )}
        </div>

        {/* 1. Sleek Top Command Bar */}
        {/* 1. Executive Client Bar & Action Header */}
        <div 
          style={{ 
            background: '#FFFFFF', 
            border: '1px solid #E2E8F0', 
            borderRadius: '8px', 
            padding: '10px 14px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '10px',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)'
          }}
        >
          {/* Client Bio Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>{program?.client?.full_name || 'أحمد محمود العوضي'}</span>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
                    ({program?.client?.client_code ? `#${program?.client?.client_code}` : '#1'})
                  </span>
                </h4>

                <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '4px', background: '#0F172A', color: '#FFFFFF', fontWeight: 700 }}>
                  {program?.client?.package_name || 'باقة ماكس'}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                <span>{program?.client?.age || 27} سنة</span>
                <span>•</span>
                <span>{program?.client?.weight_kg || 84.5} كجم</span>
                <span>•</span>
                <span>{program?.client?.height_cm || 180} سم</span>
                <span>•</span>
                <span style={{ color: '#0F172A', fontWeight: 700 }}>{program?.client?.goal_label || 'خسارة دهون وتنشيف'}</span>

                {program?.client?.injuries && program?.client?.injuries.length > 0 && (
                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <ShieldAlert size={10} />
                    <span>إصابة: {program?.client?.injuries.join('، ')}</span>
                  </span>
                )}

                {program?.client?.allergies && program?.client?.allergies.length > 0 && (
                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0284C7', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <AlertCircle size={10} />
                    <span>حساسية: {program?.client?.allergies.join('، ')}</span>
                  </span>
                )}

                {(() => {
                  const fasting = extractClientFastingProfile(program?.client);
                  return (
                    <>
                      {fasting.primaryFastingBadge && (
                        <span style={{ 
                          fontSize: '10px', 
                          padding: '1px 6px', 
                          borderRadius: '4px', 
                          background: fasting.primaryFastingBadge.bg, 
                          border: `1px solid ${fasting.primaryFastingBadge.border}`, 
                          color: fasting.primaryFastingBadge.color, 
                          fontWeight: 800 
                        }}>
                          {fasting.primaryFastingBadge.label}
                        </span>
                      )}
                      {fasting.intermittentBadge && (
                        <span style={{ 
                          fontSize: '10px', 
                          padding: '1px 6px', 
                          borderRadius: '4px', 
                          background: fasting.intermittentBadge.bg, 
                          border: `1px solid ${fasting.intermittentBadge.border}`, 
                          color: fasting.intermittentBadge.color, 
                          fontWeight: 800 
                        }}>
                          {fasting.intermittentBadge.label}
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              style={{
                height: '32px',
                padding: '0 12px',
                borderRadius: '5px',
                background: '#FFFFFF',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              <span>حفظ المسودة</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                try {
                  await handleSaveDraft(false);
                } catch {}
                window.open(`/pdf?user_id=${program?.client?.client_code || clientCodeParam}`, '_blank');
              }}
              style={{
                height: '32px',
                padding: '0 10px',
                borderRadius: '5px',
                background: '#F8FAFC',
                color: '#475569',
                border: '1px solid #E2E8F0',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Printer size={12} />
              <span>معاينة PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLabModalOpen(true)}
              style={{
                height: '32px',
                padding: '0 11px',
                borderRadius: '5px',
                background: '#F0F9FF',
                color: '#0284C7',
                border: '1px solid #BAE6FD',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="فحص المؤشرات الحيوية والتحاليل المخبرية للمشترك"
            >
              <HeartPulse size={13} color="#0284C7" />
              <span>فحص التحاليل</span>
            </button>

            <button
              type="button"
              onClick={handleApproveAndPublish}
              disabled={publishing}
              style={{
                height: '32px',
                padding: '0 14px',
                borderRadius: '5px',
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 4px rgba(15, 23, 42, 0.2)'
              }}
            >
              {publishing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              <span>اعتماد ونشر الخطة</span>
            </button>
          </div>
        </div>

        {/* 2. Unified Clean Workspace Tabs */}
        <div 
          style={{ 
            display: 'flex', 
            gap: '4px', 
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '3px'
          }}
        >
          {[
            { id: 'TRAINING', label: 'البرنامج التدريبي', count: `${currentSessions?.length || 3} أيام`, icon: Dumbbell },
            { id: 'NUTRITION', label: 'الخطة الغذائية والماكروز', count: `${program.nutrition?.targets?.calories || 1900} kcal`, icon: Utensils },
            { id: 'CARDIO_HABITS', label: 'الكارديو والعادات الحيوية', count: `${program.cardio?.neat_target_steps || 8500} خطوة`, icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeWorkspaceTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveWorkspaceTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isSel ? '#0F172A' : 'transparent',
                  color: isSel ? '#FFFFFF' : '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  boxShadow: isSel ? '0 2px 4px rgba(15, 23, 42, 0.2)' : 'none',
                  transition: 'all 0.12s ease'
                }}
              >
                <Icon size={14} color={isSel ? '#FFFFFF' : '#64748B'} />
                <span>{tab.label}</span>
                {tab.count && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '0 5px',
                    borderRadius: '10px',
                    background: isSel ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
                    color: isSel ? '#FFFFFF' : '#475569'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. TAB 1: WORKOUT & TRAINING */}
        {activeWorkspaceTab === 'TRAINING' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* Engine Clinical & Biomechanical Reasoning Card */}
            {program.training?.reasoning && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0 }}>
                    <Zap size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>تحليل المحرك الفسيولوجي والميكانيكا الحيوية</div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                      {typeof program.training.reasoning === 'string' ? program.training.reasoning : (program.training.reasoning?.rationale || 'تقسيم تدريبي مخصص مع حماية المفاصل وعزل الإصابات وتحقيق أعلى تحفيز عضلي.')}
                    </div>
                  </div>
                </div>
                {program.training?.target_split && (
                  <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', whiteSpace: 'nowrap' }}>
                    {program.training.target_split}
                  </span>
                )}
              </div>
            )}

            {/* Mesocycle Weeks Bar (5 Weeks Architecture) */}
            {Array.isArray(program.training?.weeks) && program.training.weeks.length > 0 && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>دورة الميزوسايكل الفسيولوجية:</span>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>5 أسابيع متدرجة مع كسر الإجهاد المبرمج</span>
                  </div>
                  {currentWeekData && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                      <span style={{ fontWeight: 700, color: currentWeekData.phase === 'DELOAD' ? '#16A34A' : '#2563EB', background: currentWeekData.phase === 'DELOAD' ? '#F0FDF4' : '#EFF6FF', padding: '2px 8px', borderRadius: '4px', border: currentWeekData.phase === 'DELOAD' ? '1px solid #BBF7D0' : '1px solid #BFDBFE' }}>
                        {currentWeekData.phase === 'INTRO' && 'الأسبوع 1: مرحلة التعود والتأسيس'}
                        {currentWeekData.phase === 'OVERLOAD' && 'الأسبوع 2: زيادة الأحمال التدريجية'}
                        {currentWeekData.phase === 'PEAK' && 'الأسبوع 3: ذروة الحجم التدريبي'}
                        {currentWeekData.phase === 'OVERREACH' && 'الأسبوع 4: أقصى إجهاد بنائي'}
                        {currentWeekData.phase === 'DELOAD' && 'الأسبوع 5: كسر الإجهاد والاستشفاء (Deload -40% حجم)'}
                        {!['INTRO', 'OVERLOAD', 'PEAK', 'OVERREACH', 'DELOAD'].includes(currentWeekData.phase) && `الأسبوع ${currentWeekData.week_number}: ${currentWeekData.phase || ''}`}
                      </span>
                      {currentWeekData.target_rir !== undefined && (
                        <span style={{ color: '#475569', fontWeight: 600, background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                          معدل الشدة: RIR {currentWeekData.target_rir}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {program.training.weeks.map((w) => {
                    const isSelected = selectedWeek === w.week_number;
                    const isDeload = w.phase === 'DELOAD';
                    return (
                      <button
                        key={w.week_number}
                        type="button"
                        onClick={() => setSelectedWeek(w.week_number)}
                        style={{
                          flex: 1,
                          minWidth: '120px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: isSelected 
                            ? (isDeload ? '2px solid #16A34A' : '2px solid #0F172A')
                            : (isDeload ? '1px solid #86EFAC' : '1px solid #E2E8F0'),
                          background: isSelected 
                            ? (isDeload ? '#DCFCE7' : '#0F172A') 
                            : (isDeload ? '#F0FDF4' : '#F8FAFC'),
                          color: isSelected 
                            ? (isDeload ? '#166534' : '#FFFFFF') 
                            : (isDeload ? '#15803D' : '#334155'),
                          cursor: 'pointer',
                          textAlign: 'right',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 800 }}>الأسبوع {w.week_number}</span>
                          <span style={{ fontSize: '10px', opacity: 0.85 }}>RIR {w.target_rir ?? 2}</span>
                        </div>
                        <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.9 }}>
                          {w.phase === 'INTRO' && 'مرحلة التأسيس'}
                          {w.phase === 'OVERLOAD' && 'زيادة الأحمال'}
                          {w.phase === 'PEAK' && 'ذروة الحجم'}
                          {w.phase === 'OVERREACH' && 'أقصى إجهاد'}
                          {w.phase === 'DELOAD' && 'استشفاء وديلود'}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {currentWeekData?.focus_note && (
                  <div style={{ fontSize: '10.5px', color: '#64748B', background: '#F8FAFC', padding: '6px 10px', borderRadius: '4px', border: '1px dashed #CBD5E1' }}>
                    توجيه الأسبوع: <span style={{ color: '#0F172A', fontWeight: 600 }}>{currentWeekData.focus_note}</span>
                  </div>
                )}
              </div>
            )}

            {/* Days Selector & Clean Header */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                
                {/* Days Tabs */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {currentSessions.map((sess, sIdx) => {
                    const isCurrent = activeSessionIdx === sIdx;
                    return (
                      <button
                        key={sess?.id || sIdx}
                        type="button"
                        onClick={() => setActiveSessionIdx(sIdx)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: isCurrent ? '1px solid #0F172A' : '1px solid #CBD5E1',
                          background: isCurrent ? '#0F172A' : '#FFFFFF',
                          color: isCurrent ? '#FFFFFF' : '#334155',
                          fontSize: '12px',
                          fontWeight: isCurrent ? 800 : 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>{sess.name}</span>
                        <span style={{ fontSize: '10px', opacity: 0.8 }}>({sess.exercises?.length || 0})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Target Muscle Summary */}
                {activeSession?.target_muscles && (
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    العضلات المستهدفة: <strong style={{ color: '#0F172A' }}>{activeSession.target_muscles}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Pre-Workout Warmup Bar */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <RotateCw size={12} />
                  <span>الإحماء الديناميكي:</span>
                </span>
                
                {(!activeSession?.pre_workout_mobility || activeSession.pre_workout_mobility.length === 0) ? (
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>إحماء عام قياسي للمفاصل</span>
                ) : (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {activeSession.pre_workout_mobility.map((m, mIdx) => (
                      <span key={mIdx} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>{m.name || m.name_ar}</span>
                        <button type="button" onClick={() => handleRemoveMobilityFromSession(activeSessionIdx, mIdx, 'WARMUP')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#DC2626' }}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMobilityModal({ open: true, type: 'WARMUP', sessionIdx: activeSessionIdx })}
                style={{ padding: '3px 8px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                + إضافة إحماء
              </button>
            </div>

            {/* Exercise Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeSession?.exercises?.map((ex, eIdx) => (
                <div
                  key={ex.id || eIdx}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)'
                  }}
                >
                  {/* Title & Info & Visuals */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 800,
                      flexShrink: 0
                    }}>
                      {eIdx + 1}
                    </span>

                    {/* Visual Thumbnails (Stretch & Contraction) & Video Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <div 
                        style={{ 
                          width: '42px', 
                          height: '42px', 
                          borderRadius: '6px', 
                          overflow: 'hidden', 
                          background: '#F1F5F9', 
                          border: '1px solid #E2E8F0', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                        title="وضعية البداية والاستطالة"
                      >
                        <img 
                          src={ex.image_stretch || `/exercises/${ex.code}/0.jpg`} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          loading="lazy"
                        />
                        <span style={{ position: 'absolute', bottom: '1px', right: '2px', fontSize: '8px', fontWeight: 800, color: '#64748B', background: 'rgba(255,255,255,0.85)', padding: '0 2px', borderRadius: '2px' }}>1</span>
                      </div>
                      <div 
                        style={{ 
                          width: '42px', 
                          height: '42px', 
                          borderRadius: '6px', 
                          overflow: 'hidden', 
                          background: '#F1F5F9', 
                          border: '1px solid #E2E8F0', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                        title="وضعية الانقباض العضلي"
                      >
                        <img 
                          src={ex.image_contraction || `/exercises/${ex.code}/1.jpg`} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          loading="lazy"
                        />
                        <span style={{ position: 'absolute', bottom: '1px', right: '2px', fontSize: '8px', fontWeight: 800, color: '#64748B', background: 'rgba(255,255,255,0.85)', padding: '0 2px', borderRadius: '2px' }}>2</span>
                      </div>
                      
                      {/* Video Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setActiveVideoModalEx(ex)}
                        title="مشاهدة الفيديو التوضيحي للأداء"
                        style={{
                          width: '32px',
                          height: '42px',
                          borderRadius: '6px',
                          background: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          color: '#2563EB',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Play size={14} />
                      </button>
                    </div>

                    <div style={{ minWidth: 0 }}>
                      {/* Primary English Exercise Name (Large & Prominent) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 800,
                            color: '#0F172A',
                            fontFamily: "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                            letterSpacing: '0.2px',
                            direction: 'ltr',
                            display: 'inline-block',
                          }}
                        >
                          {getExerciseDisplayNames(ex).nameEn}
                        </strong>

                        {ex.equipment && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', fontWeight: 600 }}>
                            {ex.equipment}
                          </span>
                        )}
                      </div>

                      {/* Secondary Arabic Exercise Name (Smaller, Muted & Secondary) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#64748B',
                            fontFamily: 'Cairo, sans-serif',
                          }}
                        >
                          {getExerciseDisplayNames(ex).nameAr}
                        </span>

                        {ex.code && ex.code !== getExerciseDisplayNames(ex).nameEn && (
                          <span style={{ fontSize: '8.5px', color: '#94A3B8', fontFamily: 'monospace' }}>
                            ({ex.code})
                          </span>
                        )}
                      </div>

                      {ex.safetyNote && (
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          {ex.safetyNote}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline Parameters */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Sets */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#F8FAFC', padding: '0 6px', height: '30px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px', fontWeight: 700 }}>جولات:</span>
                      <button type="button" onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'sets', Math.max(1, (ex.sets || 3) - 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 4px', fontSize: '13px' }}>-</button>
                      <strong style={{ fontSize: '13px', minWidth: '18px', textAlign: 'center', margin: '0 2px', color: '#0F172A' }}>{ex.sets}</strong>
                      <button type="button" onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'sets', (ex.sets || 3) + 1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 4px', fontSize: '13px' }}>+</button>
                    </div>

                    {/* Reps */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#F8FAFC', padding: '0 8px', height: '30px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px', fontWeight: 700 }}>تكرار:</span>
                      <input
                        type="text"
                        value={ex.reps}
                        onChange={(e) => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'reps', e.target.value)}
                        style={{ width: '70px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 800, fontSize: '12px', outline: 'none', color: '#0F172A', direction: 'ltr' }}
                      />
                    </div>

                    {/* RIR */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#F8FAFC', padding: '0 8px', height: '30px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px', fontWeight: 700 }}>الشدة:</span>
                      <select
                        value={ex.rir ?? 1}
                        onChange={(e) => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'rir', Number(e.target.value))}
                        style={{ border: 'none', background: 'transparent', fontWeight: 800, fontSize: '11.5px', outline: 'none', cursor: 'pointer', color: '#0F172A' }}
                      >
                        <option value="0">RIR 0 (فشل تام)</option>
                        <option value="1">RIR 1 (عدة قبل الفشل)</option>
                        <option value="2">RIR 2 (عدتان قبل الفشل)</option>
                        <option value="3">RIR 3</option>
                      </select>
                    </div>

                    {/* Rest */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#F8FAFC', padding: '0 8px', height: '30px' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px', fontWeight: 700 }}>راحة:</span>
                      <select
                        value={ex.restSec || 75}
                        onChange={(e) => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'restSec', Number(e.target.value))}
                        style={{ border: 'none', background: 'transparent', fontWeight: 800, fontSize: '11.5px', outline: 'none', cursor: 'pointer', color: '#0F172A' }}
                      >
                        <option value="45">45s</option>
                        <option value="60">60s</option>
                        <option value="75">75s</option>
                        <option value="90">90s</option>
                        <option value="120">120s</option>
                      </select>
                    </div>

                    {/* Smart Swap Button */}
                    <button
                      type="button"
                      onClick={() => setSwapExModal({ open: true, sessionIdx: activeSessionIdx, exIdx: eIdx, currentEx: ex })}
                      style={{ height: '30px', padding: '0 8px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}
                      title="تبديل التمرين الذكي بنفس الزاوية والأمان"
                    >
                      <ArrowRightLeft size={12} color="#2563EB" />
                      <span>بديل</span>
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteExercise(activeSessionIdx, eIdx)}
                      style={{ height: '30px', width: '30px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="حذف التمرين"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Post-Workout Stretches Bar */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <HeartPulse size={14} />
                  <span>إطالات الاستشفاء:</span>
                </span>
                
                {(!activeSession?.post_workout_stretches || activeSession.post_workout_stretches.length === 0) ? (
                  <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>إطالات عامة للعضلات المستهدفة</span>
                ) : (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {activeSession.post_workout_stretches.map((m, mIdx) => (
                      <span key={mIdx} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <span>{m.name || m.name_ar}</span>
                        <button type="button" onClick={() => handleRemoveMobilityFromSession(activeSessionIdx, mIdx, 'STRETCH')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#DC2626' }}>
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMobilityModal({ open: true, type: 'STRETCH', sessionIdx: activeSessionIdx })}
                style={{ padding: '4px 10px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', borderRadius: '5px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                + إضافة إطالة
              </button>
            </div>

            {/* Centered Add Exercise Button */}
            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setAddExModal({ open: true, sessionIdx: activeSessionIdx })}
                style={{
                  height: '34px',
                  padding: '0 18px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
                }}
              >
                <Plus size={14} />
                <span>إضافة تمرين جديد لـ ({activeSession?.name})</span>
              </button>
            </div>

          </div>
        )}

        {/* 4. TAB 2: NUTRITION & MACROS */}
        {activeWorkspaceTab === 'NUTRITION' && (
          <CoachEditorNutritionTab
            searchParams={searchParams}
            setSearchParams={setSearchParams}
            loading={loading}
            setLoading={setLoading}
            saving={saving}
            setSaving={setSaving}
            publishing={publishing}
            setPublishing={setPublishing}
            program={program}
            setProgram={setProgram}
            coachNotes={coachNotes}
            setCoachNotes={setCoachNotes}
            activeSessionIdx={activeSessionIdx}
            setActiveSessionIdx={setActiveSessionIdx}
            activeWorkspaceTab={activeWorkspaceTab}
            setActiveWorkspaceTab={setActiveWorkspaceTab}
            notification={notification}
            setNotification={setNotification}
            clientsList={clientsList}
            setClientsList={setClientsList}
            queueFilter={queueFilter}
            setQueueFilter={setQueueFilter}
            queueSearch={queueSearch}
            setQueueSearch={setQueueSearch}
            showQueueSlider={showQueueSlider}
            setShowQueueSlider={setShowQueueSlider}
            allExercisesList={allExercisesList}
            setAllExercisesList={setAllExercisesList}
            cardioSwapModal={cardioSwapModal}
            setCardioSwapModal={setCardioSwapModal}
            addFoodModal={addFoodModal}
            setAddFoodModal={setAddFoodModal}
            swapFoodModal={swapFoodModal}
            setSwapFoodModal={setSwapFoodModal}
            addExModal={addExModal}
            setAddExModal={setAddExModal}
            swapExModal={swapExModal}
            setSwapExModal={setSwapExModal}
            mobilityModal={mobilityModal}
            setMobilityModal={setMobilityModal}
            allMobilityList={allMobilityList}
            setAllMobilityList={setAllMobilityList}
            showReasoning={showReasoning}
            setShowReasoning={setShowReasoning}
            exModalSearch={exModalSearch}
            setExModalSearch={setExModalSearch}
            foodModalSearch={foodModalSearch}
            setFoodModalSearch={setFoodModalSearch}
            mobilityModalSearch={mobilityModalSearch}
            setMobilityModalSearch={setMobilityModalSearch}
            swapFoodSearch={swapFoodSearch}
            setSwapFoodSearch={setSwapFoodSearch}
            swapExSearch={swapExSearch}
            setSwapExSearch={setSwapExSearch}
            handleSelectClient={handleSelectClient}
            handleUpdateFoodAmount={handleUpdateFoodAmount}
            handleDeleteFood={handleDeleteFood}
            handleAddNewMeal={handleAddNewMeal}
            handleDeleteMeal={handleDeleteMeal}
            handleAddFoodToMeal={handleAddFoodToMeal}
            handleExecuteFoodSwap={handleExecuteFoodSwap}
            handleExecuteExerciseSwap={handleExecuteExerciseSwap}
            handleUpdateExerciseParam={handleUpdateExerciseParam}
            handleDeleteExercise={handleDeleteExercise}
            handleAddExerciseToSession={handleAddExerciseToSession}
            handleSelectCardioModality={handleSelectCardioModality}
            handleAddMobilityToSession={handleAddMobilityToSession}
            handleRemoveMobilityFromSession={handleRemoveMobilityFromSession}
            handleSaveDraft={handleSaveDraft}
            handleApproveAndPublish={handleApproveAndPublish}
            showToast={showToast}
            autoRippleEnabled={autoRippleEnabled}
            setAutoRippleEnabled={setAutoRippleEnabled}
            FOOD_DATABASE_LIST={FOOD_DATABASE_LIST}
            CARDIO_MODALITY_OPTIONS={CARDIO_MODALITY_OPTIONS}
          />
        )}

        {/* 5. TAB 3: CARDIO & HABITS */}
        {activeWorkspaceTab === 'CARDIO_HABITS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* Engine Cardio & Recovery Reasoning Card */}
            {program.cardio?.reasoning && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#FAF5FF', border: '1px solid #E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA', flexShrink: 0 }}>
                    <Zap size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>بروتوكول الكارديو والاستشفاء ونمط الحياة</div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                      {typeof program.cardio.reasoning === 'string' ? program.cardio.reasoning : (program.cardio.reasoning?.rationale || 'بروتوكول كارديو Zone 2 لحرق الدهون وتحسين صحة القلب بدون إجهاد للمفاصل.')}
                    </div>
                  </div>
                </div>
                {program.cardio?.target_heart_rate_zone && (
                  <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', whiteSpace: 'nowrap' }}>
                    {program.cardio.target_heart_rate_zone}
                  </span>
                )}
              </div>
            )}

            {/* Cardio Modality Card */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '13px', color: '#0F172A' }}>نظام وجهاز الكارديو:</strong>
                <button
                  type="button"
                  onClick={() => setCardioSwapModal(true)}
                  style={{ padding: '4px 10px', borderRadius: '4px', background: '#0F172A', color: '#FFFFFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <ArrowRightLeft size={12} />
                  <span>تبديل الجهاز / النمط</span>
                </button>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <strong style={{ color: '#0F172A', fontSize: '12.5px' }}>{program.cardio?.modality || 'مشي على سير مائل (Incline Treadmill)'}</strong>
                
                {/* Cardio Volume Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', paddingTop: '6px', borderTop: '1px solid #E2E8F0' }}>
                  <div>
                    <label style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '2px', fontWeight: 600 }}>الجلسات أسبوعياً</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '5px', height: '28px', padding: '0 4px' }}>
                      <button type="button" onClick={() => handleUpdateCardioParam('weekly_sessions', Math.max(1, (Number(program.cardio?.weekly_sessions) || 3) - 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 5px' }}>-</button>
                      <span style={{ flex: 1, textAlign: 'center', fontSize: '11.5px', fontWeight: 700, color: '#0F172A' }}>{program.cardio?.weekly_sessions || 3} جلسات</span>
                      <button type="button" onClick={() => handleUpdateCardioParam('weekly_sessions', (Number(program.cardio?.weekly_sessions) || 3) + 1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 5px' }}>+</button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '2px', fontWeight: 600 }}>مدة الجلسة (دقيقة)</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '5px', height: '28px', padding: '0 4px' }}>
                      <button type="button" onClick={() => handleUpdateCardioParam('session_duration_min', Math.max(10, (Number(program.cardio?.session_duration_min) || 30) - 5))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 5px' }}>-</button>
                      <span style={{ flex: 1, textAlign: 'center', fontSize: '11.5px', fontWeight: 700, color: '#0F172A' }}>{program.cardio?.session_duration_min || 30} دقيقة</span>
                      <button type="button" onClick={() => handleUpdateCardioParam('session_duration_min', (Number(program.cardio?.session_duration_min) || 30) + 5)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 5px' }}>+</button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '2px', fontWeight: 600 }}>نطاق النبض المستهدف</label>
                    <select
                      value={program.cardio?.target_heart_rate_zone || 'Zone 2'}
                      onChange={(e) => handleUpdateCardioParam('target_heart_rate_zone', e.target.value)}
                      style={{ width: '100%', height: '28px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 6px', fontSize: '11px', fontWeight: 700, color: '#0F172A', background: '#FFFFFF', outline: 'none' }}
                    >
                      <option value="Zone 1">Zone 1 (استشفاء خفيف)</option>
                      <option value="Zone 2">Zone 2 (حرق دهون وتحمل - موصى به)</option>
                      <option value="Zone 3">Zone 3 (تحمل هوائي متوسط)</option>
                      <option value="Zone 4 / HIIT">Zone 4 / HIIT (كثافة عالية)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Habits Bar */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '13px', color: '#0F172A' }}>المؤشرات والعادات اليومية (NEAT & Hydration):</strong>
                <span style={{ fontSize: '10.5px', color: '#64748B' }}>انقر لتعديل الأرقام مباشرة</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                {/* Steps */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '4px' }}>الخطوات اليومية المستهدفة</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      step="500"
                      min="3000"
                      max="30000"
                      value={program.cardio?.neat_target_steps || 8500}
                      onChange={(e) => handleUpdateCardioParam('neat_target_steps', Number(e.target.value) || 8500)}
                      style={{ width: '100%', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '13px', fontWeight: 800, color: '#0F172A', outline: 'none', background: '#FFFFFF' }}
                    />
                    <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>خطوة</span>
                  </div>
                </div>

                {/* Water */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '4px' }}>شرب الماء اليومي</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      step="0.2"
                      min="1"
                      max="10"
                      value={program.cardio?.daily_water_target_liters || 3.8}
                      onChange={(e) => handleUpdateCardioParam('daily_water_target_liters', Number(e.target.value) || 3.8)}
                      style={{ width: '100%', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '13px', fontWeight: 800, color: '#0F172A', outline: 'none', background: '#FFFFFF' }}
                    />
                    <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>لتر</span>
                  </div>
                </div>

                {/* Sleep */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '4px' }}>ساعات النوم المستهدفة</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      step="0.5"
                      min="4"
                      max="12"
                      value={program.cardio?.sleep_target_hours || 8}
                      onChange={(e) => handleUpdateCardioParam('sleep_target_hours', Number(e.target.value) || 8)}
                      style={{ width: '100%', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '13px', fontWeight: 800, color: '#0F172A', outline: 'none', background: '#FFFFFF' }}
                    />
                    <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>ساعات</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coach Directives & Final Plan Notes */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <FileText size={15} color="#0F172A" />
                <strong style={{ fontSize: '13px', color: '#0F172A' }}>ملاحظات وتوجيهات الكوتش الخاصة للمشترك:</strong>
              </div>
              <textarea
                rows={4}
                placeholder="اكتب التوجيهات الختامية والنصائح المخصصة للمشترك قبل اعتماد الخطة..."
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                style={{ width: '100%', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Cairo, sans-serif' }}
              />
            </div>

          </div>
        )}

        {/* =========================================================================
            MODALS (All Emoji-Free)
            ========================================================================= */}

        {/* Smart Food Swap Modal */}
        {swapFoodModal.open && swapFoodModal.currentItem && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
            <div style={{ maxWidth: '520px', width: '100%', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '85vh', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowRightLeft size={14} color="#2563EB" />
                    <span>البدائل الغذائية المتكافئة لـ ({swapFoodModal.currentItem.name})</span>
                  </h4>
                  <span style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px', display: 'block' }}>
                    الكمية الحالية: {swapFoodModal.currentItem.amount} {swapFoodModal.currentItem.unit || 'جم'} ({swapFoodModal.currentItem.cal || 0} kcal)
                  </span>
                </div>
                <button type="button" onClick={() => setSwapFoodModal({ open: false, mealId: null, itemIdx: null, currentItem: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                  <X size={15} />
                </button>
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="ابحث عن صنف بديل..."
                  value={swapFoodSearch}
                  onChange={(e) => setSwapFoodSearch(e.target.value)}
                  style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 28px 0 10px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box' }}
                />
                <Search size={13} style={{ position: 'absolute', right: '9px', top: '10px', color: '#94A3B8' }} />
              </div>

              {/* Compatible Swaps List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '340px', paddingRight: '2px' }}>
                {FOOD_DATABASE_LIST
                  .filter(f => {
                    const curCat = swapFoodModal.currentItem.category;
                    const matchCategory = !curCat || f.category === curCat || f.macro_type === curCat;
                    const matchSearch = !swapFoodSearch || 
                      arabicSearchMatch(f.name, swapFoodSearch) || 
                      arabicSearchMatch(f.name_ar, swapFoodSearch) || 
                      arabicSearchMatch(f.name_en, swapFoodSearch);
                    return matchCategory && matchSearch;
                  })
                  .map((targetFood, tfIdx) => {
                    let equivGrams = 100;
                    if (swapFoodModal.currentItem.category === 'PROTEIN') {
                      const curP = Number(swapFoodModal.currentItem.p) || 25;
                      const targetP = Number(targetFood.protein_per_100g || targetFood.p || 25);
                      equivGrams = Math.max(10, Math.round((curP / targetP) * 100));
                    } else if (swapFoodModal.currentItem.category === 'CARB') {
                      const curC = Number(swapFoodModal.currentItem.c) || 30;
                      const targetC = Number(targetFood.carbs_per_100g || targetFood.c || 25);
                      equivGrams = Math.max(10, Math.round((curC / targetC) * 100));
                    } else if (swapFoodModal.currentItem.category === 'FAT') {
                      const curF = Number(swapFoodModal.currentItem.f) || 8;
                      const targetF = Number(targetFood.fat_per_100g || targetFood.f || 10);
                      equivGrams = Math.max(5, Math.round((curF / targetF) * 100));
                    }

                    const factor = equivGrams / 100;
                    const equivCal = Math.round((targetFood.calories_per_100g || targetFood.cal || 100) * factor);
                    const equivP = Number(((targetFood.protein_per_100g || targetFood.p || 0) * factor).toFixed(1));
                    const equivC = Number(((targetFood.carbs_per_100g || targetFood.c || 0) * factor).toFixed(1));
                    const equivF = Number(((targetFood.fat_per_100g || targetFood.f || 0) * factor).toFixed(1));

                    return (
                      <div
                        key={targetFood.code || tfIdx}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>{targetFood.name}</strong>
                          <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                            الكمية المكافئة: <strong style={{ color: '#0F172A' }}>{equivGrams} {targetFood.serving_unit || targetFood.unit || 'جم'}</strong> ({equivCal} kcal)
                          </span>
                          <div style={{ fontSize: '9.5px', color: '#94A3B8', marginTop: '1px' }}>
                            P:{equivP}g · C:{equivC}g · F:{equivF}g
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleExecuteFoodSwap(swapFoodModal.mealId, swapFoodModal.itemIdx, targetFood)}
                          style={{
                            height: '28px',
                            padding: '0 12px',
                            borderRadius: '5px',
                            background: '#0F172A',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          اختيار كبديل
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Smart Exercise Swap Modal */}
        {swapExModal.open && swapExModal.currentEx && (() => {
          const curId = swapExModal.currentEx.code || swapExModal.currentEx.id;
          const curMatch = allExercisesList.find(e => e.id === curId || e.code === curId || e.name_ar === swapExModal.currentEx.name || e.name === swapExModal.currentEx.name);
          const twinAltIds = Array.isArray(curMatch?.alternatives) ? curMatch.alternatives : [];

          // Direct Twin alternatives (from Bidirectional Smart Linker)
          const twinExercises = allExercisesList.filter(e => twinAltIds.includes(e.id) || twinAltIds.includes(e.code));

          // Other compatible alternatives
          const otherCandidates = allExercisesList.filter(e => {
            if (e.id === curId || e.code === curId) return false;
            if (twinAltIds.includes(e.id) || twinAltIds.includes(e.code)) return false;
            if (!swapExSearch) {
              const curMuscle = swapExModal.currentEx?.muscle_group || curMatch?.muscle_group || '';
              if (curMuscle && e.muscle_group) {
                return e.muscle_group === curMuscle;
              }
              return true;
            }
            return arabicSearchMatch(e.name_ar, swapExSearch) ||
              arabicSearchMatch(e.name_en, swapExSearch) ||
              arabicSearchMatch(e.name, swapExSearch) ||
              arabicSearchMatch(e.id, swapExSearch) ||
              (Array.isArray(e.aliases) && e.aliases.some(a => arabicSearchMatch(a, swapExSearch)));
          });

          return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
              <div style={{ maxWidth: '560px', width: '100%', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '85vh', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ArrowRightLeft size={14} color="#0284C7" />
                      <span>البدائل المتطابقة ميكانيكياً لـ ({getExerciseDisplayNames(swapExModal.currentEx).nameEn})</span>
                    </h4>
                    <span style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px', display: 'block' }}>
                      نفس الزاوية العضلية ومنحنى المقاومة مع مراعاة أمان المفاصل والربط التبادلي
                    </span>
                  </div>
                  <button type="button" onClick={() => setSwapExModal({ open: false, sessionIdx: null, exIdx: null, currentEx: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                    <X size={15} />
                  </button>
                </div>

                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="ابحث في التمارين البديلة..."
                    value={swapExSearch}
                    onChange={(e) => setSwapExSearch(e.target.value)}
                    style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 28px 0 10px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <Search size={13} style={{ position: 'absolute', right: '9px', top: '10px', color: '#94A3B8' }} />
                </div>

                {/* Exercises List Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '380px', paddingRight: '2px' }}>
                  
                  {/* Direct Twin Swaps Section */}
                  {twinExercises.length > 0 && !swapExSearch && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '4px 8px', borderRadius: '5px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284C7', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ArrowRightLeft size={12} />
                          <span>البدائل التوأم المباشرة (الربط التبادلي الذكي)</span>
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#0284C7' }}>{twinExercises.length} بديل معتمد</span>
                      </div>

                      {twinExercises.map((twinEx, tIdx) => (
                        <div
                          key={twinEx.id || tIdx}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #BAE6FD',
                            borderRadius: '6px',
                            padding: '8px 10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 1px 3px rgba(2, 132, 199, 0.08)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ fontSize: '12px', color: '#0F172A', direction: 'ltr', display: 'inline-block' }}>
                                {getExerciseDisplayNames(twinEx).nameEn}
                              </strong>
                              <span style={{ fontSize: '9.5px', background: '#E0F2FE', color: '#0284C7', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                                بديل توأم مباشر
                              </span>
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span>{getExerciseDisplayNames(twinEx).nameAr}</span>
                              <span>•</span>
                              <span>{twinEx.equipment_ar || twinEx.equipment || 'أداة تمرين'}</span>
                              <span>•</span>
                              <span>{twinEx.muscle_ar || twinEx.muscle_group || 'عضلة رئيسية'}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleExecuteExerciseSwap(swapExModal.sessionIdx, swapExModal.exIdx, twinEx)}
                            style={{
                              height: '28px',
                              padding: '0 12px',
                              borderRadius: '5px',
                              background: '#0284C7',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          >
                            استبدال بالبديل التوأم
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Other Biomechanical Candidates Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {twinExercises.length > 0 && !swapExSearch && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginTop: '4px' }}>
                        تمارين بديلة متوافقة تشريحياً:
                      </span>
                    )}

                    {otherCandidates.slice(0, 35).map((targetEx, teIdx) => (
                      <div
                        key={targetEx.id || teIdx}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block', direction: 'ltr', textAlign: 'right' }}>
                            {getExerciseDisplayNames(targetEx).nameEn}
                          </strong>
                          <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span>{getExerciseDisplayNames(targetEx).nameAr}</span>
                            <span>•</span>
                            <span>{targetEx.equipment_ar || targetEx.equipment || 'جهاز / أوزان'}</span>
                            <span>•</span>
                            <span>{targetEx.muscle_ar || targetEx.muscle_group || 'عضلة رئيسية'}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleExecuteExerciseSwap(swapExModal.sessionIdx, swapExModal.exIdx, targetEx)}
                          style={{
                            height: '28px',
                            padding: '0 12px',
                            borderRadius: '5px',
                            background: '#0F172A',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          استبدال بهذا التمرين
                        </button>
                      </div>
                    ))}

                    {otherCandidates.length === 0 && twinExercises.length === 0 && (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '11.5px' }}>
                        لا توجد تمارين بديلة مطابقة لبحثك.
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          );
        })()}

        {/* Cardio Swap Modal */}
        {cardioSwapModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
            <div style={{ maxWidth: '460px', width: '100%', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>اختيار نمط الكارديو</h4>
                <button type="button" onClick={() => setCardioSwapModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={15} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                {CARDIO_MODALITY_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectCardioModality(opt)}
                    style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div>
                      <strong style={{ fontSize: '11.5px', color: '#0F172A', display: 'block' }}>{opt.name}</strong>
                      <span style={{ fontSize: '10px', color: '#64748B' }}>{opt.desc}</span>
                    </div>
                    <button type="button" style={{ padding: '3px 8px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700 }}>اختيار</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobility Selection Modal */}
        {mobilityModal.open && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
            <div style={{ maxWidth: '480px', width: '100%', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '85vh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
                  {mobilityModal.type === 'WARMUP' ? 'اختيار حركة إحماء ديناميكي' : 'اختيار حركة إطالة استشفائية'}
                </h4>
                <button type="button" onClick={() => setMobilityModal({ open: false, type: 'WARMUP', sessionIdx: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={15} /></button>
              </div>

              <input
                type="text"
                placeholder="بحث باسم الحركة أو المنطقة..."
                value={mobilityModalSearch}
                onChange={(e) => setMobilityModalSearch(e.target.value)}
                style={{ width: '100%', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
                {allMobilityList
                  .filter(d => {
                    const matchType = mobilityModal.type === 'WARMUP' 
                      ? (d.category === 'DYNAMIC_WARMUP' || d.category === 'POSTURAL_PREHAB')
                      : (d.category === 'STATIC_STRETCH' || d.category === 'POSTURAL_PREHAB');
                    const matchSearch = !mobilityModalSearch || 
                      arabicSearchMatch(d.name_ar, mobilityModalSearch) ||
                      arabicSearchMatch(d.name_en, mobilityModalSearch) ||
                      arabicSearchMatch(d.target_area_ar, mobilityModalSearch);
                    return matchType && matchSearch;
                  })
                  .map((drill) => (
                    <div
                      key={drill.id}
                      onClick={() => handleAddMobilityToSession(drill, mobilityModal.type)}
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '5px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div>
                        <strong style={{ fontSize: '11.5px', color: '#0F172A', display: 'block' }}>{drill.name_ar}</strong>
                        <span style={{ fontSize: '10px', color: '#64748B' }}>المنطقة: {drill.target_area_ar}</span>
                      </div>
                      <button type="button" style={{ padding: '2px 7px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '3px', fontSize: '10px', fontWeight: 700 }}>إضافة</button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Exercise Modal */}
        {addExModal.open && (() => {
          const sessionName = program?.training?.sessions?.[addExModal.sessionIdx]?.name || `الجلسة ${(addExModal.sessionIdx ?? 0) + 1}`;
          
          const filteredExercises = allExercisesList.filter(ex => {
            const matchMuscle = addExMuscleFilter === 'ALL' ||
              ex.muscle_group === addExMuscleFilter ||
              (addExMuscleFilter === 'LEGS' && (ex.muscle_group === 'LEGS' || ex.muscle_group === 'CALVES')) ||
              (addExMuscleFilter === 'CALVES' && (ex.muscle_group === 'CALVES' || ex.id === 'WALL_TIBIALIS_RAISE' || ex.name_ar?.includes('سمانة') || ex.name_ar?.includes('الساق')));

            const matchEquipment = addExEquipmentFilter === 'ALL' || ex.equipment === addExEquipmentFilter;

            if (!exModalSearch) return matchMuscle && matchEquipment;
            return (matchMuscle && matchEquipment) && (
              arabicSearchMatch(ex.name_ar, exModalSearch) ||
              arabicSearchMatch(ex.name_en, exModalSearch) ||
              arabicSearchMatch(ex.name, exModalSearch) ||
              arabicSearchMatch(ex.id, exModalSearch) ||
              (Array.isArray(ex.aliases) && ex.aliases.some(a => arabicSearchMatch(a, exModalSearch)))
            );
          });

          return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
              <div style={{ maxWidth: '620px', width: '100%', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '88vh', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Dumbbell size={15} color="#0284C7" />
                      <span>إضافة تمرين إلى: {sessionName}</span>
                    </h4>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>اختر التمرين المطلوب لإدراجه ضمن الجلسة التدريبية</span>
                  </div>
                  <button type="button" onClick={() => setAddExModal({ open: false, sessionIdx: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}><X size={16} /></button>
                </div>

                {/* Muscle Category Chips */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', background: '#F8FAFC', padding: '5px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  {ADD_EX_MUSCLE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setAddExMuscleFilter(cat.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: addExMuscleFilter === cat.id ? '#0F172A' : 'transparent',
                        color: addExMuscleFilter === cat.id ? '#FFFFFF' : '#64748B',
                        boxShadow: addExMuscleFilter === cat.id ? '0 1px 3px rgba(15, 23, 42, 0.2)' : 'none',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Search & Equipment Filter Row */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={13} color="#94A3B8" style={{ position: 'absolute', right: '10px' }} />
                    <input
                      type="text"
                      placeholder="ابحث باسم التمرين (عربي / إنجليزي)..."
                      value={exModalSearch}
                      onChange={(e) => setExModalSearch(e.target.value)}
                      style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 30px 0 28px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    {exModalSearch && (
                      <button
                        type="button"
                        onClick={() => setExModalSearch('')}
                        style={{ position: 'absolute', left: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <select
                      value={addExEquipmentFilter}
                      onChange={(e) => setAddExEquipmentFilter(e.target.value)}
                      style={{ height: '32px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', fontWeight: 700, color: '#0F172A', background: '#FFFFFF', outline: 'none', cursor: 'pointer' }}
                    >
                      {ADD_EX_EQUIPMENT_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Counter indicator */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
                  <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>
                    النتائج المتاحة: {filteredExercises.length} تمرين
                  </span>
                  {(addExMuscleFilter !== 'ALL' || addExEquipmentFilter !== 'ALL' || exModalSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddExMuscleFilter('ALL');
                        setAddExEquipmentFilter('ALL');
                        setExModalSearch('');
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#0284C7', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      إعادة تعيين الفلاتر
                    </button>
                  )}
                </div>

                {/* Exercises List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '340px', overflowY: 'auto' }}>
                  {filteredExercises.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', background: '#F8FAFC', borderRadius: '6px', border: '1px dashed #CBD5E1', color: '#64748B', fontSize: '11.5px' }}>
                      لا توجد تمارين مطابقة لمعايير البحث والتصفية المحددة.
                    </div>
                  ) : (
                    filteredExercises
                      .slice(0, 60)
                      .map((ex) => {
                        const altCount = Array.isArray(ex.alternatives) ? ex.alternatives.length : 0;
                        return (
                          <div
                            key={ex.id}
                            onClick={() => handleAddExerciseToSession(addExModal.sessionIdx, ex)}
                            style={{
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.12s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#0284C7';
                              e.currentTarget.style.background = '#F0F9FF';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#E2E8F0';
                              e.currentTarget.style.background = '#F8FAFC';
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong style={{ fontSize: '12.5px', color: '#0F172A', direction: 'ltr', display: 'inline-block' }}>
                                  {getExerciseDisplayNames(ex).nameEn}
                                </strong>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>
                                  {getExerciseDisplayNames(ex).nameAr}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ background: '#E2E8F0', color: '#334155', padding: '1px 6px', borderRadius: '3px', fontSize: '9.5px', fontWeight: 600 }}>
                                  {getShortMuscleName(ex.muscle_ar || ex.target_muscle, ex.muscle_group)}
                                </span>
                                <span style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#64748B', padding: '1px 6px', borderRadius: '3px', fontSize: '9.5px' }}>
                                  {getShortEquipmentName(ex.equipment_ar, ex.equipment)}
                                </span>
                                {altCount > 0 && (
                                  <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '1px 6px', borderRadius: '3px', fontSize: '9.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                    <ArrowRightLeft size={10} />
                                    <span>{altCount} بدائل توأم</span>
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              style={{
                                padding: '4px 10px',
                                background: '#0F172A',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              + إضافة
                            </button>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Add Food Modal */}
        {addFoodModal.open && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
            <div style={{ maxWidth: '480px', width: '100%', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '85vh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>إضافة صنف غذائي</h4>
                <button type="button" onClick={() => setAddFoodModal({ open: false, mealId: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={15} /></button>
              </div>

              <input
                type="text"
                placeholder="ابحث باسم الصنف الغذائي..."
                value={foodModalSearch}
                onChange={(e) => setFoodModalSearch(e.target.value)}
                style={{ width: '100%', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
                {FOOD_DATABASE_LIST
                  .filter(fd => !foodModalSearch || 
                    arabicSearchMatch(fd.name, foodModalSearch) || 
                    arabicSearchMatch(fd.name_ar, foodModalSearch) || 
                    arabicSearchMatch(fd.name_en, foodModalSearch) ||
                    arabicSearchMatch(fd.code, foodModalSearch) ||
                    (Array.isArray(fd.aliases) && fd.aliases.some(a => arabicSearchMatch(a, foodModalSearch))))
                  .slice(0, 30)
                  .map((fd) => (
                    <div
                      key={fd.code}
                      onClick={() => handleAddFoodToMeal(addFoodModal.mealId, fd)}
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '5px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div>
                        <strong style={{ fontSize: '11.5px', color: '#0F172A', display: 'block' }}>{fd.name}</strong>
                        <span style={{ fontSize: '10px', color: '#64748B' }}>P: {fd.p}g • C: {fd.c}g • F: {fd.f}g</span>
                      </div>
                      <button type="button" style={{ padding: '2px 7px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '3px', fontSize: '10px', fontWeight: 700 }}>+ إضافة</button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Clinical Lab Biomarkers Review Studio Modal */}
        {isLabModalOpen && (
          <LabBiomarkersReviewStudio
            client={program?.client || { client_code: clientCodeParam, full_name: program?.client?.full_name || 'مشترك' }}
            initialValues={program?.client?.biomarkers || {}}
            medicalReportsUrls={program?.client?.medical_reports_urls || []}
            onClose={() => setIsLabModalOpen(false)}
            onSave={(updatedBiomarkers) => {
              setProgram(prev => ({
                ...prev,
                client: {
                  ...prev.client,
                  biomarkers: updatedBiomarkers
                }
              }));
              setIsLabModalOpen(false);
              showToast('تم تحديث المؤشرات الحيوية والتحاليل في ملف المشترك بنجاح');
            }}
          />
        )}

        {/* Exercise Video Modal */}
        {activeVideoModalEx && (
          <ExerciseVideoModal
            exercise={activeVideoModalEx}
            onClose={() => setActiveVideoModalEx(null)}
          />
        )}

        {/* Floating Notification Toast */}
        {notification && (
          <div 
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#0F172A',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 700,
              zIndex: 99999
            }}
            dir="rtl"
          >
            {notification.msg}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
