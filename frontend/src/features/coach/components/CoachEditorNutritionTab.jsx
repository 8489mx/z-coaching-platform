import React, { useState } from 'react';
import { Plus, Trash2, X, ArrowRightLeft, Zap, Target, ShieldAlert, Copy } from 'lucide-react';
import { balanceMealItems, dynamicRippleRebalanceDailyPlan } from '../../../utils/mealPortionBalancer.js';

function getCleanMealTitle(rawName) {
  if (!rawName) return 'وجبة';
  const s = String(rawName).trim();
  const clean = s.replace(/\s*\([^)]*\)/g, '').trim();
  return clean || s;
}


export default function CoachEditorNutritionTab(props) {
  const { searchParams: _searchParams, setSearchParams: _setSearchParams, loading: _loading, setLoading: _setLoading, saving: _saving, setSaving: _setSaving, publishing: _publishing, setPublishing: _setPublishing, program, setProgram, coachNotes: _coachNotes, setCoachNotes: _setCoachNotes, activeSessionIdx: _activeSessionIdx, setActiveSessionIdx: _setActiveSessionIdx, activeWorkspaceTab, setActiveWorkspaceTab: _setActiveWorkspaceTab, notification: _notification, setNotification: _setNotification, clientsList: _clientsList, setClientsList: _setClientsList, queueFilter: _queueFilter, setQueueFilter: _setQueueFilter, queueSearch: _queueSearch, setQueueSearch: _setQueueSearch, allExercisesList: _allExercisesList, setAllExercisesList: _setAllExercisesList, cardioSwapModal: _cardioSwapModal, setCardioSwapModal: _setCardioSwapModal, addFoodModal: _addFoodModal, setAddFoodModal, swapFoodModal: _swapFoodModal, setSwapFoodModal, addExModal: _addExModal, setAddExModal: _setAddExModal, swapExModal: _swapExModal, setSwapExModal: _setSwapExModal, mobilityModal: _mobilityModal, setMobilityModal: _setMobilityModal, allMobilityList: _allMobilityList, setAllMobilityList: _setAllMobilityList, showReasoning: _showReasoning, setShowReasoning: _setShowReasoning, exModalSearch: _exModalSearch, setExModalSearch: _setExModalSearch, foodModalSearch: _foodModalSearch, setFoodModalSearch: _setFoodModalSearch, mobilityModalSearch: _mobilityModalSearch, setMobilityModalSearch: _setMobilityModalSearch, swapFoodSearch: _swapFoodSearch, setSwapFoodSearch: _setSwapFoodSearch, swapExSearch: _swapExSearch, setSwapExSearch: _setSwapExSearch, handleSelectClient: _handleSelectClient, handleUpdateFoodAmount, handleDeleteFood, handleAddNewMeal, handleDuplicateMeal, handleDeleteMeal, handleAddFoodToMeal: _handleAddFoodToMeal, handleExecuteFoodSwap: _handleExecuteFoodSwap, handleExecuteExerciseSwap: _handleExecuteExerciseSwap, handleUpdateExerciseParam: _handleUpdateExerciseParam, handleDeleteExercise: _handleDeleteExercise, handleAddExerciseToSession: _handleAddExerciseToSession, handleSelectCardioModality: _handleSelectCardioModality, handleAddMobilityToSession: _handleAddMobilityToSession, handleRemoveMobilityFromSession: _handleRemoveMobilityFromSession, handleSaveDraft: _handleSaveDraft, handleApproveAndPublish: _handleApproveAndPublish, FOOD_DATABASE_LIST: _FOOD_DATABASE_LIST, CARDIO_MODALITY_OPTIONS: _CARDIO_MODALITY_OPTIONS } = props;

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

  // A protein cap the bloodwork asked for. A declared kidney diagnosis is outside the service and
  // never reaches the editor (src/api/services/serviceScope.js).
  const maxSafeProtein = Number(clinicalGuardrails?.max_protein_g) || 0;
  const hasProteinCap = Boolean(clinicalGuardrails?.kidney_protein_capped) && maxSafeProtein > 0;

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

    if (hasProteinCap && newP > maxSafeProtein) {
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
  const isProteinExceeded = hasProteinCap && effectiveCurrentProtein > maxSafeProtein;
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
              <div style={{ background: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: '10px', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#854D0E', fontWeight: 800 }}>
                  <ShieldAlert size={15} color="#A16207" />
                  ملاحظات للكوتش قبل الاعتماد ({program.nutrition.coach_alerts.length})
                </strong>
                {program.nutrition.coach_alerts.map((alert) => (
                  <div key={alert} style={{ fontSize: '11px', color: '#713F12', lineHeight: 1.5 }}>
                    - {alert}
                  </div>
                ))}
              </div>
            )}

            {/* Top Macro Summary Bar with Live Calories & Supplements Integration */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #EAECF0',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              boxShadow: '0 1px 3px rgba(16, 24, 40, 0.03)'
            }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Target Calorie Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditTargetsState({ calories: targetCal, protein: targetP, carbs: targetC, fats: targetF });
                    setShowEditTargetsModal(true);
                  }}
                  style={{
                    background: '#673DE6',
                    color: '#FFFFFF',
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 1px 3px rgba(103, 61, 230, 0.25)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  title="تعديل أرقام المستهدفات يدوياً (سعرات وماكروز)"
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#5025D1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#673DE6'; }}
                >
                  <span style={{ fontSize: '10px', opacity: 0.95, fontWeight: 800, lineHeight: 1 }}>المستهدف</span>
                  <strong style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1.2, marginTop: '2px' }}>{targetCal} kcal</strong>
                </button>

                {/* Actual Planned Calories Card */}
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#101828',
                  height: '40px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
                title={suppsCal > 0 ? `أكل: ${mealsCal} + مكملات: ${suppsCal}` : 'إجمالي المخطط الفعلي'}
                >
                  <span style={{ fontSize: '10px', color: '#475467', fontWeight: 800, lineHeight: 1 }}>المخطط الفعلي</span>
                  <strong style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    lineHeight: 1.2,
                    marginTop: '2px',
                    color: totalPlannedCal === 0 ? '#475467' : Math.abs(diffCal) <= 30 ? '#16A34A' : diffCal > 0 ? '#D97706' : '#0284C7'
                  }}>
                    {totalPlannedCal} kcal
                  </strong>
                </div>

                {suppsCal > 0 && (
                  <div style={{
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#1E40AF',
                    height: '40px',
                    padding: '0 8px',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#1E40AF', lineHeight: 1 }}>أكل / مكملات</span>
                    <strong style={{ fontSize: '12px', fontWeight: 800, lineHeight: 1.2, marginTop: '2px' }}>{mealsCal} + {suppsCal}</strong>
                  </div>
                )}

                {/* Protein Card */}
                <div style={{
                  background: isProteinExceeded ? '#FEF2F2' : '#F8FAFC',
                  border: isProteinExceeded ? '1.5px solid #EF4444' : '1px solid #E2E8F0',
                  color: isProteinExceeded ? '#991B1B' : '#101828',
                  height: '40px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', lineHeight: 1 }}>
                    <span style={{ fontSize: '10px', color: isProteinExceeded ? '#DC2626' : '#475467', fontWeight: 800 }}>البروتين</span>
                    {hasProteinCap && (
                      <span style={{
                        fontSize: '7.5px',
                        fontWeight: 800,
                        padding: '1px 3px',
                        borderRadius: '4px',
                        background: isProteinExceeded ? '#FEE2E2' : '#DCFCE7',
                        color: isProteinExceeded ? '#DC2626' : '#166534',
                        border: isProteinExceeded ? '1px solid #FECACA' : '1px solid #BBF7D0'
                      }}>
                        سقف: {maxSafeProtein}g
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px', lineHeight: 1.2 }}>
                    <strong style={{ fontSize: '12.5px', fontWeight: 800, color: isProteinExceeded ? '#DC2626' : '#101828' }}>
                      {totalPlannedP}g / {targetP}g
                    </strong>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '5px',
                      background: Math.abs(deltaP) <= 2 ? '#DCFCE7' : deltaP > 0 ? '#FEF3C7' : '#EFF6FF',
                      color: Math.abs(deltaP) <= 2 ? '#15803D' : deltaP > 0 ? '#B45309' : '#1D4ED8',
                      border: '1px solid ' + (Math.abs(deltaP) <= 2 ? '#BBF7D0' : deltaP > 0 ? '#FDE68A' : '#BFDBFE')
                    }}>
                      {Math.abs(deltaP) <= 2 ? 'مطابق' : deltaP > 0 ? `+${deltaP}g` : `${deltaP}g`}
                    </span>
                  </div>
                </div>

                {/* Carbs Card */}
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#101828',
                  height: '40px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '10px', color: '#475467', fontWeight: 800, lineHeight: 1 }}>الكارب</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px', lineHeight: 1.2 }}>
                    <strong style={{ fontSize: '12.5px', fontWeight: 800 }}>{totalPlannedC}g / {targetC}g</strong>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '5px',
                      background: Math.abs(deltaC) <= 3 ? '#DCFCE7' : deltaC > 0 ? '#FEF3C7' : '#EFF6FF',
                      color: Math.abs(deltaC) <= 3 ? '#15803D' : deltaC > 0 ? '#B45309' : '#1D4ED8',
                      border: '1px solid ' + (Math.abs(deltaC) <= 3 ? '#BBF7D0' : deltaC > 0 ? '#FDE68A' : '#BFDBFE')
                    }}>
                      {Math.abs(deltaC) <= 3 ? 'مطابق' : deltaC > 0 ? `+${deltaC}g` : `${deltaC}g`}
                    </span>
                  </div>
                </div>

                {/* Fats Card */}
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#101828',
                  height: '40px',
                  padding: '0 10px',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '10px', color: '#475467', fontWeight: 800, lineHeight: 1 }}>الدهون</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px', lineHeight: 1.2 }}>
                    <strong style={{ fontSize: '12.5px', fontWeight: 800 }}>{totalPlannedF}g / {targetF}g</strong>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '5px',
                      background: Math.abs(deltaF) <= 2 ? '#DCFCE7' : deltaF > 0 ? '#FEF3C7' : '#EFF6FF',
                      color: Math.abs(deltaF) <= 2 ? '#15803D' : deltaF > 0 ? '#B45309' : '#1D4ED8',
                      border: '1px solid ' + (Math.abs(deltaF) <= 2 ? '#BBF7D0' : deltaF > 0 ? '#FDE68A' : '#BFDBFE')
                    }}>
                      {Math.abs(deltaF) <= 2 ? 'مطابق' : deltaF > 0 ? `+${deltaF}g` : `${deltaF}g`}
                    </span>
                  </div>
                </div>

                {Boolean(program.nutrition?.beverage_sugar_intake && program.nutrition.beverage_sugar_intake !== 'zero_or_sweetener') && (
                  <div style={{
                    background: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    color: '#92400E',
                    height: '40px',
                    padding: '0 8px',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#92400E', lineHeight: 1 }}>سكر المشروبات</span>
                    <strong style={{ fontSize: '12px', fontWeight: 800, lineHeight: 1.2, marginTop: '2px' }}>
                      {program.nutrition.beverage_sugar_intake === '1_tsp' ? '+5g C (20 kcal)' :
                       program.nutrition.beverage_sugar_intake === '2_tsp' ? '+10g C (40 kcal)' : '+15g C (60 kcal)'}
                    </strong>
                  </div>
                )}

                {/* Calorie Diff / Surplus Card */}
                {totalPlannedCal > 0 && (
                  <div style={{
                    background: Math.abs(diffCal) <= 25 ? '#F0FDF4' : diffCal > 0 ? '#FFFBEB' : '#F0F9FF',
                    border: '1px solid ' + (Math.abs(diffCal) <= 25 ? '#BBF7D0' : diffCal > 0 ? '#FDE68A' : '#BAE6FD'),
                    color: Math.abs(diffCal) <= 25 ? '#15803D' : diffCal > 0 ? '#B45309' : '#0369A1',
                    height: '40px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{ fontSize: '10px', color: Math.abs(diffCal) <= 25 ? '#166534' : diffCal > 0 ? '#92400E' : '#075985', fontWeight: 800, lineHeight: 1 }}>
                      فرق السعرات
                    </span>
                    <strong style={{ fontSize: '12px', fontWeight: 800, lineHeight: 1.2, marginTop: '2px' }}>
                      {Math.abs(diffCal) <= 25 ? 'مطابق للتارجت' : diffCal > 0 ? `فائض +${diffCal} kcal` : `متبقي ${Math.abs(diffCal)} kcal`}
                    </strong>
                  </div>
                )}
              </div>

              {/* Action Buttons on Left */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={toggleAutoRipple}
                  style={{
                    height: '40px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    background: isAutoRippleOn ? '#EFF6FF' : '#FFFFFF',
                    color: isAutoRippleOn ? '#1D4ED8' : '#344054',
                    border: '1px solid ' + (isAutoRippleOn ? '#BFDBFE' : '#D0D5DD'),
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: isAutoRippleOn ? '0 1px 2px rgba(37, 99, 235, 0.1)' : '0 1px 2px rgba(16, 24, 40, 0.04)',
                    transition: 'all 0.15s ease'
                  }}
                  title="الموازنة التلقائية اللحظية: عند إضافة أو تعديل أو حذف أي صنف تتعدل بقية الوجبات تلقائياً لتغلق الماكروز بالملي"
                >
                  <Zap size={13} color={isAutoRippleOn ? '#2563EB' : '#64748B'} />
                  <span>الموازنة اللحظية: {isAutoRippleOn ? 'مفعلة' : 'متوقفة'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddNewMeal}
                  style={{
                    height: '40px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    background: '#673DE6',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 1px 3px rgba(103, 61, 230, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#5025D1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#673DE6'; }}
                >
                  <Plus size={14} />
                  <span>إضافة وجبة</span>
                </button>
              </div>
            </div>

            {/* Meals Grid (2-Column Balanced Sleek Grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '12px' }}>
              {program.nutrition?.meals?.map((meal) => {
                const cleanTitle = getCleanMealTitle(meal.name);
                const subtitleMatch = String(meal.name || '').match(/\(([^)]+)\)/);
                const subtitle = subtitleMatch ? subtitleMatch[1].trim() : '';

                return (
                  <div
                    key={meal.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #EAECF0',
                      borderRadius: '16px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '10px',
                      boxShadow: '0 1px 3px rgba(16, 24, 40, 0.03)',
                      boxSizing: 'border-box',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Meal Header */}
                    <div>
                      {/* Row 1: Clean bold title on one single line + Time on right, Action buttons on left */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px',
                        width: '100%'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                          <strong
                            style={{
                              fontSize: '14px',
                              color: '#101828',
                              fontWeight: 800,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={meal.name}
                          >
                            {cleanTitle}
                          </strong>
                          <span style={{
                            fontSize: '11px',
                            color: '#475467',
                            background: '#F2F4F7',
                            border: '1px solid #EAECF0',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            flexShrink: 0,
                            whiteSpace: 'nowrap'
                          }}>
                            {meal.time}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {meal.items && meal.items.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleAutoBalanceMeal(meal.id)}
                              style={{
                                height: '28px',
                                padding: '0 10px',
                                borderRadius: '8px',
                                background: '#ECFDF5',
                                border: '1px solid #A7F3D0',
                                color: '#065F46',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.12s ease',
                                boxShadow: '0 1px 2px rgba(6, 95, 70, 0.04)'
                              }}
                              title="موازنة أصناف هذه الوجبة بجرامات واقعية متناسقة تسد حصتها من الماكروز"
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#D1FAE5'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#ECFDF5'; }}
                            >
                              <Zap size={12} />
                              <span>موازنة</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setAddFoodModal({ open: true, mealId: meal.id })}
                            style={{
                              height: '28px',
                              padding: '0 12px',
                              borderRadius: '8px',
                              background: '#673DE6',
                              border: 'none',
                              color: '#FFFFFF',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 1px 2px rgba(103, 61, 230, 0.2)',
                              transition: 'all 0.12s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#5025D1'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#673DE6'; }}
                          >
                            <Plus size={12} />
                            <span>صنف غذائي</span>
                          </button>

                          {handleDuplicateMeal && (
                            <button
                              type="button"
                              onClick={() => handleDuplicateMeal(meal.id)}
                              style={{
                                height: '28px',
                                padding: '0 10px',
                                borderRadius: '8px',
                                background: '#FFFFFF',
                                border: '1px solid #D0D5DD',
                                color: '#344054',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.12s ease',
                                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
                              }}
                              title="نسخ هذه الوجبة بالكامل بجميع أصنافها"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#F9FAFB';
                                e.currentTarget.style.borderColor = '#CBD5E1';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#FFFFFF';
                                e.currentTarget.style.borderColor = '#D0D5DD';
                              }}
                            >
                              <Copy size={12} />
                              <span>نسخ</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteMeal(meal.id)}
                            style={{
                              width: '28px',
                              height: '28px',
                              border: '1px solid #D0D5DD',
                              background: '#FFFFFF',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '8px',
                              transition: 'all 0.12s ease',
                              boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
                            }}
                            title="حذف الوجبة"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#DC2626';
                              e.currentTarget.style.borderColor = '#FECACA';
                              e.currentTarget.style.background = '#FEF2F2';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#94A3B8';
                              e.currentTarget.style.borderColor = '#D0D5DD';
                              e.currentTarget.style.background = '#FFFFFF';
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Timing segmented control + subtitle */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #F1F5F9',
                        paddingBottom: '8px',
                        marginBottom: '8px',
                        gap: '8px',
                        width: '100%'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>توقيت الوجبة:</span>
                          <div style={{ display: 'inline-flex', background: '#F2F4F7', padding: '2px', borderRadius: '8px', border: '1px solid #EAECF0', gap: '2px' }}>
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
                                    border: isAct ? (opt.id === 'PRE_WORKOUT' ? '1px solid #FCD34D' : opt.id === 'POST_WORKOUT' ? '1px solid #86EFAC' : '1px solid #CBD5E1') : '1px solid transparent',
                                    cursor: 'pointer',
                                    padding: '3px 9px',
                                    fontSize: '10px',
                                    fontWeight: isAct ? 800 : 600,
                                    borderRadius: '6px',
                                    background: isAct ? (opt.id === 'PRE_WORKOUT' ? '#FEF3C7' : opt.id === 'POST_WORKOUT' ? '#DCFCE7' : '#FFFFFF') : 'transparent',
                                    color: isAct ? (opt.id === 'PRE_WORKOUT' ? '#92400E' : opt.id === 'POST_WORKOUT' ? '#166534' : '#101828') : '#475467',
                                    boxShadow: isAct ? '0 1px 2px rgba(16, 24, 40, 0.08)' : 'none',
                                    transition: 'all 0.12s ease'
                                  }}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {subtitle && (
                          <span
                            style={{
                              fontSize: '9.5px',
                              color: '#64748B',
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '220px'
                            }}
                            title={subtitle}
                          >
                            {subtitle}
                          </span>
                        )}
                      </div>

                      {/* Meal Food Items (Precision Grid with Full Visible Name) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {meal.items?.map((item, iIdx) => {
                          const upper = String(item.code || item.name).toUpperCase();
                          const amt = Number(item.amount) || 0;
                          let hint = '';
                          if (['CHICKEN', 'دجاج', 'فراخ', 'TURKEY'].some(c => upper.includes(c))) hint = `(~${Math.round(amt / 0.75)} نيء)`;
                          else if (['BEEF', 'لحم', 'كفتة'].some(c => upper.includes(c))) hint = `(~${Math.round(amt / 0.72)} نيء)`;
                          else if (['FISH', 'سمك', 'فيليه', 'SHRIMP', 'جمبري', 'SALMON'].some(c => upper.includes(c))) hint = `(~${Math.round(amt / 0.80)} نيء)`;
                          else if (['RICE', 'أرز', 'ارز'].some(c => upper.includes(c))) hint = `(~${Math.round(amt / 2.6)} جاف)`;
                          else if (['PASTA', 'مكرونة'].some(c => upper.includes(c))) hint = `(~${Math.round(amt / 2.3)} جافة)`;
                          else if (['OATS', 'شوفان'].some(c => upper.includes(c))) hint = `(~${Math.round(amt * 2.8)} مطبوخ)`;

                          return (
                            <div
                              key={item.id || iIdx}
                              style={{
                                background: '#F8FAFC',
                                border: '1px solid #EAECF0',
                                borderRadius: '10px',
                                padding: '9px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '5px',
                                boxSizing: 'border-box',
                                transition: 'all 0.12s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#FFFFFF';
                                e.currentTarget.style.borderColor = '#CBD5E1';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 24, 40, 0.04)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#F8FAFC';
                                e.currentTarget.style.borderColor = '#EAECF0';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              {/* Row 1: Item Name & Hint on Right, Grams Input on Left */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%', minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                                  <span
                                    style={{
                                      color: '#101828',
                                      fontWeight: 700,
                                      fontSize: '13px',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                    title={item.name}
                                  >
                                    {item.name}
                                  </span>

                                  {hint && (
                                    <span
                                      style={{
                                        fontSize: '9.5px',
                                        color: '#0284C7',
                                        fontWeight: 700,
                                        background: '#F0F9FF',
                                        border: '1px solid #BAE6FD',
                                        padding: '1px 6px',
                                        borderRadius: '6px',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0
                                      }}
                                    >
                                      {hint}
                                    </span>
                                  )}
                                </div>

                                {/* Grams Amount Box on Left */}
                                <div style={{
                                  width: '64px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: '#FFFFFF',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '8px',
                                  padding: '0 4px',
                                  height: '26px',
                                  boxSizing: 'border-box',
                                  flexShrink: 0
                                }}>
                                  <input
                                    type="text"
                                    className="bare-input inline-pill-input clean-inline-input"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    dir="ltr"
                                    value={item.amount !== undefined ? item.amount : 100}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/[^0-9]/g, '');
                                      handleUpdateFoodAmount(meal.id, iIdx, val);
                                    }}
                                    style={{
                                      width: '32px',
                                      height: '22px',
                                      minHeight: 0,
                                      border: 'none',
                                      borderRadius: 0,
                                      boxShadow: 'none',
                                      textAlign: 'center',
                                      fontWeight: 800,
                                      fontSize: '12.5px',
                                      outline: 'none',
                                      color: '#101828',
                                      background: 'transparent',
                                      direction: 'ltr',
                                      padding: 0
                                    }}
                                  />
                                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#475467', marginRight: '2px', flexShrink: 0 }}>
                                    {item.unit || 'جم'}
                                  </span>
                                </div>
                              </div>

                              {/* Row 2: Calories & Macros on Right (under the name), Actions on Left (under grams) */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                                width: '100%',
                                paddingTop: '2px'
                              }}>
                                {/* Nutrition Strip on Right */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  flexWrap: 'nowrap',
                                  fontSize: '11px',
                                  fontFamily: 'JetBrains Mono, Cairo, monospace',
                                  direction: 'ltr'
                                }}>
                                  <span style={{ fontWeight: 800, color: '#0F172A' }}>
                                    {item.cal || 0} kcal
                                  </span>
                                  <span style={{ color: '#CBD5E1', fontWeight: 400 }}>·</span>
                                  <span style={{ color: '#0284C7', fontWeight: 800 }}>P {item.p || 0}g</span>
                                  <span style={{ color: '#CBD5E1', fontWeight: 400 }}>·</span>
                                  <span style={{ color: '#D97706', fontWeight: 800 }}>C {item.c || 0}g</span>
                                  <span style={{ color: '#CBD5E1', fontWeight: 400 }}>·</span>
                                  <span style={{ color: '#475467', fontWeight: 800 }}>F {item.f || 0}g</span>
                                </div>

                                {/* Quick Actions on Left (Centered with Grams Box) */}
                                <div style={{
                                  width: '64px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  flexShrink: 0
                                }}>
                                  <button
                                    type="button"
                                    onClick={() => setSwapFoodModal({ open: true, mealId: meal.id, itemIdx: iIdx, currentItem: item })}
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      border: '1px solid #E2E8F0',
                                      background: '#FFFFFF',
                                      color: '#64748B',
                                      cursor: 'pointer',
                                      padding: 0,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '6px',
                                      transition: 'all 0.15s ease',
                                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
                                    }}
                                    title="تبديل الصنف ببديل متكافئ بالمللي"
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = '#2563EB';
                                      e.currentTarget.style.borderColor = '#BFDBFE';
                                      e.currentTarget.style.background = '#EFF6FF';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = '#64748B';
                                      e.currentTarget.style.borderColor = '#E2E8F0';
                                      e.currentTarget.style.background = '#FFFFFF';
                                    }}
                                  >
                                    <ArrowRightLeft size={12} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFood(meal.id, iIdx)}
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      border: '1px solid #E2E8F0',
                                      background: '#FFFFFF',
                                      color: '#94A3B8',
                                      cursor: 'pointer',
                                      padding: 0,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '6px',
                                      transition: 'all 0.15s ease',
                                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)'
                                    }}
                                    title="حذف الصنف"
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = '#DC2626';
                                      e.currentTarget.style.borderColor = '#FECACA';
                                      e.currentTarget.style.background = '#FEF2F2';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = '#94A3B8';
                                      e.currentTarget.style.borderColor = '#E2E8F0';
                                      e.currentTarget.style.background = '#FFFFFF';
                                    }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Meal Footer Macros */}
                    <div style={{
                      borderTop: '1px solid #F1F5F9',
                      paddingTop: '8px',
                      marginTop: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px',
                      color: '#475467'
                    }}>
                      <span style={{ fontWeight: 700, color: '#475569' }}>
                        المجموع: <strong style={{ color: '#101828', fontSize: '12px', fontWeight: 800 }}>{meal.macros?.calories || 0} kcal</strong>
                      </span>
                      <span style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, Cairo, sans-serif' }}>
                        بروتين: <strong style={{ color: '#0284C7', fontWeight: 800 }}>{meal.macros?.protein || 0}g</strong> • كارب: <strong style={{ color: '#B45309', fontWeight: 800 }}>{meal.macros?.carbs || 0}g</strong> • دهون: <strong style={{ color: '#101828', fontWeight: 800 }}>{meal.macros?.fats || 0}g</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
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
                border: '1px solid #EAECF0',
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
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#101828' }}>
                    <Target size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#101828' }}>تعديل المستهدفات اليومية</h3>
                    <span style={{ fontSize: '11px', color: '#475467' }}>تحديد مستهدفات السعرات والماكروز اليومية للخطة</span>
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
              {hasProteinCap && (
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
                      ? `تنبيه سريري: البروتين المدخل (${editTargetsState.protein} جم) يتجاوز السقف اللي التحاليل حددته (${maxSafeProtein} جم). سيتم توثيق هذا التجاوز في سجل المراجعة السريرية.`
                      : `سقف بروتين من التحاليل: ${maxSafeProtein} جم/يوم.`}
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
                  <label style={{ fontSize: '11px', fontWeight: 700, color: hasProteinCap && Number(editTargetsState.protein) > maxSafeProtein ? '#DC2626' : '#475569', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>البروتين (جم)</span>
                    {hasProteinCap && <span style={{ fontSize: '9.5px', color: '#DC2626' }}>سقف: {maxSafeProtein}g</span>}
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
                      border: hasProteinCap && Number(editTargetsState.protein) > maxSafeProtein ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                      background: hasProteinCap && Number(editTargetsState.protein) > maxSafeProtein ? '#FEF2F2' : '#FFFFFF',
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
              <div style={{ fontSize: '11px', color: '#475467', background: '#F9FAFB', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>مجموع سعرات الماكروز المحسوبة:</span>
                <strong style={{ color: '#101828' }}>
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
                    background: '#673DE6', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(103, 61, 230, 0.2)'
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
