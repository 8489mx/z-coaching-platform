import React, { useState } from 'react';
import { Plus, Trash2, X, ArrowRightLeft, Zap, Target, ShieldAlert, Copy } from 'lucide-react';
import { balanceMealItems, dynamicRippleRebalanceDailyPlan } from '../../../utils/mealPortionBalancer.js';
import { KIDNEY_MAX_PROTEIN_PER_KG } from '../../../config/clinicalLimits';


export default function CoachEditorNutritionTab(props) {
  const { searchParams: _searchParams, setSearchParams: _setSearchParams, loading: _loading, setLoading: _setLoading, saving: _saving, setSaving: _setSaving, publishing: _publishing, setPublishing: _setPublishing, program, setProgram, coachNotes: _coachNotes, setCoachNotes: _setCoachNotes, activeSessionIdx: _activeSessionIdx, setActiveSessionIdx: _setActiveSessionIdx, activeWorkspaceTab, setActiveWorkspaceTab: _setActiveWorkspaceTab, notification: _notification, setNotification: _setNotification, clientsList: _clientsList, setClientsList: _setClientsList, queueFilter: _queueFilter, setQueueFilter: _setQueueFilter, queueSearch: _queueSearch, setQueueSearch: _setQueueSearch, showQueueSlider: _showQueueSlider, setShowQueueSlider: _setShowQueueSlider, allExercisesList: _allExercisesList, setAllExercisesList: _setAllExercisesList, cardioSwapModal: _cardioSwapModal, setCardioSwapModal: _setCardioSwapModal, addFoodModal: _addFoodModal, setAddFoodModal, swapFoodModal: _swapFoodModal, setSwapFoodModal, addExModal: _addExModal, setAddExModal: _setAddExModal, swapExModal: _swapExModal, setSwapExModal: _setSwapExModal, mobilityModal: _mobilityModal, setMobilityModal: _setMobilityModal, allMobilityList: _allMobilityList, setAllMobilityList: _setAllMobilityList, showReasoning: _showReasoning, setShowReasoning: _setShowReasoning, exModalSearch: _exModalSearch, setExModalSearch: _setExModalSearch, foodModalSearch: _foodModalSearch, setFoodModalSearch: _setFoodModalSearch, mobilityModalSearch: _mobilityModalSearch, setMobilityModalSearch: _setMobilityModalSearch, swapFoodSearch: _swapFoodSearch, setSwapFoodSearch: _setSwapFoodSearch, swapExSearch: _swapExSearch, setSwapExSearch: _setSwapExSearch, handleSelectClient: _handleSelectClient, handleUpdateFoodAmount, handleDeleteFood, handleAddNewMeal, handleDuplicateMeal, handleDeleteMeal, handleAddFoodToMeal: _handleAddFoodToMeal, handleExecuteFoodSwap: _handleExecuteFoodSwap, handleExecuteExerciseSwap: _handleExecuteExerciseSwap, handleUpdateExerciseParam: _handleUpdateExerciseParam, handleDeleteExercise: _handleDeleteExercise, handleAddExerciseToSession: _handleAddExerciseToSession, handleSelectCardioModality: _handleSelectCardioModality, handleAddMobilityToSession: _handleAddMobilityToSession, handleRemoveMobilityFromSession: _handleRemoveMobilityFromSession, handleSaveDraft: _handleSaveDraft, handleApproveAndPublish: _handleApproveAndPublish, FOOD_DATABASE_LIST: _FOOD_DATABASE_LIST, CARDIO_MODALITY_OPTIONS: _CARDIO_MODALITY_OPTIONS } = props;

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
  const maxSafeProtein = Number(clinicalGuardrails?.max_protein_g) || Math.round(clientWeightKg * KIDNEY_MAX_PROTEIN_PER_KG);

  const _activeSessions = (program?.training?.sessions && program.training.sessions.length > 0)
    ? program.training.sessions
    : (Array.isArray(program?.training?.weeks) && program.training.weeks.length > 0)
      ? (program.training.weeks[0]?.sessions || [])
      : (Array.isArray(program?.training_program?.weeks) && program.training_program.weeks.length > 0)
        ? (program.training_program.weeks[0]?.sessions || [])
        : [];

  const _clientTdee = Number(program?.client?.tdee || (targetCal >= 2000 ? targetCal + 450 : 2400));





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



  return (
<>
        {/* 4. TAB 2: NUTRITION & MACROS */}
        {activeWorkspaceTab === 'NUTRITION' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Notes the plan engine left for the coach (goal change, clinical ceilings, items to check) */}
            {Array.isArray(program?.nutrition?.coach_alerts) && program.nutrition.coach_alerts.length > 0 && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '12px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#92400E', fontWeight: 800 }}>
                  <ShieldAlert size={16} color="#B45309" />
                  ملاحظات للكوتش قبل الاعتماد ({program.nutrition.coach_alerts.length})
                </strong>
                {program.nutrition.coach_alerts.map((alert) => (
                  <div key={alert} style={{ fontSize: '11.5px', color: '#78350F', lineHeight: 1.6 }}>
                    - {alert}
                  </div>
                ))}
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
                  onClick={handleAddNewMeal}
                  style={{ height: '30px', padding: '0 12px', borderRadius: '8px', background: '#0F172A', color: '#FFFFFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.15)' }}
                >
                  <Plus size={13} />
                  <span>إضافة وجبة</span>
                </button>
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
                      ? `تنبيه سريري: البروتين المدخل (${editTargetsState.protein} جم) يتجاوز السقف السريري الآمن لمرضى الكلى (${maxSafeProtein} جم بمعدل ${KIDNEY_MAX_PROTEIN_PER_KG} جم/كجم). سيتم توثيق هذا التجاوز في سجل المراجعة السريرية.`
                      : `حماية الكلى مفعلة: السقف السريري الآمن هو ${maxSafeProtein} جم/يوم (KDOQI ${KIDNEY_MAX_PROTEIN_PER_KG} جم/كجم).`}
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

</>
  );
}
