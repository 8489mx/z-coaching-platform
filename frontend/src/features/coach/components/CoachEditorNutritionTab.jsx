import React, { useState } from 'react';
import { Save, Send, Dumbbell, Utensils, FileText, Activity, Loader2, Plus, Trash2, RotateCw, HeartPulse, Printer, X, ArrowRightLeft, Users, Clock, AlertCircle, CheckCircle2, Search, Check, Zap, Target, ShieldAlert, Flame, Sparkles } from 'lucide-react';
import { balanceMealItems, balanceAllDayMeals, dynamicRippleRebalanceDailyPlan } from '../../../utils/mealPortionBalancer.js';

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
  const { searchParams, setSearchParams, loading, setLoading, saving, setSaving, publishing, setPublishing, program, setProgram, coachNotes, setCoachNotes, activeSessionIdx, setActiveSessionIdx, activeWorkspaceTab, setActiveWorkspaceTab, notification, setNotification, clientsList, setClientsList, queueFilter, setQueueFilter, queueSearch, setQueueSearch, showQueueSlider, setShowQueueSlider, allExercisesList, setAllExercisesList, cardioSwapModal, setCardioSwapModal, addFoodModal, setAddFoodModal, swapFoodModal, setSwapFoodModal, addExModal, setAddExModal, swapExModal, setSwapExModal, mobilityModal, setMobilityModal, allMobilityList, setAllMobilityList, showReasoning, setShowReasoning, exModalSearch, setExModalSearch, foodModalSearch, setFoodModalSearch, mobilityModalSearch, setMobilityModalSearch, swapFoodSearch, setSwapFoodSearch, swapExSearch, setSwapExSearch, handleSelectClient, handleUpdateFoodAmount, handleDeleteFood, handleAddNewMeal, handleDeleteMeal, handleAddFoodToMeal, handleExecuteFoodSwap, handleExecuteExerciseSwap, handleUpdateExerciseParam, handleDeleteExercise, handleAddExerciseToSession, handleSelectCardioModality, handleAddMobilityToSession, handleRemoveMobilityFromSession, handleSaveDraft, handleApproveAndPublish, FOOD_DATABASE_LIST, CARDIO_MODALITY_OPTIONS } = props;

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
                  <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', whiteSpace: 'nowrap' }}>
                    عجز {program.nutrition.deficit_pct}%
                  </span>
                )}
              </div>
            )}

                        {/* Top Macro Summary Bar with Live Calories & Supplements Integration */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '5px 12px', borderRadius: '5px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9.5px', opacity: 0.8, display: 'block' }}>المستهدف</span>
                  <strong style={{ fontSize: '13px', fontWeight: 800 }}>{targetCal} kcal</strong>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', padding: '5px 12px', borderRadius: '5px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9.5px', color: '#64748B', display: 'block' }}>المخطط الفعلي (أكل + مكملات)</span>
                  <strong style={{ fontSize: '13px', fontWeight: 800, color: totalPlannedCal === 0 ? '#64748B' : Math.abs(diffCal) <= 30 ? '#16A34A' : diffCal > 0 ? '#D97706' : '#0284C7' }}>
                    {totalPlannedCal} kcal
                  </strong>
                </div>

                {suppsCal > 0 && (
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', padding: '5px 10px', borderRadius: '5px', textAlign: 'center' }}>
                    <span style={{ fontSize: '9px', display: 'block', opacity: 0.8 }}>أكل / مكملات</span>
                    <strong style={{ fontSize: '12px' }}>{mealsCal} + {suppsCal}</strong>
                  </div>
                )}

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', padding: '5px 10px', borderRadius: '5px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9.5px', color: '#64748B', display: 'block' }}>البروتين</span>
                  <strong style={{ fontSize: '12.5px', fontWeight: 700 }}>{totalPlannedP}g / {targetP}g</strong>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', padding: '5px 10px', borderRadius: '5px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9.5px', color: '#64748B', display: 'block' }}>الكارب</span>
                  <strong style={{ fontSize: '12.5px', fontWeight: 700 }}>{totalPlannedC}g / {targetC}g</strong>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A', padding: '5px 10px', borderRadius: '5px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9.5px', color: '#64748B', display: 'block' }}>الدهون</span>
                  <strong style={{ fontSize: '12.5px', fontWeight: 700 }}>{totalPlannedF}g / {targetF}g</strong>
                </div>

                {Boolean(program.nutrition?.beverage_sugar_intake && program.nutrition.beverage_sugar_intake !== 'zero_or_sweetener') && (
                  <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E', padding: '5px 10px', borderRadius: '5px', textAlign: 'center' }}>
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
                    borderRadius: '5px',
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
                    borderRadius: '5px',
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
                  style={{ height: '30px', padding: '0 12px', borderRadius: '5px', background: '#047857', color: '#FFFFFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 1px 3px rgba(4, 120, 87, 0.2)' }}
                  title="موازنة جرامات جميع الوجبات تلقائياً لتطابق سعرات وماكروز اليوم بنسب واقعية"
                >
                  <Sparkles size={13} />
                  <span>موازنة اليوم بالكامل</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddNewMeal}
                  style={{ height: '30px', padding: '0 12px', borderRadius: '5px', background: '#0F172A', color: '#FFFFFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.15)' }}
                >
                  <Plus size={13} />
                  <span>إضافة وجبة</span>
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
                        borderRadius: '4px',
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
                        <span style={{ fontSize: '10px', color: '#64748B', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>{meal.time}</span>
                        <select
                          value={meal.workout_timing || 'NONE'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProgram(prev => ({
                              ...prev,
                              nutrition: {
                                ...prev.nutrition,
                                meals: prev.nutrition.meals.map(m => m.id === meal.id ? { ...m, workout_timing: val } : m)
                              }
                            }));
                          }}
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            border: '1px solid #CBD5E1',
                            background: meal.workout_timing === 'PRE_WORKOUT' ? '#FEF3C7' : meal.workout_timing === 'POST_WORKOUT' ? '#DCFCE7' : '#FFFFFF',
                            color: meal.workout_timing === 'PRE_WORKOUT' ? '#92400E' : meal.workout_timing === 'POST_WORKOUT' ? '#166534' : '#475569',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="NONE">وجبة اعتيادية</option>
                          <option value="PRE_WORKOUT">وجبة ما قبل التمرين (طاقة)</option>
                          <option value="POST_WORKOUT">وجبة ما بعد التمرين (استشفاء)</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {meal.items && meal.items.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleAutoBalanceMeal(meal.id)}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
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
                            <Sparkles size={10} />
                            <span>موازنة الوجبة ذكياً</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setAddFoodModal({ open: true, mealId: meal.id })}
                          style={{ padding: '2px 7px', borderRadius: '4px', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          + صنف غذائي
                        </button>
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
                              <span style={{ fontSize: '9.5px', fontWeight: 600, padding: '1px 5px', borderRadius: '3px', background: '#FFFFFF', color: '#64748B', border: '1px solid #E2E8F0', flexShrink: 0 }}>
                                {item.category === 'PROTEIN' ? 'بروتين' : item.category === 'CARB' ? 'نشويات' : item.category === 'FAT' ? 'دهون' : 'خضار'}
                              </span>
                            )}
                          </div>
                          
                          {/* 2. Grams Amount Box (Fixed width, vertically aligned, no spin-arrow crop) */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '5px', padding: '0 6px', height: '27px', width: '74px', boxSizing: 'border-box' }}>
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
                  style={{ padding: '4px 10px', borderRadius: '5px', background: '#0F172A', color: '#FFFFFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={12} /> إضافة مكمل
                </button>
              </div>

              {(!program.cardio?.supplements || program.cardio.supplements.length === 0) && (
                <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '6px', padding: '12px', textAlign: 'center', fontSize: '11px', color: '#94A3B8' }}>
                  لا توجد مكملات مضافة حالياً. اضغط "إضافة مكمل" لإدراج واي بروتين، ماس جينر، كرياتين، أو فيتامينات.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {program.cardio?.supplements?.map((supp, sIdx) => (
                  <div key={supp.id || sIdx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px' }}>
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
                        style={{ height: '30px', borderRadius: '4px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', fontWeight: 700, outline: 'none', background: '#FFFFFF' }}
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
                        style={{ height: '30px', borderRadius: '4px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', outline: 'none', background: '#FFFFFF' }}
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
                        style={{ height: '30px', borderRadius: '4px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', outline: 'none', background: '#FFFFFF' }}
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
                          style={{ width: '100%', height: '28px', borderRadius: '4px', border: '1px solid #CBD5E1', textAlign: 'center', fontSize: '12px', fontWeight: 700, outline: 'none', background: '#FFFFFF' }}
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
                          style={{ width: '100%', height: '28px', borderRadius: '4px', border: '1px solid #CBD5E1', textAlign: 'center', fontSize: '12px', fontWeight: 700, outline: 'none', background: '#FFFFFF' }}
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
                          style={{ width: '100%', height: '28px', borderRadius: '4px', border: '1px solid #CBD5E1', textAlign: 'center', fontSize: '12px', fontWeight: 700, outline: 'none', background: '#FFFFFF' }}
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
                          style={{ width: '100%', height: '28px', borderRadius: '4px', border: '1px solid #CBD5E1', textAlign: 'center', fontSize: '12px', fontWeight: 700, outline: 'none', background: '#FFFFFF' }}
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
                      style={{ width: '100%', height: '28px', borderRadius: '4px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '10.5px', color: '#64748B', outline: 'none', background: '#FFFFFF', marginTop: '6px', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

</>
  );
}
