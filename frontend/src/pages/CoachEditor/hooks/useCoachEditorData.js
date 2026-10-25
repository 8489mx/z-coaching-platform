import { mealTotalsFromItems } from '../../../utils/mealTotals.js';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../../../config/api';
import { FOOD_DATABASE } from '../../../utils/foodSwapEngine';
import { dynamicRippleRebalanceDailyPlan, rebalanceMealsForTrainingDemand } from '../../../utils/mealPortionBalancer';
import {
  calculateSessionDemand,
  auditWeeklyMuscleVolume,
  calibrateAddedExercise
} from '../../../utils/trainingCouplingUtils';
import defaultMobilityCatalog from '../../../data/mobilityCatalog.json';
import { arabicSearchMatch } from '../../../utils/searchUtils';
import { getExerciseDisplayNames } from '../../../utils/exerciseTranslator';
import { collectCoachAlerts } from '../../../utils/coachAlerts.js';
import { evaluateCardioModality } from '../../../utils/cardioModalitySafety.js';
import { exerciseConflicts } from '../../../utils/exerciseSafety.js';
import { getClientTier } from '../../../utils/tierBadgeHelper';

// Intake injury keys as the coach reads them.
const INJURY_LABELS_AR = { knee: 'الركبة', spine_back: 'أسفل الظهر', shoulder: 'الكتف', core: 'منطقة البطن (الكور)', elbow_wrist: 'الكوع والرسغ' };
import {
  FOOD_DATABASE_LIST,
  EMPTY_PROGRAM,
  CARDIO_MODALITY_OPTIONS
} from '../constants/coachEditorConstants';

