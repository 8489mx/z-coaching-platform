import React, { useState } from 'react';
import { Save, Send, Dumbbell, Utensils, FileText, Activity, Loader2, Plus, Trash2, RotateCw, HeartPulse, Printer, X, ArrowRightLeft, Users, Clock, AlertCircle, CheckCircle2, Search, Check, Zap, Target, ShieldAlert, Flame, Copy } from 'lucide-react';
import { balanceMealItems, balanceAllDayMeals, dynamicRippleRebalanceDailyPlan } from '../../../utils/mealPortionBalancer.js';
import { auditDeficitVolumeShield, evaluateProteinSparingRequirement, syncCarbCyclingWithSessions } from '../../../utils/trainingCouplingUtils.js';

// Quick Meal Presets for Instant Precision Nutrition Building
const QUICK_MEAL_PRESETS = [
  {
    name: 'شوفان بالبروتين والتوت',
    items: [
      { code: 'OATMEAL_RAW', name: 'شوفان كامل الحبة', amount: 60, unit: 'جم', p: 8.1, c: 40.8, f: 3.9, cal: 225, category: 'CARB' },
      { code: 'SKIM_MILK', name: 'حليب خالي الدسم', amount: 200, unit: 'مل', p: 6.8, c: 10.0, f: 0.2, cal: 70, category: 'CARB' },
      { code: 'WHEY_PROTEIN_ISOLATE', name: 'واي بروتين معزول (Whey Isolate)', amount: 30, unit: 'جم', p: 27.0, c: 1.0, f: 0.5, cal: 115, category: 'PROTEIN' },
      { code: 'FRESH_BLUEBERRIES', name: 'توت أزرق طازج', amount: 50, unit: 'جم', p: 0.4, c: 7.2, f: 0.2, cal: 29, category: 'CARB' }
    ]
  },
  {
    name: 'دجاج مشوي وأرز بسمتي وبروكلي',
    items: [
      { code: 'CHICKEN_BREAST', name: 'صدور دجاج مشوية', amount: 180, unit: 'جم', p: 55.8, c: 0.0, f: 6.5, cal: 297, category: 'PROTEIN' },
      { code: 'BASMATI_RICE', name: 'أرز بسمتي أبيض مطبوخ', amount: 160, unit: 'جم', p: 4.3, c: 44.8, f: 0.5, cal: 208, category: 'CARB' },
      { code: 'STEAMED_BROCCOLI', name: 'بروكلي مطبوخ على البخار', amount: 100, unit: 'جم', p: 2.8, c: 7.2, f: 0.4, cal: 35, category: 'CARB' },
      { code: 'EXTRA_VIRGIN_OLIVE_OIL', name: 'زيت زيتون بكر ممتاز', amount: 7, unit: 'مل', p: 0.0, c: 0.0, f: 7.0, cal: 62, category: 'FAT' }
    ]
  },
  {
    name: 'كفتة لحم بقري وبطاطس ودجز',
    items: [
      { code: 'GROUND_BEEF_90_10', name: 'لحم بقري مفروم قليل الدهن (90/10)', amount: 160, unit: 'جم', p: 41.6, c: 0.0, f: 16.0, cal: 315, category: 'PROTEIN' },
      { code: 'AIRFRYER_POTATO_WEDGES', name: 'بطاطس ودجز بالقلاية الهوائية', amount: 180, unit: 'جم', p: 3.6, c: 37.8, f: 1.8, cal: 184, category: 'CARB' },
      { code: 'FRESH_TOMATOES', name: 'طماطم طازجة', amount: 100, unit: 'جم', p: 0.9, c: 3.9, f: 0.2, cal: 18, category: 'CARB' }
    ]
  },
  {
    name: 'فيليه أبيض وبطاطا حلوة مشوية',
    items: [
      { code: 'WHITE_FISH_FILLET', name: 'سمك فيليه أبيض مشوي بالأعشاب', amount: 200, unit: 'جم', p: 48.0, c: 0.0, f: 3.0, cal: 220, category: 'PROTEIN' },
      { code: 'SWEET_POTATO', name: 'بطاطا حلوة مشوية', amount: 180, unit: 'جم', p: 3.6, c: 43.2, f: 0.4, cal: 189, category: 'CARB' },
      { code: 'GREEN_BEANS', name: 'فاصوليا خضراء سوتيه', amount: 100, unit: 'جم', p: 1.8, c: 7.0, f: 0.2, cal: 31, category: 'CARB' },
      { code: 'EXTRA_VIRGIN_OLIVE_OIL', name: 'زيت زيتون بكر ممتاز', amount: 5, unit: 'مل', p: 0.0, c: 0.0, f: 5.0, cal: 44, category: 'FAT' }
    ]
  },
  {
    name: 'عشاء جبنة قريش بالبيض وزيت الزيتون',
    items: [
      { code: 'COTTAGE_CHEESE', name: 'جبن قريش طبيعي', amount: 200, unit: 'جم', p: 24.0, c: 6.8, f: 2.0, cal: 144, category: 'PROTEIN' },
      { code: 'EGGS_BOILED', name: 'بيض مسلوق كامل', amount: 1, unit: 'بيضة', p: 6.3, c: 0.4, f: 5.0, cal: 72, category: 'PROTEIN' },
      { code: 'EXTRA_VIRGIN_OLIVE_OIL', name: 'زيت زيتون بكر ممتاز', amount: 7, unit: 'مل', p: 0.0, c: 0.0, f: 7.0, cal: 62, category: 'FAT' },
      { code: 'FRESH_CUCUMBER', name: 'خيار طازج', amount: 120, unit: 'جم', p: 0.8, c: 4.3, f: 0.1, cal: 18, category: 'CARB' }
    ]
  },
  {
    name: 'سلطة مكرونة وتونة رياضية',
    items: [
      { code: 'CANNED_TUNA_WATER', name: 'تونة مصفاة من الماء والملح', amount: 150, unit: 'جم', p: 39.0, c: 0.0, f: 1.2, cal: 174, category: 'PROTEIN' },
      { code: 'COOKED_WHITE_PASTA', name: 'مكرونة مسلوقة (Al Dente)', amount: 150, unit: 'جم', p: 7.5, c: 45.0, f: 1.5, cal: 237, category: 'CARB' },
      { code: 'NATURAL_OLIVES', name: 'زيتون كلاماتا طبيعي', amount: 25, unit: 'جم', p: 0.2, c: 1.5, f: 3.8, cal: 40, category: 'FAT' },
      { code: 'BELL_PEPPERS', name: 'فلفل رومي ملون', amount: 80, unit: 'جم', p: 0.8, c: 4.8, f: 0.2, cal: 24, category: 'CARB' }
    ]
  },
  {
    name: 'سناك ترمس بلدي مسلوق ورايس كيك وزبدة فول سوداني',
    items: [
      { code: 'TERMIS_LUPINI', name: 'ترمس بلدي مسلوق بالليمون والكمون', amount: 120, unit: 'جم', p: 19.2, c: 12.0, f: 3.6, cal: 144, category: 'PROTEIN' },
      { code: 'RICE_CAKES', name: 'رايس كيك (3 أقراص)', amount: 27, unit: 'جم', p: 2.2, c: 22.1, f: 0.4, cal: 101, category: 'CARB' },
      { code: 'NATURAL_PEANUT_BUTTER', name: 'زبدة فول سوداني طبيعية', amount: 15, unit: 'جم', p: 3.8, c: 3.0, f: 7.5, cal: 88, category: 'FAT' }
    ]
  },
  {
    name: 'سناك حمص الشام دايت وشوكولاتة داكنة 85%',
    items: [
      { code: 'HALABESSA_CHICKPEAS', name: 'حمص الشام دايت بالليمون والكمون (حلبسة)', amount: 150, unit: 'جم', p: 12.8, c: 37.5, f: 3.6, cal: 232, category: 'CARB' },
      { code: 'DARK_CHOCOLATE_85', name: 'شوكولاتة داكنة 85% كاكاو نقي', amount: 15, unit: 'جم', p: 1.2, c: 4.2, f: 6.9, cal: 87, category: 'FAT' }
    ]
  },
  {
    name: 'سناك فشار منزلي خفيف وزبادي يوناني بالتوت',
    items: [
      { code: 'AIR_POPPED_POPCORN', name: 'فشار منزلي خفيف بالقلاية الهوائية', amount: 30, unit: 'جم', p: 3.6, c: 22.2, f: 1.2, cal: 114, category: 'CARB' },
      { code: 'GREEK_YOGURT_NONFAT', name: 'زبادي يوناني سادة خالي الدسم', amount: 150, unit: 'جم', p: 15.0, c: 5.4, f: 0.6, cal: 88, category: 'PROTEIN' },
      { code: 'FRESH_BLUEBERRIES', name: 'توت أزرق طازج', amount: 40, unit: 'جم', p: 0.3, c: 5.6, f: 0.1, cal: 23, category: 'CARB' }
    ]
  }
];

