import React from 'react';
import { ArrowRightLeft, Dumbbell, Search, X } from 'lucide-react';
import { ADD_EX_MUSCLE_CATEGORIES, ADD_EX_EQUIPMENT_OPTIONS } from '../../constants/coachEditorConstants';
import { getExerciseDisplayNames } from '../../../../utils/exerciseTranslator';
import { arabicSearchMatch } from '../../../../utils/searchUtils';
import { getShortMuscleName, getShortEquipmentName } from '../../../ExerciseLibrary';

export function CoachSwapExerciseModal({
  swapExModal,
  setSwapExModal,
  swapExSearch,
  setSwapExSearch,
  allExercisesList,
  handleExecuteExerciseSwap
}) {
  if (!swapExModal.open || !swapExModal.currentEx) return null;

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
      <div style={{ maxWidth: '560px', width: '100%', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '85vh', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
        
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
            style={{ width: '100%', height: '32px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 28px 0 10px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box' }}
          />
          <Search size={13} style={{ position: 'absolute', right: '9px', top: '10px', color: '#94A3B8' }} />
        </div>

        {/* Exercises List Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '380px', paddingRight: '2px' }}>
          
          {/* Direct Twin Swaps Section */}
          {twinExercises.length > 0 && !swapExSearch && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '4px 8px', borderRadius: '8px' }}>
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
                      <span style={{ fontSize: '9.5px', background: '#E0F2FE', color: '#0284C7', padding: '1px 5px', borderRadius: '6px', fontWeight: 700 }}>
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
                      borderRadius: '7px',
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
                  borderRadius: '8px',
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
                    borderRadius: '7px',
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
}

export function CoachAddExerciseModal({
  addExModal,
  setAddExModal,
  program,
  allExercisesList,
  addExMuscleFilter,
  setAddExMuscleFilter,
  addExEquipmentFilter,
  setAddExEquipmentFilter,
  exModalSearch,
  setExModalSearch,
  handleAddExerciseToSession
}) {
  if (!addExModal.open) return null;

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
          <button type="button" onClick={() => setAddExModal({ open: false, sessionIdx: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}>
            <X size={16} />
          </button>
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
                borderRadius: '6px',
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
                        <span style={{ background: '#E2E8F0', color: '#334155', padding: '1px 6px', borderRadius: '6px', fontSize: '9.5px', fontWeight: 600 }}>
                          {getShortMuscleName(ex.muscle_ar || ex.target_muscle, ex.muscle_group)}
                        </span>
                        <span style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#64748B', padding: '1px 6px', borderRadius: '6px', fontSize: '9.5px' }}>
                          {getShortEquipmentName(ex.equipment_ar, ex.equipment)}
                        </span>
                        {altCount > 0 && (
                          <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '1px 6px', borderRadius: '6px', fontSize: '9.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
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
                        borderRadius: '7px',
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
}