export function useCoachEditorData() {
  const { userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const clientCodeParam = userId || searchParams.get('user_id') || searchParams.get('code') || '1';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  // Starts empty: an unsaved screen shows nothing rather than another client's demo plan.
  const [program, setProgram] = useState(EMPTY_PROGRAM);
  const [coachNotes, setCoachNotes] = useState('');
  const [activeSessionIdx, setActiveSessionIdx] = useState(0);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('TRAINING');
  const [notification, setNotification] = useState(null);
  // Set when the server refuses to publish until the coach confirms the medical review (HTTP 409).
  const [medicalReviewPrompt, setMedicalReviewPrompt] = useState(null);
  // Client's logged progression (per-exercise history and next targets) for the coach timeline.
  const [clientProgression, setClientProgression] = useState(null);
  // Client's religious fasting state today and the coach override (AUTO / OFF / FORCE_ON).
  const [clientFasting, setClientFasting] = useState(null);
  const [fastingSaving, setFastingSaving] = useState(false);
  // Client's training cycle status returned from active program
  const [trainingCycle, setTrainingCycle] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeVideoModalEx, setActiveVideoModalEx] = useState(null);
  const [autoRippleEnabled, setAutoRippleEnabled] = useState(true);

  // Clients Queue State & Filters
  const [clientsList, setClientsList] = useState([]);
  const [queueFilter, setQueueFilter] = useState('ALL'); // 'ALL' | 'ACTION_NEEDED' | 'PENDING_PLAN' | 'NEEDS_UPDATE'
  const [queueTierFilter, setQueueTierFilter] = useState('ALL'); // 'ALL' | 'MAX' | 'ELITE'
  const [queueSearch, setQueueSearch] = useState('');

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

      // Only real subscribers. The queue used to fall back to the fifteen demo clients when the
      // server returned none, and to merge each real client with a demo one by position - so a real
      // client carried another person's injuries, package and queue status.
      const enrichedClients = clients.map((c) => {
        const cCode = String(c.client_code || c.id || '');
        const hasPendingCheckin = pendingCheckinUserIds.has(String(c.id)) || pendingCheckinUserIds.has(cCode);
        const submissions = Array.isArray(c.intakeSubmissions) ? c.intakeSubmissions : [];
        const awaitingPlan = submissions.some(s => !['APPROVED', 'REJECTED'].includes(String(s.status || '')));

        let status = 'ACTIVE';
        let statusLabel = 'متابعة اعتيادية';
        let priority = 3;

        if (awaitingPlan) {
          status = 'PENDING_PLAN';
          statusLabel = 'بانتظار خطة جديدة';
          priority = 1;
        } else if (hasPendingCheckin) {
          status = 'NEEDS_UPDATE';
          statusLabel = 'مطلوب تعديل وتدقيق';
          priority = 2;
        }

        const packageName = (c.subscription_package && String(c.subscription_package).includes('MAX')) ? 'باقة MAX' : 'باقة ELITE';

        return {
          ...c,
          client_code: cCode,
          package_name: packageName,
          injuries: Array.isArray(c.injuries) ? c.injuries : [],
          allergies: Array.isArray(c.allergies) ? c.allergies : [],
          queue_status: status,
          queue_label: statusLabel,
          queue_priority: priority
        };
      });

      // What is waiting on the coach comes first, then the rest by code.
      enrichedClients.sort((a, b) => (a.queue_priority - b.queue_priority) ||
        String(a.client_code).localeCompare(String(b.client_code), 'en', { numeric: true }));
      setClientsList(enrichedClients);
    } catch (e) {
      console.warn('fetchClients error:', e);
      setClientsList([]);
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
      setClientFasting(null);
      setTrainingCycle(null);

      // 1. Check if we have custom saved program in DB
      const res = await fetch(`${API_BASE}/api/v1/programs/active/${targetCode}`);
      if (res.ok) {
        const data = await res.json();
        setClientProgression(data.progression || null);
        setClientFasting(data.fasting_context || null);
        setTrainingCycle(data.training_cycle || null);
        if (data.master_program && (data.master_program.nutrition || data.master_program.training || data.master_program.training_program)) {
          const userMeta = data.user || {};
          const mapped = mapMasterToEditor(data.master_program, userMeta);
          setProgram(mapped);
          if (data.master_program.coach_notes) setCoachNotes(data.master_program.coach_notes);
          return;
        }
      }

      // No plan on the server for this client: an empty editor, not a demo plan.
      setProgram({ ...EMPTY_PROGRAM, client: { ...EMPTY_PROGRAM.client, client_code: targetCode } });
      setCoachNotes('');
    } catch (e) {
      console.warn('fetchClientProgram error:', e);
      setProgram(EMPTY_PROGRAM);
    } finally {
      setLoading(false);
    }
  };

  // Mapper for Server Master Program (Handles Training Mesocycle V2, Nutrition V2, and Cardio V2)
  const mapMasterToEditor = (master, user = {}) => {
    const pkg = (user.subscription_package && user.subscription_package.includes('MAX')) ? 'باقة MAX' : 'باقة ELITE';
    const clientInfo = master.client || {};
    // The plan's own summary of the intake (plans built before it existed fall back as before).
    const clientProfile = master.client_profile || null;

    const rawInjuries = (Array.isArray(user.injuries) && user.injuries.length)
      ? user.injuries
      : clientProfile
        ? (clientProfile.injuries.length > 0 ? clientProfile.injuries.map((key) => INJURY_LABELS_AR[key] || key) : ['سليم / متابعة سريرية'])
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
              equipment: ex.equipment || ex.equipment_ar || '',
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
      // A real plan with no sessions stays empty; it must never borrow the demo client's training.
      sessions: mappedSessions
    };

    // 2. Intelligent Nutrition Program Mapping
    const rawNutrition = master.nutrition || master.nutrition_program;
    let mappedMeals = [];
    if (master.nutrition_program && Array.isArray(master.nutrition_program.culinary_meals) && master.nutrition_program.culinary_meals.length > 0) {
      mappedMeals = master.nutrition_program.culinary_meals.map((cm, cmIdx) => ({
        id: `m${cm.meal_number || cmIdx + 1}`,
        name: cm.recipe_title_ar || cm.meal_name_ar || `الوجبة ${cm.meal_number || cmIdx + 1}`,
        time: cmIdx === 0 ? '08:30 ص' : (cmIdx === 1 ? '01:30 م' : (cmIdx === 2 ? '05:30 م' : '09:00 م')),
        // The meal's real totals: the sum of its items (the stored meal macros use other names).
        macros: mealTotalsFromItems(cm.items),
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

    const rawClinicalGuardrails = master.clinical_guardrails ||
      rawNutrition?.targets?.clinical_guardrails ||
      rawNutrition?.clinical_guardrails ||
      null;

    const resolvedNutrition = {
      targets: {
        calories: rawNutrition?.macro_targets?.calories_kcal || rawNutrition?.targets?.calories || 2000,
        protein: rawNutrition?.macro_targets?.protein_g || rawNutrition?.targets?.protein || 150,
        carbs: rawNutrition?.macro_targets?.carbohydrate_g || rawNutrition?.targets?.carbs || 200,
        fats: rawNutrition?.macro_targets?.fat_g || rawNutrition?.targets?.fats || 50,
        clinical_guardrails: rawClinicalGuardrails
      },
      clinical_guardrails: rawClinicalGuardrails,
      coach_alerts: collectCoachAlerts(master),
      beverage_sugar_intake: rawNutrition?.beverage_sugar_intake || null,
      meals: mappedMeals,
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
        // The plan's effective goal (after a redirect or a coach-decides suggestion), in the intake's plain names.
        goal_label: clientInfo.goal_label || ({ FAT_LOSS: 'نزول دهون ووزن', MUSCLE_GAIN: 'زيادة عضل ووزن', BODY_RECOMPOSITION: 'نزول دهون مع شد وبناء عضل' }[master.nutrition_program?.targets?.effective_goal]) || (user.primary_goal === 'muscle_gain' ? 'زيادة عضل ووزن' : 'نزول دهون ووزن'),
        neat_level: user.neat_level || clientInfo.neat_level || 'sedentary',
        neat_label: clientInfo.neat_label || 'خامل / مكتبي (< 5,000 خطوة)',
        package_name: clientInfo.package_name || pkg,
        injuries: rawInjuries,
        allergies: rawAllergies,
        medical_conditions: user.medical_conditions || clientInfo.medical_conditions || clientProfile?.conditions || master.intake?.medical?.conditions || master.intake_decision?.profile?.medical_conditions || [],
        training_env: clientProfile?.training_environment || clientInfo.training_env || 'commercial_gym',
        training_env_label: clientInfo.training_env_label || 'صالة ألعاب رياضية متكاملة',
        training_days: clientInfo.training_days || resolvedTraining.sessions?.length || 3,
        experience_level: clientInfo.experience_level || 'متوسط'
      },
      clinical_guardrails: rawClinicalGuardrails,
      // For the swap screens: the intake summary plus the cardio guardrails.
      client_profile: clientProfile ? { ...clientProfile, hiit_banned: master.cardio_program?.clinical_guardrails?.hiit_banned === true } : null,
      nutrition: resolvedNutrition,
      training: resolvedTraining,
      cardio: resolvedCardio
    };
  };

  const updateFastingOverride = async (override) => {
    setFastingSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/programs/fasting-override`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_code: program?.client?.client_code || clientCodeParam, override }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'تعذر تعديل وضع الصيام', 'error');
        return;
      }
      setClientFasting(data.fasting_context || null);
      showToast('تم تحديث وضع الصيام للمتدرب', 'success');
    } catch {
      showToast('تعذر الاتصال بالخادم، لم يتغير وضع الصيام', 'error');
    } finally {
      setFastingSaving(false);
    }
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

  const handleDuplicateMeal = (mealId) => {
    setProgram(prev => {
      const sourceMeal = (prev.nutrition?.meals || []).find(m => m.id === mealId);
      if (!sourceMeal) return prev;
      const newMealObj = {
        ...sourceMeal,
        id: `m_${Date.now()}`,
        name: `${sourceMeal.name || 'وجبة'} (نسخة)`,
        items: (sourceMeal.items || []).map(it => ({
          ...it,
          id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
        }))
      };
      return {
        ...prev,
        nutrition: {
          ...prev.nutrition,
          meals: [...(prev.nutrition?.meals || []), newMealObj]
        }
      };
    });
    showToast('تم نسخ الوجبة بالكامل بنجاح');
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

      const rawCat = String(selectedFood.macro_type || selectedFood.category || 'PROTEIN').toUpperCase();
      const macroCat = (rawCat === 'FATS' || rawCat === 'FAT') ? 'FAT'
        : (rawCat === 'CARBS' || rawCat === 'CARB') ? 'CARB'
        : (rawCat === 'PROTEINS' || rawCat === 'PROTEIN') ? 'PROTEIN'
        : rawCat;

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

      let smartAmount = selectedFood.default_amount || selectedFood.default_portion || selectedFood.amount || 100;
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
        const neededF = Math.max(3, Math.min(remDailyF > 0 ? remDailyF : mealShareF, mealShareF - mealCurF));
        const foodStr = String((selectedFood.code || '') + ' ' + (selectedFood.name_ar || '') + ' ' + (selectedFood.name || '')).toUpperCase();
        const isOilOrGhee = /OIL|GHEE|BUTTER|زيت|سمن|زبدة/.test(foodStr) && !/PEANUT|فول/.test(foodStr);
        const isSeeds = /CHIA|SEEDS|FLAX|شيا|بذور|كتان/.test(foodStr);
        const isNutButter = /TAHINI|PEANUT|طحينة|فول سوداني/.test(foodStr);
        if (isOilOrGhee) {
          smartAmount = Math.max(5, Math.min(10, Math.round(neededF)));
        } else if (isSeeds) {
          smartAmount = Math.max(5, Math.min(10, Math.round((neededF / f100) * 100)));
        } else if (isNutButter) {
          smartAmount = Math.max(10, Math.min(15, Math.round((neededF / f100) * 100)));
        } else {
          smartAmount = Math.max(15, Math.min(25, Math.round((neededF / f100) * 20) * 5));
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

        const curCat = String(curItem.category || '').toUpperCase();
        const normCurCat = (curCat === 'FATS' || curCat === 'FAT') ? 'FAT'
          : (curCat === 'CARBS' || curCat === 'CARB') ? 'CARB'
          : (curCat === 'PROTEINS' || curCat === 'PROTEIN') ? 'PROTEIN'
          : curCat;

        if (normCurCat === 'PROTEIN') {
          const curProtein = Number(curItem.p) || 25;
          const targetPer100 = Number(targetFood.protein_per_100g || targetFood.p || 25);
          newAmount = Math.max(10, Math.round((curProtein / targetPer100) * 100));
        } else if (normCurCat === 'CARB') {
          const curCarbs = Number(curItem.c) || 30;
          const targetPer100 = Number(targetFood.carbs_per_100g || targetFood.c || 25);
          newAmount = Math.max(10, Math.round((curCarbs / targetPer100) * 100));
        } else if (normCurCat === 'FAT') {
          const curFats = Number(curItem.f) || 8;
          const targetPer100 = Number(targetFood.fat_per_100g || targetFood.f || 10);
          const rawEquiv = Math.round((curFats / targetPer100) * 100);
          const foodStr = String((targetFood.code || '') + ' ' + (targetFood.name_ar || '') + ' ' + (targetFood.name || '')).toUpperCase();
          const isOilOrGhee = /OIL|GHEE|BUTTER|زيت|سمن|زبدة/.test(foodStr) && !/PEANUT|فول/.test(foodStr);
          const isSeeds = /CHIA|SEEDS|FLAX|شيا|بذور|كتان/.test(foodStr);
          const isNutButter = /TAHINI|PEANUT|طحينة|فول سوداني/.test(foodStr);
          if (isOilOrGhee) {
            newAmount = Math.max(5, Math.min(10, rawEquiv));
          } else if (isSeeds) {
            newAmount = Math.max(5, Math.min(10, rawEquiv));
          } else if (isNutButter) {
            newAmount = Math.max(10, Math.min(15, rawEquiv));
          } else {
            newAmount = Math.max(15, Math.min(30, rawEquiv));
          }
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
    // The coach decides, but is told when the pick loads an injured joint or needs missing equipment.
    const conflicts = exerciseConflicts(targetEx.code || targetEx.id, program?.client_profile || {});
    showToast(conflicts.length > 0 ? `تم الاستبدال، لكن انتبه: التمرين ${conflicts.join('، و')}.` : 'تم استبدال التمرين بنجاح', conflicts.length > 0 ? 'warning' : 'success');
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
      if (field === 'safetyNote') {
        updatedExercises[eIdx].cues_ar = value;
      }
      session.exercises = updatedExercises;
      list[sIdx] = session;
      return list;
    });
  };

  const handleDeleteExercise = (sIdx, eIdx) => {
    setProgram(prev => {
      if (!prev?.training) return prev;

      let updatedWeeks = prev.training.weeks ? [...prev.training.weeks] : null;
      let updatedSessions = [...(prev.training.sessions || [])];

      if (updatedWeeks) {
        updatedWeeks = updatedWeeks.map(w => {
          const weekSessions = [...(w.sessions || [])];
          if (weekSessions[sIdx]) {
            weekSessions[sIdx] = {
              ...weekSessions[sIdx],
              exercises: (weekSessions[sIdx].exercises || []).filter((_, idx) => idx !== eIdx)
            };
          }
          return { ...w, sessions: weekSessions };
        });

        const activeWeek = updatedWeeks.find(w => w.week_number === selectedWeek) || updatedWeeks[0];
        if (activeWeek && activeWeek.sessions) {
          updatedSessions = activeWeek.sessions;
        }
      } else {
        if (updatedSessions[sIdx]) {
          updatedSessions[sIdx] = {
            ...updatedSessions[sIdx],
            exercises: (updatedSessions[sIdx].exercises || []).filter((_, idx) => idx !== eIdx)
          };
        }
      }

      // Training-Nutrition Dynamic Coupling
      const targetSession = updatedSessions[sIdx];
      const sessionDemand = calculateSessionDemand(targetSession?.exercises || []);

      let rebalancedMeals = prev.nutrition?.meals || [];
      if (autoRippleEnabled && rebalancedMeals.length > 0) {
        rebalancedMeals = rebalanceMealsForTrainingDemand({
          meals: rebalancedMeals,
          supplements: prev.cardio?.supplements || [],
          targets: prev.nutrition?.targets || {
            calories: prev.nutrition?.target_calories || 2000,
            protein: prev.nutrition?.target_protein || 150,
            carbs: prev.nutrition?.target_carbs || 200,
            fats: prev.nutrition?.target_fats || 50
          },
          sessionDemand,
          autoRippleEnabled: true
        });
      }

      return {
        ...prev,
        training: {
          ...prev.training,
          sessions: updatedSessions,
          ...(updatedWeeks ? { weeks: updatedWeeks } : {})
        },
        nutrition: {
          ...(prev.nutrition || {}),
          meals: rebalancedMeals
        }
      };
    });
    showToast('تم حذف التمرين ومواءمة الوجبات تلقائياً');
  };

  const handleMoveExercise = (sIdx, eIdx, direction) => {
    updateProgramTrainingSessions(sessionsList => {
      const list = [...sessionsList];
      const session = { ...list[sIdx] };
      const exList = [...(session.exercises || [])];
      const targetIdx = direction === 'UP' ? eIdx - 1 : eIdx + 1;
      if (targetIdx < 0 || targetIdx >= exList.length) return list;
      const temp = exList[eIdx];
      exList[eIdx] = exList[targetIdx];
      exList[targetIdx] = temp;
      session.exercises = exList;
      list[sIdx] = session;
      return list;
    });
  };

  const handleDuplicateSession = (sIdx) => {
    setProgram(prev => {
      if (!prev?.training) return prev;
      let updatedWeeks = prev.training.weeks ? [...prev.training.weeks] : null;
      let updatedSessions = [...(prev.training.sessions || [])];
      const now = Date.now();

      if (updatedWeeks && updatedWeeks.length > 0) {
        updatedWeeks = updatedWeeks.map((w, wIdx) => {
          const weekSessions = [...(w.sessions || [])];
          const srcSess = weekSessions[sIdx];
          if (!srcSess) return w;
          const clonedExercises = (srcSess.exercises || []).map((ex, eIdx) => ({
            ...ex,
            id: `ex_copy_${now}_w${w.week_number || wIdx}_${eIdx}`
          }));
          const baseName = srcSess.name || 'اليوم التدريبي';
          const clonedSession = {
            ...srcSess,
            id: `sess_copy_${now}_w${w.week_number || wIdx}`,
            name: baseName.includes('(نسخة)') ? baseName : `${baseName} (نسخة)`,
            exercises: clonedExercises
          };
          weekSessions.splice(sIdx + 1, 0, clonedSession);
          return { ...w, sessions: weekSessions };
        });

        const activeWeek = updatedWeeks.find(w => w.week_number === selectedWeek) || updatedWeeks[0];
        if (activeWeek && activeWeek.sessions) {
          updatedSessions = activeWeek.sessions;
        }
      } else {
        const srcSess = updatedSessions[sIdx];
        if (srcSess) {
          const clonedExercises = (srcSess.exercises || []).map((ex, eIdx) => ({
            ...ex,
            id: `ex_copy_${now}_${eIdx}`
          }));
          const baseName = srcSess.name || 'اليوم التدريبي';
          const clonedSession = {
            ...srcSess,
            id: `sess_copy_${now}`,
            name: baseName.includes('(نسخة)') ? baseName : `${baseName} (نسخة)`,
            exercises: clonedExercises
          };
          updatedSessions.splice(sIdx + 1, 0, clonedSession);
        }
      }

      const newTraining = {
        ...prev.training,
        sessions: updatedSessions,
        ...(Array.isArray(prev.training.workout_days) ? { workout_days: updatedSessions } : {}),
        ...(Array.isArray(prev.training.days) ? { days: updatedSessions } : {}),
        ...(updatedWeeks ? { weeks: updatedWeeks } : {})
      };

      const syncObj = {
        ...prev,
        training: newTraining
      };

      if (prev.training_program) {
        syncObj.training_program = {
          ...prev.training_program,
          sessions: updatedSessions,
          ...(updatedWeeks ? { weeks: updatedWeeks } : {})
        };
      }
      if (prev.training_split) {
        syncObj.training_split = {
          ...prev.training_split,
          sessions: updatedSessions
        };
      }

      return syncObj;
    });

    setActiveSessionIdx(sIdx + 1);
    showToast('تم نسخ اليوم التدريبي بالكامل بنجاح ومزامنته في الخطة');
  };

  const handleDeleteSession = (sIdx) => {
    const currentSessionsList = (program?.training?.weeks && currentWeekData?.sessions)
      ? currentWeekData.sessions
      : (program?.training?.sessions || []);

    if (currentSessionsList.length <= 1) {
      showToast('لا يمكن حذف اليوم، يجب أن يحتوي البرنامج على يوم تدريبي واحد على الأقل', 'error');
      return;
    }

    const sessToDelete = currentSessionsList[sIdx];
    const sessName = sessToDelete?.name || `اليوم التدريبي ${sIdx + 1}`;

    if (typeof window !== 'undefined' && window.confirm && !window.confirm(`هل أنت متأكد من حذف ${sessName} نهائياً من البرنامج؟`)) {
      return;
    }

    let nextActiveIdx = activeSessionIdx;
    if (activeSessionIdx >= currentSessionsList.length - 1) {
      nextActiveIdx = Math.max(0, currentSessionsList.length - 2);
    } else if (activeSessionIdx > sIdx) {
      nextActiveIdx = activeSessionIdx - 1;
    }

    setProgram(prev => {
      if (!prev?.training) return prev;
      let updatedWeeks = prev.training.weeks ? [...prev.training.weeks] : null;
      let updatedSessions = [...(prev.training.sessions || [])];

      if (updatedWeeks && updatedWeeks.length > 0) {
        updatedWeeks = updatedWeeks.map(w => {
          const weekSessions = [...(w.sessions || [])].filter((_, idx) => idx !== sIdx);
          return { ...w, sessions: weekSessions };
        });

        const activeWeek = updatedWeeks.find(w => w.week_number === selectedWeek) || updatedWeeks[0];
        if (activeWeek && activeWeek.sessions) {
          updatedSessions = activeWeek.sessions;
        }
      } else {
        updatedSessions = updatedSessions.filter((_, idx) => idx !== sIdx);
      }

      const targetSession = updatedSessions[nextActiveIdx] || updatedSessions[0];
      const sessionDemand = calculateSessionDemand(targetSession?.exercises || []);

      let rebalancedMeals = prev.nutrition?.meals || [];
      if (autoRippleEnabled && rebalancedMeals.length > 0) {
        rebalancedMeals = rebalanceMealsForTrainingDemand({
          meals: rebalancedMeals,
          supplements: prev.cardio?.supplements || [],
          targets: prev.nutrition?.targets || {
            calories: prev.nutrition?.target_calories || 2000,
            protein: prev.nutrition?.target_protein || 150,
            carbs: prev.nutrition?.target_carbs || 200,
            fats: prev.nutrition?.target_fats || 50
          },
          sessionDemand,
          autoRippleEnabled: true
        });
      }

      const newTraining = {
        ...prev.training,
        sessions: updatedSessions,
        ...(Array.isArray(prev.training.workout_days) ? { workout_days: updatedSessions } : {}),
        ...(Array.isArray(prev.training.days) ? { days: updatedSessions } : {}),
        ...(updatedWeeks ? { weeks: updatedWeeks } : {})
      };

      const syncObj = {
        ...prev,
        training: newTraining,
        nutrition: {
          ...prev.nutrition,
          meals: rebalancedMeals
        }
      };

      if (prev.training_program) {
        syncObj.training_program = {
          ...prev.training_program,
          sessions: updatedSessions,
          ...(updatedWeeks ? { weeks: updatedWeeks } : {})
        };
      }
      if (prev.training_split) {
        syncObj.training_split = {
          ...prev.training_split,
          sessions: updatedSessions
        };
      }

      return syncObj;
    });

    setActiveSessionIdx(nextActiveIdx);
    showToast(`تم حذف ${sessName} بنجاح ومزامنة الخطة`);
  };

  const handleAddExerciseToSession = (sIdx, ex) => {
    const names = getExerciseDisplayNames(ex);

    setProgram(prev => {
      if (!prev?.training) return prev;

      let updatedWeeks = prev.training.weeks ? [...prev.training.weeks] : null;
      let updatedSessions = [...(prev.training.sessions || [])];

      if (updatedWeeks) {
        updatedWeeks = updatedWeeks.map(w => {
          const weekSessions = [...(w.sessions || [])];
          if (weekSessions[sIdx]) {
            const weekCalibrated = calibrateAddedExercise(ex, w.week_number || selectedWeek, prev.client || {});
            weekSessions[sIdx] = {
              ...weekSessions[sIdx],
              exercises: [...(weekSessions[sIdx].exercises || []), weekCalibrated]
            };
          }
          return { ...w, sessions: weekSessions };
        });

        const activeWeek = updatedWeeks.find(w => w.week_number === selectedWeek) || updatedWeeks[0];
        if (activeWeek && activeWeek.sessions) {
          updatedSessions = activeWeek.sessions;
        }
      } else {
        const calibratedEx = calibrateAddedExercise(ex, selectedWeek, prev.client || {});
        if (updatedSessions[sIdx]) {
          updatedSessions[sIdx] = {
            ...updatedSessions[sIdx],
            exercises: [...(updatedSessions[sIdx].exercises || []), calibratedEx]
          };
        }
      }

      // Training-Nutrition Dynamic Coupling
      const targetSession = updatedSessions[sIdx];
      const sessionDemand = calculateSessionDemand(targetSession?.exercises || []);

      let rebalancedMeals = prev.nutrition?.meals || [];
      if (autoRippleEnabled && rebalancedMeals.length > 0) {
        rebalancedMeals = rebalanceMealsForTrainingDemand({
          meals: rebalancedMeals,
          supplements: prev.cardio?.supplements || [],
          targets: prev.nutrition?.targets || {
            calories: prev.nutrition?.target_calories || 2000,
            protein: prev.nutrition?.target_protein || 150,
            carbs: prev.nutrition?.target_carbs || 200,
            fats: prev.nutrition?.target_fats || 50
          },
          sessionDemand,
          autoRippleEnabled: true
        });
      }

      return {
        ...prev,
        training: {
          ...prev.training,
          sessions: updatedSessions,
          ...(updatedWeeks ? { weeks: updatedWeeks } : {})
        },
        nutrition: {
          ...(prev.nutrition || {}),
          meals: rebalancedMeals
        }
      };
    });

    setAddExModal({ open: false, sessionIdx: null });
    showToast(`تمت إضافة ${names.nameEn} (${names.nameAr}) ومواءمة الوجبات مع كثافة التدريب`);
  };

  const handleSelectCardioModality = (opt) => {
    const verdict = evaluateCardioModality(opt.id, program?.client_profile || {});
    if (!verdict.allowed) {
      showToast(`النمط ده مش مناسب للعميل: ${verdict.reasons_ar.join(' ')}`);
      return;
    }
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

  const handleSaveDraft = async (publishArg = false, medicalReviewConfirmed = false) => {
    // Only an explicit true publishes (an onClick handler would otherwise pass the click event).
    const isPublish = publishArg === true;
    try {
      // Clinical Safety Verification: Tier CS-0 (Kidney, Hypertension, Asthma)
      const clinicalGuardrails = program?.clinical_guardrails || program?.nutrition?.clinical_guardrails || program?.nutrition?.targets?.clinical_guardrails;
      const clientConditions = [
        ...(Array.isArray(program?.client?.injuries) ? program.client.injuries : []),
        ...(Array.isArray(program?.client?.allergies) ? program.client.allergies : []),
        ...(Array.isArray(program?.client?.medical_conditions) ? program.client.medical_conditions : []),
      ];

      const clinicalAlerts = [];

      // 1. Kidney Protein Cap Check
      // A protein cap comes from the bloodwork now; a declared kidney diagnosis is outside the service.
      const hasProteinCap = Boolean(clinicalGuardrails?.kidney_protein_capped);
      const maxSafeProtein = Number(clinicalGuardrails?.max_protein_g) || 0;
      const targetP = Number(program?.nutrition?.targets?.protein) || 0;
      const mealsP = (program?.nutrition?.meals || []).reduce((sum, m) => sum + (Number(m.macros?.protein) || 0), 0);
      const suppsP = (program?.cardio?.supplements || []).reduce((sum, s) => sum + (Number(s.protein ?? s.p) || 0), 0);
      const currentEffectiveP = Math.max(targetP, mealsP + suppsP);

      if (hasProteinCap && maxSafeProtein > 0 && currentEffectiveP > maxSafeProtein) {
        clinicalAlerts.push(`• وظائف الكلى في التحاليل: البروتين المحدد (${currentEffectiveP} جم) يتجاوز السقف اللي التحاليل حددته (${maxSafeProtein} جم).`);
      }

      // 2. Hypertension Contraindicated Exercises & RIR Check
      const hasHypertension = Boolean(
        clinicalGuardrails?.hypertension_guard_active ||
        clientConditions.some(c => {
          const s = typeof c === 'string' ? c : (c?.conditionCode || c?.name || c?.area || '');
          return /hypertension|ضغط|ارتفاع.*الضغط/i.test(s);
        })
      );

      if (hasHypertension && program?.training) {
        const allExercises = [];
        if (Array.isArray(program.training.weeks)) {
          program.training.weeks.forEach(w => {
            (w.sessions || []).forEach(s => {
              (s.exercises || []).forEach(e => allExercises.push(e));
            });
          });
        }
        if (Array.isArray(program.training.sessions)) {
          program.training.sessions.forEach(s => {
            (s.exercises || []).forEach(e => allExercises.push(e));
          });
        }

        const bannedCodes = ['LEG_PRESS_MACHINE', 'INCLINE_LEG_PRESS', 'DECLINE_CRUNCH', 'DECLINE_BENCH_PRESS', 'INVERTED_BODYWEIGHT_ROW'];
        const bannedEx = allExercises.filter(e => bannedCodes.includes(String(e.code || e.exercise_code || '')));
        const lowRirEx = allExercises.filter(e => {
          const rir = e.rir ?? e.prescription?.target_rir;
          return rir !== undefined && rir !== null && Number(rir) < 2;
        });

        if (bannedEx.length > 0) {
          const names = bannedEx.map(e => e.name_ar || e.name || e.code).slice(0, 3).join('، ');
          clinicalAlerts.push(`• ضغط الدم (ACSM/AHA): وجود تمارين ترفع الضغط الشرياني ومناورة فالسافا: (${names}).`);
        }
        if (lowRirEx.length > 0) {
          clinicalAlerts.push(`• ضغط الدم (ACSM/AHA): تمارين بشدة قصوى (RIR < 2) غير مسموح بها لمرضى الضغط الشرياني.`);
        }
      }

      // 3. Asthma / Respiratory HIIT Cardio Check
      const hasAsthma = Boolean(
        clientConditions.some(c => {
          const s = typeof c === 'string' ? c : (c?.conditionCode || c?.name || c?.area || '');
          return /asthma|ربو|تنفسي|respiratory/i.test(s);
        })
      );

      if (hasAsthma && program?.cardio) {
        const modality = String(program.cardio.modality || '');
        const zone = String(program.cardio.target_heart_rate_zone || '');
        const isHiitCardio = /hiit|sprint|كثافة عالية/i.test(modality) || /hiit|zone 4/i.test(zone);

        if (isHiitCardio) {
          clinicalAlerts.push(`• الربو والجهاز التنفسي (GINA): نمط الكارديو المختار (${modality || zone}) عالي الشدة (HIIT) ويرفع خطر نوبات ضيق التنفس التحسسية (EIB).`);
        }
      }

      // Show confirmation dialog if any clinical alerts exist
      if (clinicalAlerts.length > 0) {
        const confirmMsg = `تنبيه سريري هام للمدرب (Tier CS-0 Guardrails):\nتم رصد الملاحظات الطبية التالية في الخطة المعدلة:\n\n${clinicalAlerts.join('\n')}\n\nهل ترغب باعتماد وحفظ هذه الخطة تحت مسؤوليتك المهنية وإشرافك؟\n(سيتم توثيق هذا الإجراء في سجل المتابعة السريرية للبرنامج)`;
        if (typeof window !== 'undefined' && window.confirm && !window.confirm(confirmMsg)) {
          return;
        }
      }

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
        is_published: isPublish,
        medical_review_confirmed: medicalReviewConfirmed === true
      };
      
      const res = await fetch(`${API_BASE}/api/v1/programs/update-custom`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409 && data.code === 'MEDICAL_REVIEW_CONFIRMATION_REQUIRED') {
        setMedicalReviewPrompt({ message: data.error, reasons: Array.isArray(data.reasons) ? data.reasons : [] });
        return;
      }
      if (!res.ok) {
        showToast(data.error || 'تعذر حفظ الخطة، لم يتم النشر', 'error');
        return;
      }

      if (data.clinical_warning) {
        showToast(data.clinical_warning, 'warning');
      } else if (isPublish) {
        showToast('تم اعتماد ونشر الخطة بنجاح للمشترك وتفعيلها في التطبيق', 'success');
        setTimeout(() => {
          navigate('/');
        }, 1400);
      } else {
        showToast('تم حفظ تعديلات الخطة بنجاح');
      }
    } catch {
      showToast('تعذر الاتصال بالخادم، لم يتم حفظ أو نشر الخطة', 'error');
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  const handleApproveAndPublish = async () => {
    await handleSaveDraft(true);
  };

  const confirmMedicalReviewAndPublish = async () => {
    setMedicalReviewPrompt(null);
    await handleSaveDraft(true, true);
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

      if (queueFilter === 'ACTION_NEEDED') return (c.queue_status === 'PENDING_PLAN' || c.queue_status === 'NEEDS_UPDATE');
      if (queueFilter === 'PENDING_PLAN') return c.queue_status === 'PENDING_PLAN';
      if (queueFilter === 'NEEDS_UPDATE') return c.queue_status === 'NEEDS_UPDATE';

      if (queueTierFilter === 'MAX' && getClientTier(c) !== 'MAX') return false;
      if (queueTierFilter === 'ELITE' && getClientTier(c) === 'MAX') return false;

      return true;
    });
  }, [clientsList, queueFilter, queueTierFilter, queueSearch]);

  const displayedQueue = useMemo(() => {
    return filteredQueue.slice(0, 35);
  }, [filteredQueue]);

  const urgentCount = clientsList.filter(c => c.queue_status === 'PENDING_PLAN' || c.queue_status === 'NEEDS_UPDATE').length;
  const pendingPlanCount = clientsList.filter(c => c.queue_status === 'PENDING_PLAN').length;
  const needsUpdateCount = clientsList.filter(c => c.queue_status === 'NEEDS_UPDATE').length;

  const currentWeekData = program?.training?.weeks?.find(w => w.week_number === selectedWeek);
  const currentSessions = (program?.training?.weeks && currentWeekData?.sessions) ? currentWeekData.sessions : (program?.training?.sessions || []);
  const activeSession = currentSessions?.[activeSessionIdx] || currentSessions?.[0];

  const activeSessionDemand = useMemo(() => {
    return calculateSessionDemand(activeSession?.exercises || []);
  }, [activeSession?.exercises]);

  const weeklyVolumeAudit = useMemo(() => {
    return auditWeeklyMuscleVolume(currentSessions || [], program?.client?.experience_level);
  // مقصود: التأثير يعمل عند تغيّر مفتاحه فقط. إضافة الدوال للتبعيات تُعاد إنشاؤها كل رندر فتدخل في حلقة إعادة تشغيل.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessions, program?.client?.experience_level]);

  return {
    clientCodeParam,
    searchParams,
    setSearchParams,
    loading,
    setLoading,
    saving,
    setSaving,
    publishing,
    setPublishing,
    program,
    setProgram,
    activeSessionDemand,
    weeklyVolumeAudit,
    coachNotes,
    setCoachNotes,
    activeSessionIdx,
    setActiveSessionIdx,
    activeWorkspaceTab,
    setActiveWorkspaceTab,
    notification,
    setNotification,
    selectedWeek,
    setSelectedWeek,
    activeVideoModalEx,
    setActiveVideoModalEx,
    autoRippleEnabled,
    setAutoRippleEnabled,
    clientsList,
    setClientsList,
    queueFilter,
    setQueueFilter,
    queueTierFilter,
    setQueueTierFilter,
    queueSearch,
    setQueueSearch,
    allExercisesList,
    setAllExercisesList,
    cardioSwapModal,
    setCardioSwapModal,
    isLabModalOpen,
    setIsLabModalOpen,
    addFoodModal,
    setAddFoodModal,
    swapFoodModal,
    setSwapFoodModal,
    addExModal,
    setAddExModal,
    swapExModal,
    setSwapExModal,
    mobilityModal,
    setMobilityModal,
    allMobilityList,
    setAllMobilityList,
    showReasoning,
    setShowReasoning,
    exModalSearch,
    setExModalSearch,
    addExMuscleFilter,
    setAddExMuscleFilter,
    addExEquipmentFilter,
    setAddExEquipmentFilter,
    foodModalSearch,
    setFoodModalSearch,
    mobilityModalSearch,
    setMobilityModalSearch,
    swapFoodSearch,
    setSwapFoodSearch,
    swapExSearch,
    setSwapExSearch,
    fetchClients,
    fetchExercises,
    fetchMobility,
    handleSelectClient,
    fetchClientProgram,
    showToast,
    handleUpdateFoodAmount,
    handleDeleteFood,
    handleAddNewMeal,
    handleDuplicateMeal,
    handleDeleteMeal,
    handleAddFoodToMeal,
    handleExecuteFoodSwap,
    updateProgramTrainingSessions,
    handleExecuteExerciseSwap,
    handleUpdateExerciseParam,
    handleMoveExercise,
    handleDuplicateSession,
    handleDeleteSession,
    handleDeleteExercise,
    handleAddExerciseToSession,
    handleSelectCardioModality,
    handleUpdateCardioParam,
    handleUpdateSupplementsInCardio,
    handleAddMobilityToSession,
    handleRemoveMobilityFromSession,
    handleSaveDraft,
    handleApproveAndPublish,
    medicalReviewPrompt,
    setMedicalReviewPrompt,
    clientProgression,
    clientFasting,
    fastingSaving,
    trainingCycle,
    setTrainingCycle,
    updateFastingOverride,
    confirmMedicalReviewAndPublish,
    filteredQueue,
    displayedQueue,
    urgentCount,
    pendingPlanCount,
    needsUpdateCount,
    currentWeekData,
    currentSessions,
    activeSession,
    FOOD_DATABASE_LIST,
    CARDIO_MODALITY_OPTIONS
  };
}