export default function CoachEditorNutritionTab(props) {
  const { searchParams, setSearchParams, loading, setLoading, saving, setSaving, publishing, setPublishing, program, setProgram, coachNotes, setCoachNotes, activeSessionIdx, setActiveSessionIdx, activeWorkspaceTab, setActiveWorkspaceTab, notification, setNotification, clientsList, setClientsList, queueFilter, setQueueFilter, queueSearch, setQueueSearch, showQueueSlider, setShowQueueSlider, allExercisesList, setAllExercisesList, cardioSwapModal, setCardioSwapModal, addFoodModal, setAddFoodModal, swapFoodModal, setSwapFoodModal, addExModal, setAddExModal, swapExModal, setSwapExModal, mobilityModal, setMobilityModal, allMobilityList, setAllMobilityList, showReasoning, setShowReasoning, exModalSearch, setExModalSearch, foodModalSearch, setFoodModalSearch, mobilityModalSearch, setMobilityModalSearch, swapFoodSearch, setSwapFoodSearch, swapExSearch, setSwapExSearch, handleSelectClient, handleUpdateFoodAmount, handleDeleteFood, handleAddNewMeal, handleDuplicateMeal, handleDeleteMeal, handleAddFoodToMeal, handleExecuteFoodSwap, handleExecuteExerciseSwap, handleUpdateExerciseParam, handleDeleteExercise, handleAddExerciseToSession, handleSelectCardioModality, handleAddMobilityToSession, handleRemoveMobilityFromSession, handleSaveDraft, handleApproveAndPublish, FOOD_DATABASE_LIST, CARDIO_MODALITY_OPTIONS } = props;

  const showToast = props.showToast || ((msg) => console.log(msg));

  const [localAutoRipple, setLocalAutoRipple] = useState(true);
  const isAutoRippleOn = props.autoRippleEnabled !== undefined ? props.autoRippleEnabled : localAutoRipple;
  const toggleAutoRipple = () => {
    if (props.setAutoRippleEnabled) {
      props.setAutoRippleEnabled(!isAutoRippleOn);
    } else {
      setLocalAutoRipple(!isAutoRippleOn);
    }
    showToast(!isAutoRippleOn ? 'تم تفعيل الموازنة التلقائية اللحظية لكامل اليوم' : 'تم إيقاف الموازنة التلقائية (وضع يدوي ثابت)');
  };

  const targetCal = Number(program?.nutrition?.targets?.calories) || 2000;
  const targetP = Number(program?.nutrition?.targets?.protein) || 150;
  const targetC = Number(program?.nutrition?.targets?.carbs) || 200;
  const targetF = Number(program?.nutrition?.targets?.fats) || 60;

  // Clinical Guardrails & Kidney Disease Safety Analysis
  const clinicalGuardrails = program?.clinical_guardrails ||
    program?.nutrition?.clinical_guardrails ||
    program?.nutrition?.targets?.clinical_guardrails;

  const clientConditions = [
    ...(Array.isArray(program?.client?.injuries) ? program.client.injuries : []),
    ...(Array.isArray(program?.client?.allergies) ? program.client.allergies : []),
    ...(Array.isArray(program?.client?.medical_conditions) ? program.client.medical_conditions : []),
  ];

  const hasKidneyCondition = Boolean(
    clinicalGuardrails?.kidney_protein_capped ||
    clientConditions.some(c => {
      const s = typeof c === 'string' ? c : (c?.conditionCode || c?.name || c?.area || '');
      return /kidney|ckd|كلى|قصور.*كلوي|وظائف.*الكلى/i.test(s);
    })
  );

  const clientWeightKg = Number(program?.client?.weight_kg) || 80;
  const maxSafeProtein = Number(clinicalGuardrails?.max_protein_g) || Math.round(clientWeightKg * 1.0);

  const activeSessions = (program?.training?.sessions && program.training.sessions.length > 0)
    ? program.training.sessions
    : (Array.isArray(program?.training?.weeks) && program.training.weeks.length > 0)
      ? (program.training.weeks[0]?.sessions || [])
      : (Array.isArray(program?.training_program?.weeks) && program.training_program.weeks.length > 0)
        ? (program.training_program.weeks[0]?.sessions || [])
        : [];

  const clientTdee = Number(program?.client?.tdee || (targetCal >= 2000 ? targetCal + 450 : 2400));

  const deficitVolumeShield = auditDeficitVolumeShield({
    sessions: activeSessions,
    targetCalories: targetCal,
    tdee: clientTdee
  });

  const proteinSparing = evaluateProteinSparingRequirement({
    targetCalories: targetCal,
    tdee: clientTdee,
    clientWeightKg,
    currentProteinG: targetP,
    hasKidneyCondition,
    clinicalGuardrails
  });

  const [showCarbCyclingModal, setShowCarbCyclingModal] = useState(false);
  const carbCyclingPlan = syncCarbCyclingWithSessions({
    sessions: activeSessions,
    baselineDailyCalories: targetCal,
    baselineProteinG: targetP,
    baselineCarbsG: targetC,
    baselineFatG: targetF
  });

  // Quick Targets Edit Modal State
  const [showEditTargetsModal, setShowEditTargetsModal] = useState(false);
  const [editTargetsState, setEditTargetsState] = useState({
    calories: targetCal,
    protein: targetP,
    carbs: targetC,
    fats: targetF
  });

  const handleSaveCustomTargets = () => {
    const newCal = Number(editTargetsState.calories) || targetCal;
    const newP = Number(editTargetsState.protein) || targetP;
    const newC = Number(editTargetsState.carbs) || targetC;
    const newF = Number(editTargetsState.fats) || targetF;

    if (hasKidneyCondition && newP > maxSafeProtein) {
      showToast(`تنبيه سريري (كلى): لا يمكن تجاوز سقف البروتين (${maxSafeProtein} جم) لمرضى القصور الكلوي.`);
      return;
    }

    setProgram(prev => {
      const currentMeals = prev.nutrition?.meals || [];
      const currentSupps = prev.cardio?.supplements || [];
      const rebalancedMeals = isAutoRippleOn ? dynamicRippleRebalanceDailyPlan({
        meals: currentMeals,
        supplements: currentSupps,
        targets: {
          calories: newCal,
          protein: newP,
          carbs: newC,
          fats: newF
        },
        anchorMealId: null,
        beverageSugarSpoons: prev.nutrition?.beverage_sugar_spoons || 0,
        autoRippleEnabled: true
      }) : currentMeals;

      return {
        ...prev,
        nutrition: {
          ...prev.nutrition,
          targets: {
            ...(prev.nutrition?.targets || {}),
            calories: newCal,
            protein: newP,
            carbs: newC,
            fats: newF
          },
          meals: rebalancedMeals
        }
      };
    });

    setShowEditTargetsModal(false);
    showToast('تم حفظ المستهدفات اليومية وموازنة الوجبات تلقائياً بنجاح');
  };

  const handleUpdateSupplementsWithRipple = (newSupps) => {
    setProgram(prev => {
      const currentMeals = prev.nutrition?.meals || [];
      const rebalancedMeals = isAutoRippleOn ? dynamicRippleRebalanceDailyPlan({
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

  const mealsCal = program?.nutrition?.meals?.reduce((sum, m) => sum + (Number(m.macros?.calories) || 0), 0) || 0;
  const mealsP = program?.nutrition?.meals?.reduce((sum, m) => sum + (Number(m.macros?.protein) || 0), 0) || 0;
  const mealsC = program?.nutrition?.meals?.reduce((sum, m) => sum + (Number(m.macros?.carbs) || 0), 0) || 0;
  const mealsF = program?.nutrition?.meals?.reduce((sum, m) => sum + (Number(m.macros?.fats) || 0), 0) || 0;

  const supps = program?.cardio?.supplements || [];
  const suppsCal = supps.reduce((sum, s) => sum + (Number(s.calories ?? s.cal) || 0), 0);
  const suppsP = supps.reduce((sum, s) => sum + (Number(s.protein ?? s.p) || 0), 0);
  const suppsC = supps.reduce((sum, s) => sum + (Number(s.carbs ?? s.c) || 0), 0);
  const suppsF = supps.reduce((sum, s) => sum + (Number(s.fats ?? s.f) || 0), 0);

  const totalPlannedCal = mealsCal + suppsCal;
  const totalPlannedP = mealsP + suppsP;
  const totalPlannedC = mealsC + suppsC;
  const totalPlannedF = mealsF + suppsF;
  const diffCal = totalPlannedCal - targetCal;
  const deltaP = totalPlannedP - targetP;
  const deltaC = totalPlannedC - targetC;
  const deltaF = totalPlannedF - targetF;

  const effectiveCurrentProtein = Math.max(totalPlannedP, targetP);
  const isProteinExceeded = hasKidneyCondition && effectiveCurrentProtein > maxSafeProtein;
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

  const handleAddPresetMeal = (preset) => {
    const newMealNumber = (program.nutrition?.meals?.length || 0) + 1;
    
    // 1. Proportional Isocaloric Scaling to Client Target Calories
    const targetCal = Number(program.nutrition?.target_calories || program.nutrition?.calories || 2000);
    const presetBaselineCal = preset.items.reduce((s, it) => s + (Number(it.cal) || 0), 0) || 550;
    
    const currentPlannedCal = (program.nutrition?.meals || []).reduce((sum, m) => {
      return sum + (m.items || []).reduce((mSum, it) => mSum + (Number(it.cal) || 0), 0);
    }, 0);
    const remainingCal = targetCal - currentPlannedCal;
    
    let scaleFactor = 1.0;
    if (remainingCal >= 200) {
      scaleFactor = Math.max(0.45, Math.min(2.2, remainingCal / presetBaselineCal));
    } else {
      const standardMealShare = targetCal / Math.max(3, newMealNumber);
      scaleFactor = Math.max(0.5, Math.min(2.0, standardMealShare / presetBaselineCal));
    }

    const newItems = preset.items.map((it, idx) => {
      const baseAmount = Number(it.amount) || 100;
      const newAmount = Math.max(5, Math.round(baseAmount * scaleFactor));
      const factor = newAmount / baseAmount;
      return {
        ...it,
        id: `f_${Date.now()}_${idx}`,
        amount: newAmount,
        p: Number(((Number(it.p) || 0) * factor).toFixed(1)),
        c: Number(((Number(it.c) || 0) * factor).toFixed(1)),
        f: Number(((Number(it.f) || 0) * factor).toFixed(1)),
        cal: Math.round((Number(it.cal) || 0) * factor)
      };
    });

    const newMealObj = {
      id: `m${Date.now()}`,
      name: `الوجبة ${newMealNumber}: ${preset.name}`,
      workout_timing: newMealNumber === 2 ? 'POST_WORKOUT' : (newMealNumber === 3 ? 'PRE_WORKOUT' : 'NONE'),
      time: newMealNumber === 1 ? '09:00 ص' : newMealNumber === 2 ? '02:00 م' : newMealNumber === 3 ? '06:00 م' : '09:30 م',
      macros: recalculateMeal(newItems),
      items: newItems
    };

    setProgram(prev => ({
      ...prev,
      nutrition: {
        ...prev.nutrition,
        meals: [...(prev.nutrition?.meals || []), newMealObj]
      }
    }));
  };

  const handleAutoBalanceMeal = (mealId) => {
    setProgram(prev => {
      const meals = prev.nutrition?.meals || [];
      const meal = meals.find(m => m.id === mealId);
      if (!meal || !meal.items || meal.items.length === 0) return prev;

      const totalMeals = Math.max(1, meals.length);
      const weight = 1 / totalMeals;
      const mealTarget = {
        p: Math.round(targetP * weight),
        c: Math.round(targetC * weight),
        f: Math.round(targetF * weight),
        cal: Math.round(targetCal * weight)
      };

      const balancedItems = balanceMealItems(meal.items, mealTarget);
      const updatedMeals = meals.map(m => {
        if (m.id !== mealId) return m;
        return {
          ...m,
          items: balancedItems,
          macros: recalculateMeal(balancedItems)
        };
      });

      return {
        ...prev,
        nutrition: {
          ...prev.nutrition,
          meals: updatedMeals
        }
      };
    });
    showToast('تمت موازنة أصناف الوجبة بجرامات واقعية متناسقة');
  };

  const handleAutoBalanceAllMeals = () => {
    setProgram(prev => {
      const meals = prev.nutrition?.meals || [];
      if (meals.length === 0) return prev;

      const dailyTarget = {
        calories: targetCal,
        protein: targetP,
        carbs: targetC,
        fats: targetF
      };

      const balanced = balanceAllDayMeals(meals, dailyTarget);
      return {
        ...prev,
        nutrition: {
          ...prev.nutrition,
          meals: balanced
        }
      };
    });
    showToast('تمت موازنة جميع وجبات اليوم تلقائياً بنسب واقعية');
  };

  return (
<>
        {/* 4. TAB 2: NUTRITION & MACROS */}
        {activeWorkspaceTab === 'NUTRITION' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Clinical Guardrail Alert: Kidney Disease Protein Ceiling (KDOQI Guideline) */}
            {hasKidneyCondition && (
              <div style={{
                background: isProteinExceeded ? '#FEF2F2' : '#F0FDF4',
                border: isProteinExceeded ? '1.5px solid #F87171' : '1px solid #BBF7D0',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                boxShadow: isProteinExceeded ? '0 3px 10px rgba(239, 68, 68, 0.12)' : '0 1px 2px rgba(15, 23, 42, 0.02)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: isProteinExceeded ? '#FEE2E2' : '#DCFCE7',
                    border: isProteinExceeded ? '1px solid #FECACA' : '1px solid #BBF7D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isProteinExceeded ? '#DC2626' : '#166534',
                    flexShrink: 0
                  }}>
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: isProteinExceeded ? '#991B1B' : '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{isProteinExceeded ? 'تحذير سريري حرج: تجاوز سقف البروتين لمرضى القصور الكلوي' : 'حماية سريرية نشطة: سقف بروتين الكلى مفعل (KDOQI 1.0 جم/كجم)'}</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: isProteinExceeded ? '#B91C1C' : '#15803D', marginTop: '3px', lineHeight: '1.5' }}>
                      {isProteinExceeded
                        ? `المشترك لديه قصور كلوي مسجل. إجمالي البروتين الحالي (${effectiveCurrentProtein} جم) يتجاوز السقف السريري الآمن (${maxSafeProtein} جم بمعدل 1.0 جم/كجم لوزن ${clientWeightKg} كجم). رفع البروتين يزيد العبء النيتروجيني على ترشيح الكبيبات الكلوية.`
                        : `تم تقييد البروتين بالسقف السريري الآمن (${maxSafeProtein} جم) لضمان حماية وظائف الكلى وترشيح الكبيبات.`}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    background: isProteinExceeded ? '#DC2626' : '#16A34A',
                    color: '#FFFFFF',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    display: 'inline-block',
                    whiteSpace: 'nowrap'
                  }}>
                    {isProteinExceeded ? `زيادة +${effectiveCurrentProtein - maxSafeProtein} جم فوق السقف` : `السقف: ${maxSafeProtein} جم`}
                  </span>
                </div>
              </div>
            )}

            {/* Engine Clinical Nutrition Reasoning Card */}
            {program.nutrition?.reasoning && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F172A', flexShrink: 0 }}>
                    <Zap size={13} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>تحليل محرك التغذية وهندسة الماكروز</div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '1px' }}>
                      {typeof program.nutrition.reasoning === 'string' ? program.nutrition.reasoning : (program.nutrition.reasoning?.rationale || 'احتساب دقيق للعجز/الفائض السعري ونسبة البروتين للحفاظ على الكتلة العضلية.')}
                    </div>
                  </div>
                </div>
                {program.nutrition?.deficit_pct && (
                  <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', whiteSpace: 'nowrap' }}>
                    عجز {program.nutrition.deficit_pct}%
                  </span>
                )}
              </div>
            )}

            {/* Top Macro Summary Bar with Live Calories & Supplements Integration */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditTargetsState({ calories: targetCal, protein: targetP, carbs: targetC, fats: targetF });
                    setShowEditTargetsModal(true);
                  }}
                  style={{
                    background: '#0F172A',
                    color: '#FFFFFF',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    textAlign: 'center',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  title="تعديل أرقام المستهدفات يدوياً (سعرات وماكروز)"
                >
                  <span style={{ fontSize: '9px', opacity: 0.8, display: 'block' }}>المستهدف (تعديل)</span>
                  <strong style={{ fontSize: '13px', fontWeight: 800 }}>{targetCal} kcal</strong>
                </button>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', padding: '5px 12px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9.5px', color: '#64748B', display: 'block' }}>المخطط الفعلي (أكل + مكملات)</span>
                  <strong style={{ fontSize: '13px', fontWeight: 800, color: totalPlannedCal === 0 ? '#64748B' : Math.abs(diffCal) <= 30 ? '#16A34A' : diffCal > 0 ? '#D97706' : '#0284C7' }}>
                    {totalPlannedCal} kcal
                  </strong>
                </div>

                {suppsCal > 0 && (
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', padding: '5px 10px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '9px', display: 'block', opacity: 0.8 }}>أكل / مكملات</span>
                    <strong style={{ fontSize: '12px' }}>{mealsCal} + {suppsCal}</strong>
                  </div>
                )}

                <div style={{
                  background: isProteinExceeded ? '#FEF2F2' : '#F8FAFC',
                  border: isProteinExceeded ? '1.5px solid #EF4444' : '1px solid #E2E8F0',
                  color: isProteinExceeded ? '#991B1B' : '#0F172A',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '9.5px', color: isProteinExceeded ? '#DC2626' : '#64748B' }}>البروتين</span>
                    {hasKidneyCondition && (
                      <span style={{
                        fontSize: '8px',
                        fontWeight: 800,
                        padding: '1px 4px',
                        borderRadius: '6px',
                        background: isProteinExceeded ? '#FEE2E2' : '#DCFCE7',
                        color: isProteinExceeded ? '#DC2626' : '#166534',
                        border: isProteinExceeded ? '1px solid #FECACA' : '1px solid #BBF7D0'
                      }}>
                        سقف الكلى: {maxSafeProtein}g
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '1px' }}>
                    <strong style={{ fontSize: '12.5px', fontWeight: 800, color: isProteinExceeded ? '#DC2626' : '#0F172A' }}>
                      {totalPlannedP}g / {targetP}g
                    </strong>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '6px',
                      background: Math.abs(deltaP) <= 2 ? '#DCFCE7' : deltaP > 0 ? '#FEF3C7' : '#EFF6FF',
                      color: Math.abs(deltaP) <= 2 ? '#15803D' : deltaP > 0 ? '#B45309' : '#1D4ED8'
                    }}>
                      {Math.abs(deltaP) <= 2 ? 'مطابق' : deltaP > 0 ? `+${deltaP}g` : `${deltaP}g`}
                    </span>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', padding: '5px 10px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9.5px', color: '#64748B', display: 'block' }}>الكارب</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '1px' }}>
                    <strong style={{ fontSize: '12.5px', fontWeight: 700 }}>{totalPlannedC}g / {targetC}g</strong>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '6px',
                      background: Math.abs(deltaC) <= 3 ? '#DCFCE7' : deltaC > 0 ? '#FEF3C7' : '#EFF6FF',
                      color: Math.abs(deltaC) <= 3 ? '#15803D' : deltaC > 0 ? '#B45309' : '#1D4ED8'
                    }}>
                      {Math.abs(deltaC) <= 3 ? 'مطابق' : deltaC > 0 ? `+${deltaC}g` : `${deltaC}g`}
                    </span>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', padding: '5px 10px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9.5px', color: '#64748B', display: 'block' }}>الدهون</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '1px' }}>
                    <strong style={{ fontSize: '12.5px', fontWeight: 700 }}>{totalPlannedF}g / {targetF}g</strong>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '6px',
                      background: Math.abs(deltaF) <= 2 ? '#DCFCE7' : deltaF > 0 ? '#FEF3C7' : '#EFF6FF',
                      color: Math.abs(deltaF) <= 2 ? '#15803D' : deltaF > 0 ? '#B45309' : '#1D4ED8'
                    }}>
                      {Math.abs(deltaF) <= 2 ? 'مطابق' : deltaF > 0 ? `+${deltaF}g` : `${deltaF}g`}
                    </span>
                  </div>
                </div>

                {Boolean(program.nutrition?.beverage_sugar_intake && program.nutrition.beverage_sugar_intake !== 'zero_or_sweetener') && (
                  <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E', padding: '5px 10px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '9px', display: 'block', opacity: 0.85 }}>سكر المشروبات</span>
                    <strong style={{ fontSize: '12px' }}>
                      {program.nutrition.beverage_sugar_intake === '1_tsp' ? '+5g C (20 kcal)' :
                       program.nutrition.beverage_sugar_intake === '2_tsp' ? '+10g C (40 kcal)' : '+15g C (60 kcal)'}
                    </strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {totalPlannedCal > 0 && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: Math.abs(diffCal) <= 25 ? '#DCFCE7' : diffCal > 0 ? '#FEF3C7' : '#E0F2FE',
                    color: Math.abs(diffCal) <= 25 ? '#15803D' : diffCal > 0 ? '#B45309' : '#0369A1'
                  }}>
                    {Math.abs(diffCal) <= 25 ? 'مطابق للتارجت بالملي' : diffCal > 0 ? `فائض +${diffCal} kcal` : `متبقي ${Math.abs(diffCal)} kcal`}
                  </span>
                )}

                <button
                  type="button"
                  onClick={toggleAutoRipple}
                  style={{
                    height: '30px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    background: isAutoRippleOn ? '#EFF6FF' : '#F8FAFC',
                    color: isAutoRippleOn ? '#1D4ED8' : '#64748B',
                    border: '1px solid ' + (isAutoRippleOn ? '#BFDBFE' : '#CBD5E1'),
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: isAutoRippleOn ? '0 1px 2px rgba(37, 99, 235, 0.1)' : 'none'
                  }}
                  title="الموازنة التلقائية اللحظية: عند إضافة أو تعديل أو حذف أي صنف تتعدل بقية الوجبات تلقائياً لتغلق الماكروز بالملي"
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isAutoRippleOn ? '#2563EB' : '#94A3B8', display: 'inline-block' }}></span>
                  <span>الموازنة اللحظية: {isAutoRippleOn ? 'مفعلة' : 'متوقفة'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAutoBalanceAllMeals}
                  style={{ height: '30px', padding: '0 12px', borderRadius: '8px', background: '#047857', color: '#FFFFFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 1px 3px rgba(4, 120, 87, 0.2)' }}
                  title="موازنة جرامات جميع الوجبات تلقائياً لتطابق سعرات وماكروز اليوم بنسب واقعية"
                >
                  <Zap size={13} />
                  <span>موازنة اليوم بالكامل</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddNewMeal}
                  style={{ height: '30px', padding: '0 12px', borderRadius: '8px', background: '#0F172A', color: '#FFFFFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.15)' }}
                >
                  <Plus size={13} />
                  <span>إضافة وجبة</span>
                </button>
              </div>
            </div>

            {/* Deficit Volume Shield & Carb Cycling Dynamic Bar */}
            <div style={{
              background: deficitVolumeShield.requires_volume_consolidation
                ? '#FFFBEB'
                : deficitVolumeShield.shield_active
                  ? '#FEF2F2'
                  : '#F0FDF4',
              border: deficitVolumeShield.requires_volume_consolidation
                ? '1px solid #FCD34D'
                : deficitVolumeShield.shield_active
                  ? '1px solid #FECACA'
                  : '1px solid #BBF7D0',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: deficitVolumeShield.requires_volume_consolidation
                    ? '#F59E0B'
                    : deficitVolumeShield.shield_active
                      ? '#EF4444'
                      : '#16A34A',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {deficitVolumeShield.requires_volume_consolidation ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
                      درع الحجم التدريبي والعجز السعري:
                    </span>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: deficitVolumeShield.shield_active ? '#FEE2E2' : '#DCFCE7',
                      color: deficitVolumeShield.shield_active ? '#B91C1C' : '#15803D'
                    }}>
                      {deficitVolumeShield.shield_active
                        ? `عجز حراري حاد (${deficitVolumeShield.deficit_percent}% | انكماش سقف الاستشفاء MRV -20%)`
                        : deficitVolumeShield.is_deficit
                          ? `عجز معتدل (${deficitVolumeShield.deficit_percent}% | انكماش MRV -10%)`
                          : 'سعرات صيانة / فائض (سقف الاستشفاء مستقر)'}
                    </span>

                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: proteinSparing.is_deficient ? '#FEF3C7' : '#EFF6FF',
                      color: proteinSparing.is_deficient ? '#B45309' : '#1D4ED8'
                    }}>
                      التدريع البروتيني: {proteinSparing.current_multiplier} جم/كجم (الوقائي: {proteinSparing.recommended_multiplier} جم/كجم)
                    </span>
                  </div>

                  {deficitVolumeShield.warnings.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#B91C1C', marginTop: '3px', fontWeight: 600 }}>
                      {deficitVolumeShield.warnings[0]}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowCarbCyclingModal(true)}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#0F172A'; e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#0F172A'; }}
                >
                  <Activity size={13} />
                  <span>مزامنة تدوير الكارب مع جلسات الأسبوع</span>
                </button>
              </div>
            </div>

            {/* Quick Meal Presets Toolbar */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A' }}>نماذج وجبات معتمدة بضغطة زر:</span>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {QUICK_MEAL_PRESETS.map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handleAddPresetMeal(preset)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        background: '#F8FAFC',
                        color: '#0F172A',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        transition: 'all 0.12s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#0F172A'; e.currentTarget.style.color = '#FFFFFF'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#0F172A'; }}
                    >
                      <Plus size={10} />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Meals Grid (2-Column Balanced Sleek Grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '12px' }}>
              {program.nutrition?.meals?.map((meal) => (
                <div
                  key={meal.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)'
                  }}
                >
                  {/* Meal Header */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '12.5px', color: '#0F172A', fontWeight: 800 }}>{meal.name}</strong>
                        <span style={{ fontSize: '10px', color: '#64748B', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1px 5px', borderRadius: '6px', fontWeight: 600 }}>{meal.time}</span>
                        <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: '2px', borderRadius: '8px', border: '1px solid #E2E8F0', gap: '2px' }}>
                          {[
                            { id: 'NONE', label: 'اعتيادية' },
                            { id: 'PRE_WORKOUT', label: 'قبل التمرين' },
                            { id: 'POST_WORKOUT', label: 'بعد التمرين' }
                          ].map((opt) => {
                            const isAct = (meal.workout_timing || 'NONE') === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setProgram(prev => ({
                                    ...prev,
                                    nutrition: {
                                      ...prev.nutrition,
                                      meals: prev.nutrition.meals.map(m => m.id === meal.id ? { ...m, workout_timing: opt.id } : m)
                                    }
                                  }));
                                }}
                                style={{
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '2px 7px',
                                  fontSize: '9.5px',
                                  fontWeight: 700,
                                  borderRadius: '6px',
                                  background: isAct ? (opt.id === 'PRE_WORKOUT' ? '#FEF3C7' : opt.id === 'POST_WORKOUT' ? '#DCFCE7' : '#0F172A') : 'transparent',
                                  color: isAct ? (opt.id === 'PRE_WORKOUT' ? '#92400E' : opt.id === 'POST_WORKOUT' ? '#166534' : '#FFFFFF') : '#64748B',
                                  boxShadow: isAct ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                                  transition: 'all 0.12s ease'
                                }}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {meal.items && meal.items.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleAutoBalanceMeal(meal.id)}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '8px',
                              background: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              color: '#065F46',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="موازنة أصناف هذه الوجبة بجرامات واقعية متناسقة تسد حصتها من الماكروز"
                          >
                            <Zap size={10} />
                            <span>موازنة الوجبة ذكياً</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setAddFoodModal({ open: true, mealId: meal.id })}
                          style={{ padding: '2px 7px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          + صنف غذائي
                        </button>
                        {handleDuplicateMeal && (
                          <button
                            type="button"
                            onClick={() => handleDuplicateMeal(meal.id)}
                            style={{
                              padding: '2px 7px',
                              borderRadius: '8px',
                              background: '#F8FAFC',
                              border: '1px solid #CBD5E1',
                              color: '#0F172A',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              transition: 'all 0.12s ease'
                            }}
                            title="نسخ هذه الوجبة بالكامل بجميع أصنافها"
                          >
                            <Copy size={11} />
                            <span>نسخ الوجبة</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteMeal(meal.id)}
                          style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                          title="حذف الوجبة"
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Meal Food Items (Precision Grid: Aligned Grams, Centered Calories, English Macros & Swap Action) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {meal.items?.map((item, iIdx) => (
                        <div
                          key={item.id || iIdx}
                          style={{
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            display: 'grid',
                            gridTemplateColumns: 'minmax(105px, 1fr) 95px 75px 210px 48px',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          {/* 1. Food Name & Category Badge & Raw/Cooked Hint */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                            <span style={{ color: '#0F172A', fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.name}
                            </span>
                            {/* Raw / Cooked equivalence hint */}
                            {(() => {
                              const upper = String(item.code || item.name).toUpperCase();
                              const amt = Number(item.amount) || 0;
                              let hint = '';
                              if (['CHICKEN', 'دجاج', 'فراخ', 'TURKEY'].some(c => upper.includes(c))) hint = `(~${Math.round(amt / 0.75)} جم نيء)`;
                              else if (['BEEF', 'لحم', 'كفتة'].some(c => upper.includes(c))) hint = `(~${Math.round(amt / 0.72)} جم نيء)`;
                              else if (['FISH', 'سمك', 'فيليه', 'SHRIMP', 'جمبري', 'SALMON'].some(c => upper.includes(c))) hint = `(~${Math.round(amt / 0.80)} جم نيء)`;
                              else if (['RICE', 'أرز', 'ارز'].some(c => upper.includes(c))) hint = `(~${Math.round(amt / 2.6)} جم جاف)`;
                              else if (['PASTA', 'مكرونة'].some(c => upper.includes(c))) hint = `(~${Math.round(amt / 2.3)} جم جافة)`;
                              else if (['OATS', 'شوفان'].some(c => upper.includes(c))) hint = `(~${Math.round(amt * 2.8)} جم مطبوخ)`;
                              if (!hint) return null;
                              return <span style={{ fontSize: '9px', color: '#0284C7', fontWeight: 700, whiteSpace: 'nowrap' }}>{hint}</span>;
                            })()}
                            {item.category && (
                              <span style={{ fontSize: '9.5px', fontWeight: 600, padding: '1px 5px', borderRadius: '6px', background: '#FFFFFF', color: '#64748B', border: '1px solid #E2E8F0', flexShrink: 0 }}>
                                {item.category === 'PROTEIN' ? 'بروتين' : item.category === 'CARB' ? 'نشويات' : item.category === 'FAT' ? 'دهون' : 'خضار'}
                              </span>
                            )}
                          </div>
                          
                          {/* 2. Grams Amount Box (Fixed width, vertically aligned, no spin-arrow crop) */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0 6px', height: '27px', width: '74px', boxSizing: 'border-box' }}>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                dir="ltr"
                                value={item.amount !== undefined ? item.amount : 100}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  handleUpdateFoodAmount(meal.id, iIdx, val);
                                }}
                                style={{
                                  width: '38px',
                                  border: 'none',
                                  textAlign: 'center',
                                  fontWeight: 800,
                                  fontSize: '12px',
                                  outline: 'none',
                                  color: '#0F172A',
                                  background: 'transparent',
                                  direction: 'ltr',
                                  padding: 0
                                }}
                              />
                              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', marginRight: '2px', flexShrink: 0 }}>{item.unit || 'جم'}</span>
                            </div>
                          </div>

                          {/* 3. Calories (Fixed width, centered) */}
                          <div style={{ textAlign: 'center', direction: 'ltr', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>
                              {item.cal || 0} kcal
                            </span>
                          </div>

                          {/* 4. Macros (Fixed width, English Protein/Carbs/Fat with bold numbers) */}
                          <div style={{ fontSize: '10px', color: '#64748B', textAlign: 'left', direction: 'ltr', whiteSpace: 'nowrap' }}>
                            <span>Protein: <strong style={{ color: '#0F172A', fontWeight: 800 }}>{item.p || 0}g</strong> · Carbs: <strong style={{ color: '#0F172A', fontWeight: 800 }}>{item.c || 0}g</strong> · Fat: <strong style={{ color: '#0F172A', fontWeight: 800 }}>{item.f || 0}g</strong></span>
                          </div>

                          {/* 5. Actions: Smart Swap + Delete */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => setSwapFoodModal({ open: true, mealId: meal.id, itemIdx: iIdx, currentItem: item })}
                              style={{ border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                              title="تبديل الصنف ببديل متكافئ بالمللي"
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#2563EB'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; }}
                            >
                              <ArrowRightLeft size={12} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteFood(meal.id, iIdx)}
                              style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                              title="حذف الصنف"
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Meal Footer Macros */}
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '6px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: '#64748B' }}>
                    <span style={{ fontWeight: 700, color: '#475569' }}>المجموع: <strong style={{ color: '#0F172A', fontSize: '11.5px' }}>{meal.macros?.calories || 0} kcal</strong></span>
                    <span style={{ fontWeight: 600 }}>
                      بروتين: <strong style={{ color: '#0F172A' }}>{meal.macros?.protein || 0}g</strong> • كارب: <strong style={{ color: '#0F172A' }}>{meal.macros?.carbs || 0}g</strong> • دهون: <strong style={{ color: '#0F172A' }}>{meal.macros?.fats || 0}g</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Supplements & Calorie Protocol Card inside Nutrition Tab */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <strong style={{ fontSize: '13px', color: '#0F172A' }}>المكملات الغذائية والجينر المعتمدة (تُحسب ضمن السعرات):</strong>
                  <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>
                    أي سعرات أو ماكروز تدونها هنا تندمج فوراً وتؤثر على إجمالي اليوم.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentSupps = [...(program.cardio?.supplements || [])];
                    currentSupps.push({ id: `supp-${Date.now()}`, name: '', dose: '', timing: '', cal: 0, p: 0, c: 0, f: 0, notes: '' });
                    handleUpdateSupplementsWithRipple(currentSupps);
                  }}
                  style={{ padding: '4px 10px', borderRadius: '8px', background: '#0F172A', color: '#FFFFFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={12} /> إضافة مكمل
                </button>
              </div>

              {(!program.cardio?.supplements || program.cardio.supplements.length === 0) && (
                <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '12px', textAlign: 'center', fontSize: '11px', color: '#94A3B8' }}>
                  لا توجد مكملات مضافة حالياً. اضغط "إضافة مكمل" لإدراج واي بروتين، ماس جينر، كرياتين، أو فيتامينات.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {program.cardio?.supplements?.map((supp, sIdx) => (
                  <div key={supp.id || sIdx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                      <input
                        type="text"
                        placeholder="اسم المكمل (مثال: ماس جينر / واي بروتين)"
                        value={supp.name || ''}
                        onChange={(e) => {
                          const updated = [...program.cardio.supplements];
                          updated[sIdx] = { ...updated[sIdx], name: e.target.value };
                          handleUpdateSupplementsWithRipple(updated);
                        }}
                        style={{ height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', fontWeight: 700, outline: 'none', background: '#FFFFFF' }}
                      />
                      <input
                        type="text"
                        placeholder="الجرعة (مثال: 2 سكوب)"
                        value={supp.dose || ''}
                        onChange={(e) => {
                          const updated = [...program.cardio.supplements];
                          updated[sIdx] = { ...updated[sIdx], dose: e.target.value };
                          handleUpdateSupplementsWithRipple(updated);
                        }}
                        style={{ height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', outline: 'none', background: '#FFFFFF' }}
                      />
                      <input
                        type="text"
                        placeholder="التوقيت (مثال: بعد التمرين)"
                        value={supp.timing || ''}
                        onChange={(e) => {
                          const updated = [...program.cardio.supplements];
                          updated[sIdx] = { ...updated[sIdx], timing: e.target.value };
                          handleUpdateSupplementsWithRipple(updated);
                        }}
                        style={{ height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', outline: 'none', background: '#FFFFFF' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = program.cardio.supplements.filter((_, i) => i !== sIdx);
                          handleUpdateSupplementsWithRipple(updated);
                        }}
                        style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
                        title="حذف المكمل"
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#64748B', display: 'block' }}>سعرات (kcal)</span>
                        <input
                          type="number"
                          min="0"
                          value={supp.cal || 0}
                          onChange={(e) => {
                            const updated = [...program.cardio.supplements];
                            updated[sIdx] = { ...updated[sIdx], cal: Number(e.target.value) || 0 };
                            handleUpdateSupplementsWithRipple(updated);
                          }}
                          style={{ width: '100%', height: '28px', borderRadius: '8px', border: '1px solid #CBD5E1', textAlign: 'center', fontSize: '12px', fontWeight: 700, outline: 'none', background: '#FFFFFF' }}
                        />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#64748B', display: 'block' }}>بروتين (g)</span>
                        <input
                          type="number"
                          min="0"
                          value={supp.p || 0}
                          onChange={(e) => {
                            const updated = [...program.cardio.supplements];
                            updated[sIdx] = { ...updated[sIdx], p: Number(e.target.value) || 0 };
                            handleUpdateSupplementsWithRipple(updated);
                          }}
                          style={{ width: '100%', height: '28px', borderRadius: '8px', border: '1px solid #CBD5E1', textAlign: 'center', fontSize: '12px', fontWeight: 700, outline: 'none', background: '#FFFFFF' }}
                        />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#64748B', display: 'block' }}>كارب (g)</span>
                        <input
                          type="number"
                          min="0"
                          value={supp.c || 0}
                          onChange={(e) => {
                            const updated = [...program.cardio.supplements];
                            updated[sIdx] = { ...updated[sIdx], c: Number(e.target.value) || 0 };
                            handleUpdateSupplementsWithRipple(updated);
                          }}
                          style={{ width: '100%', height: '28px', borderRadius: '8px', border: '1px solid #CBD5E1', textAlign: 'center', fontSize: '12px', fontWeight: 700, outline: 'none', background: '#FFFFFF' }}
                        />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#64748B', display: 'block' }}>دهون (g)</span>
                        <input
                          type="number"
                          min="0"
                          value={supp.f || 0}
                          onChange={(e) => {
                            const updated = [...program.cardio.supplements];
                            updated[sIdx] = { ...updated[sIdx], f: Number(e.target.value) || 0 };
                            handleUpdateSupplementsWithRipple(updated);
                          }}
                          style={{ width: '100%', height: '28px', borderRadius: '8px', border: '1px solid #CBD5E1', textAlign: 'center', fontSize: '12px', fontWeight: 700, outline: 'none', background: '#FFFFFF' }}
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="ملاحظة اختيارية (مثال: بديل لوجبة بعد التمرين لو مستعجل أو في العمل)"
                      value={supp.notes || ''}
                      onChange={(e) => {
                        const updated = [...program.cardio.supplements];
                        updated[sIdx] = { ...updated[sIdx], notes: e.target.value };
                        handleUpdateSupplementsWithRipple(updated);
                      }}
                      style={{ width: '100%', height: '28px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '10.5px', color: '#64748B', outline: 'none', background: '#FFFFFF', marginTop: '6px', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Quick Targets Edit Modal with Clinical Kidney Guardrail Live Check */}
        {showEditTargetsModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px'
            }}
            dir="rtl"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowEditTargetsModal(false);
            }}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                width: '100%',
                maxWidth: '460px',
                padding: '24px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F172A' }}>
                    <Target size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>تعديل المستهدفات اليومية</h3>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>تحديد مستهدفات السعرات والماكروز اليومية للخطة</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditTargetsModal(false)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Kidney Warning in Modal if Exceeded */}
              {hasKidneyCondition && (
                <div
                  style={{
                    background: Number(editTargetsState.protein) > maxSafeProtein ? '#FEF2F2' : '#F0FDF4',
                    border: Number(editTargetsState.protein) > maxSafeProtein ? '1.5px solid #F87171' : '1px solid #BBF7D0',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <ShieldAlert size={18} color={Number(editTargetsState.protein) > maxSafeProtein ? '#DC2626' : '#166534'} style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '11.5px', lineHeight: '1.4', color: Number(editTargetsState.protein) > maxSafeProtein ? '#991B1B' : '#166534' }}>
                    {Number(editTargetsState.protein) > maxSafeProtein
                      ? `تنبيه سريري: البروتين المدخل (${editTargetsState.protein} جم) يتجاوز السقف السريري الآمن لمرضى الكلى (${maxSafeProtein} جم بمعدل 1.0 جم/كجم). سيتم توثيق هذا التجاوز في سجل المراجعة السريرية.`
                      : `حماية الكلى مفعلة: السقف السريري الآمن هو ${maxSafeProtein} جم/يوم (KDOQI 1.0 جم/كجم).`}
                  </div>
                </div>
              )}

              {/* Inputs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    السعرات اليومية (kcal)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="6000"
                    value={editTargetsState.calories}
                    onChange={(e) => setEditTargetsState(prev => ({ ...prev, calories: e.target.value }))}
                    style={{
                      width: '100%',
                      height: '38px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: hasKidneyCondition && Number(editTargetsState.protein) > maxSafeProtein ? '#DC2626' : '#475569', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>البروتين (جم)</span>
                    {hasKidneyCondition && <span style={{ fontSize: '9.5px', color: '#DC2626' }}>سقف: {maxSafeProtein}g</span>}
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="400"
                    value={editTargetsState.protein}
                    onChange={(e) => setEditTargetsState(prev => ({ ...prev, protein: e.target.value }))}
                    style={{
                      width: '100%',
                      height: '38px',
                      borderRadius: '8px',
                      border: hasKidneyCondition && Number(editTargetsState.protein) > maxSafeProtein ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                      background: hasKidneyCondition && Number(editTargetsState.protein) > maxSafeProtein ? '#FEF2F2' : '#FFFFFF',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    الكاربوهيدرات (جم)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="700"
                    value={editTargetsState.carbs}
                    onChange={(e) => setEditTargetsState(prev => ({ ...prev, carbs: e.target.value }))}
                    style={{
                      width: '100%',
                      height: '38px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    الدهون الصحية (جم)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={editTargetsState.fats}
                    onChange={(e) => setEditTargetsState(prev => ({ ...prev, fats: e.target.value }))}
                    style={{
                      width: '100%',
                      height: '38px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      padding: '0 10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Calculated Cals from Entered Macros */}
              <div style={{ fontSize: '11px', color: '#64748B', background: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>مجموع سعرات الماكروز المحسوبة:</span>
                <strong style={{ color: '#0F172A' }}>
                  {Math.round((Number(editTargetsState.protein) || 0) * 4 + (Number(editTargetsState.carbs) || 0) * 4 + (Number(editTargetsState.fats) || 0) * 9)} kcal
                </strong>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditTargetsModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomTargets}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  حفظ وتحديث المستهدفات
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Carb Cycling Sync Modal */}
        {showCarbCyclingModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '750px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              border: '1px solid #E2E8F0',
              direction: 'rtl'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#0F172A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                      مزامنة تدوير الكارب مع جلسات التدريب (Carb-Cycling Dynamic Sync)
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748B' }}>
                      ربط أحمال الكربوهيدرات بالأيام الشاقة وتخفيضها بأيام الراحة مع ثبات متوسط السعرات اليومي 100%
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCarbCyclingModal(false)}
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Summary Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>المستهدف الأساسي</div>
                  <strong style={{ fontSize: '13px', color: '#0F172A' }}>{carbCyclingPlan.baseline.daily_calories} kcal</strong>
                </div>
                <div style={{ background: '#FEF2F2', padding: '10px', borderRadius: '10px', border: '1px solid #FECACA', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#991B1B' }}>أيام كارب شاق (+20%)</div>
                  <strong style={{ fontSize: '13px', color: '#B91C1C' }}>{carbCyclingPlan.heavy_days_count} أيام</strong>
                </div>
                <div style={{ background: '#EFF6FF', padding: '10px', borderRadius: '10px', border: '1px solid #BFDBFE', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#1E40AF' }}>أيام راحة / استشفاء (-20%)</div>
                  <strong style={{ fontSize: '13px', color: '#1D4ED8' }}>{carbCyclingPlan.rest_days_count} أيام</strong>
                </div>
                <div style={{ background: '#F0FDF4', padding: '10px', borderRadius: '10px', border: '1px solid #BBF7D0', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#166534' }}>متوسط السعرات الأسبوعي</div>
                  <strong style={{ fontSize: '13px', color: '#15803D' }}>{carbCyclingPlan.weekly_average_calories} kcal (انحراف {carbCyclingPlan.calorie_variance}%)</strong>
                </div>
              </div>

              {/* 7 Days Schedule Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                {carbCyclingPlan.weekly_breakdown.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    style={{
                      background: day.day_type === 'HEAVY_TRAINING' ? '#FFFBEB' : day.day_type === 'REST_DAY' ? '#F8FAFC' : '#FFFFFF',
                      border: day.day_type === 'HEAVY_TRAINING' ? '1px solid #FCD34D' : '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', minWidth: '60px' }}>
                        {day.day === 'MONDAY' ? 'الإثنين' :
                         day.day === 'TUESDAY' ? 'الثلاثاء' :
                         day.day === 'WEDNESDAY' ? 'الأربعاء' :
                         day.day === 'THURSDAY' ? 'الخميس' :
                         day.day === 'FRIDAY' ? 'الجمعة' :
                         day.day === 'SATURDAY' ? 'السبت' : 'الأحد'}
                      </span>

                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: day.day_type === 'HEAVY_TRAINING' ? '#FEE2E2' : day.day_type === 'REST_DAY' ? '#EFF6FF' : '#E2E8F0',
                        color: day.day_type === 'HEAVY_TRAINING' ? '#B91C1C' : day.day_type === 'REST_DAY' ? '#1E40AF' : '#475569'
                      }}>
                        {day.day_type === 'HEAVY_TRAINING' ? 'كارب شاق' : day.day_type === 'REST_DAY' ? 'كارب منخفض' : 'كارب متوسط'}
                      </span>

                      <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                        {day.label_ar}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '11.5px', color: '#0F172A', textAlign: 'left' }}>
                        <span style={{ fontWeight: 800, color: '#0284C7' }}>{day.carbs_g}g C</span> •{' '}
                        <span style={{ fontWeight: 700, color: '#DC2626' }}>{day.protein_g}g P</span> •{' '}
                        <span style={{ fontWeight: 700, color: '#D97706' }}>{day.fat_g}g F</span>
                      </div>

                      <div style={{
                        background: '#0F172A',
                        color: '#FFFFFF',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 800
                      }}>
                        {day.calories} kcal
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowCarbCyclingModal(false)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

</>
  );
}
