import React from 'react';
import { Search, X, ArrowRightLeft, Target, Activity } from 'lucide-react';

export default function CoachEditorModals(props) {
  const { searchParams, setSearchParams, loading, setLoading, saving, setSaving, publishing, setPublishing, program, setProgram, coachNotes, setCoachNotes, activeSessionIdx, setActiveSessionIdx, activeWorkspaceTab, setActiveWorkspaceTab, notification, setNotification, clientsList, setClientsList, queueFilter, setQueueFilter, queueSearch, setQueueSearch, showQueueSlider, setShowQueueSlider, allExercisesList, setAllExercisesList, cardioSwapModal, setCardioSwapModal, addFoodModal, setAddFoodModal, swapFoodModal, setSwapFoodModal, addExModal, setAddExModal, swapExModal, setSwapExModal, mobilityModal, setMobilityModal, allMobilityList, setAllMobilityList, showReasoning, setShowReasoning, exModalSearch, setExModalSearch, foodModalSearch, setFoodModalSearch, mobilityModalSearch, setMobilityModalSearch, swapFoodSearch, setSwapFoodSearch, swapExSearch, setSwapExSearch, handleSelectClient, handleUpdateFoodAmount, handleDeleteFood, handleAddNewMeal, handleDeleteMeal, handleAddFoodToMeal, handleExecuteFoodSwap, handleExecuteExerciseSwap, handleUpdateExerciseParam, handleDeleteExercise, handleAddExerciseToSession, handleSelectCardioModality, handleAddMobilityToSession, handleRemoveMobilityFromSession, handleSaveDraft, handleApproveAndPublish, FOOD_DATABASE_LIST, CARDIO_MODALITY_OPTIONS } = props;
  return (
<>

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
                    const matchSearch = !swapFoodSearch || (f.name && f.name.includes(swapFoodSearch));
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
        {swapExModal.open && swapExModal.currentEx && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
            <div style={{ maxWidth: '540px', width: '100%', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '85vh', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowRightLeft size={14} color="#2563EB" />
                    <span>البدائل المتطابقة ميكانيكياً لـ ({swapExModal.currentEx.name})</span>
                  </h4>
                  <span style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px', display: 'block' }}>
                    نفس الزاوية العضلية ومنحنى المقاومة مع مراعاة أمان المفاصل
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

              {/* Compatible Exercises List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '340px', paddingRight: '2px' }}>
                {allExercisesList
                  .filter(ex => !swapExSearch || (ex.name_ar && ex.name_ar.includes(swapExSearch)) || (ex.name && ex.name.toLowerCase().includes(swapExSearch.toLowerCase())))
                  .slice(0, 30)
                  .map((targetEx, teIdx) => (
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
                        <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>{targetEx.name_ar || targetEx.name}</strong>
                        <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px', display: 'flex', gap: '6px' }}>
                          <span>{targetEx.equipment || 'جهاز / أوزان'}</span>
                          <span>•</span>
                          <span>{targetEx.muscle_ar || targetEx.target_muscle || 'عضلة رئيسية'}</span>
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
              </div>
            </div>
          </div>
        )}

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
                      (d.name_ar && d.name_ar.toLowerCase().includes(mobilityModalSearch.toLowerCase())) ||
                      (d.target_area_ar && d.target_area_ar.includes(mobilityModalSearch));
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
        {addExModal.open && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
            <div style={{ maxWidth: '520px', width: '100%', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '85vh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '6px' }}>
                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>إضافة تمرين من المكتبة</h4>
                <button type="button" onClick={() => setAddExModal({ open: false, sessionIdx: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={15} /></button>
              </div>

              <input
                type="text"
                placeholder="ابحث باسم التمرين..."
                value={exModalSearch}
                onChange={(e) => setExModalSearch(e.target.value)}
                style={{ width: '100%', height: '30px', borderRadius: '5px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
                {allExercisesList
                  .filter(ex => !exModalSearch || (ex.name_ar && ex.name_ar.includes(exModalSearch)) || (ex.name_en && ex.name_en.toLowerCase().includes(exModalSearch.toLowerCase())))
                  .slice(0, 30)
                  .map((ex) => (
                    <div
                      key={ex.id}
                      onClick={() => handleAddExerciseToSession(addExModal.sessionIdx, ex)}
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '5px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div>
                        <strong style={{ fontSize: '11.5px', color: '#0F172A', display: 'block' }}>{ex.name_ar || ex.name}</strong>
                        <span style={{ fontSize: '10px', color: '#64748B' }}>{ex.muscle_ar || ex.target_muscle}</span>
                      </div>
                      <button type="button" style={{ padding: '2px 7px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: '3px', fontSize: '10px', fontWeight: 700 }}>+ إضافة</button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

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
                  .filter(fd => !foodModalSearch || (fd.name && fd.name.includes(foodModalSearch)) || (fd.name_ar && fd.name_ar.includes(foodModalSearch)))
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

</>
  );
}
