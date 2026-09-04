import React from 'react';
import { Save, Send, Dumbbell, Utensils, FileText, Activity, Loader2, Plus, Trash2, RotateCw, HeartPulse, Printer, X, ArrowRightLeft, Users, Clock, AlertCircle, CheckCircle2, Search, Check, Zap, Target, ShieldAlert, Flame } from 'lucide-react';

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
  }
];

export default function CoachEditorNutritionTab(props) {
  const { searchParams, setSearchParams, loading, setLoading, saving, setSaving, publishing, setPublishing, program, setProgram, coachNotes, setCoachNotes, activeSessionIdx, setActiveSessionIdx, activeWorkspaceTab, setActiveWorkspaceTab, notification, setNotification, clientsList, setClientsList, queueFilter, setQueueFilter, queueSearch, setQueueSearch, showQueueSlider, setShowQueueSlider, allExercisesList, setAllExercisesList, cardioSwapModal, setCardioSwapModal, addFoodModal, setAddFoodModal, swapFoodModal, setSwapFoodModal, addExModal, setAddExModal, swapExModal, setSwapExModal, mobilityModal, setMobilityModal, allMobilityList, setAllMobilityList, showReasoning, setShowReasoning, exModalSearch, setExModalSearch, foodModalSearch, setFoodModalSearch, mobilityModalSearch, setMobilityModalSearch, swapFoodSearch, setSwapFoodSearch, swapExSearch, setSwapExSearch, handleSelectClient, handleUpdateFoodAmount, handleDeleteFood, handleAddNewMeal, handleDeleteMeal, handleAddFoodToMeal, handleExecuteFoodSwap, handleExecuteExerciseSwap, handleUpdateExerciseParam, handleDeleteExercise, handleAddExerciseToSession, handleSelectCardioModality, handleAddMobilityToSession, handleRemoveMobilityFromSession, handleSaveDraft, handleApproveAndPublish, FOOD_DATABASE_LIST, CARDIO_MODALITY_OPTIONS } = props;

  const targetCal = Number(program?.nutrition?.targets?.calories) || 2000;
  const targetP = Number(program?.nutrition?.targets?.protein) || 150;
  const targetC = Number(program?.nutrition?.targets?.carbs) || 200;
  const targetF = Number(program?.nutrition?.targets?.fats) || 60;

  const mealsCal = program?.nutrition?.meals?.reduce((sum, m) => sum + (Number(m.macros?.calories) || 0), 0) || 0;
  const mealsP = program?.nutrition?.meals?.reduce((sum, m) => sum + (Number(m.macros?.protein) || 0), 0) || 0;
  const mealsC = program?.nutrition?.meals?.reduce((sum, m) => sum + (Number(m.macros?.carbs) || 0), 0) || 0;
  const mealsF = program?.nutrition?.meals?.reduce((sum, m) => sum + (Number(m.macros?.fats) || 0), 0) || 0;

  const supps = program?.cardio?.supplements || [];
  const suppsCal = supps.reduce((sum, s) => sum + (Number(s.cal) || 0), 0);
  const suppsP = supps.reduce((sum, s) => sum + (Number(s.p) || 0), 0);
  const suppsC = supps.reduce((sum, s) => sum + (Number(s.c) || 0), 0);
  const suppsF = supps.reduce((sum, s) => sum + (Number(s.f) || 0), 0);

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
    const newItems = preset.items.map((it, idx) => ({
      ...it,
      id: `f_${Date.now()}_${idx}`
    }));
    const newMealObj = {
      id: `m${Date.now()}`,
      name: `الوجبة ${newMealNumber}: ${preset.name}`,
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '12.5px', color: '#0F172A', fontWeight: 800 }}>{meal.name}</strong>
                        <span style={{ fontSize: '10px', color: '#64748B', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>{meal.time}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                          {/* 1. Food Name & Category Badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                            <span style={{ color: '#0F172A', fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.name}
                            </span>
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
                    setProgram(prev => ({ ...prev, cardio: { ...(prev.cardio || {}), supplements: currentSupps } }));
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
                          setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: updated } }));
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
                          setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: updated } }));
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
                          setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: updated } }));
                        }}
                        style={{ height: '30px', borderRadius: '4px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', outline: 'none', background: '#FFFFFF' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = program.cardio.supplements.filter((_, i) => i !== sIdx);
                          setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: updated } }));
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
                            setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: updated } }));
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
                            setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: updated } }));
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
                            setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: updated } }));
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
                            setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: updated } }));
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
                        setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: updated } }));
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
