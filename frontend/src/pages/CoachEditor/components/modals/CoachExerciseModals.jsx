import React, { useState } from 'react';
import { ArrowRightLeft, Dumbbell, Search, X, ShieldCheck, Zap } from 'lucide-react';
import { ADD_EX_MUSCLE_CATEGORIES, ADD_EX_EQUIPMENT_OPTIONS } from '../../constants/coachEditorConstants';
import { getExerciseDisplayNames } from '../../../../utils/exerciseTranslator';
import { arabicSearchMatch } from '../../../../utils/searchUtils';
import { getShortMuscleName, getShortEquipmentName } from '../../../ExerciseLibrary';
import { getTorqueMatchedSwaps, RESISTANCE_PROFILES } from '../../../../utils/biomechanicalSwapEngine';
import { getGymRushEquivalentSwap, JOINT_PAIN_SWAP_MATRIX } from '../../../../utils/biomechanicsFirewallEngine';
import CurvedSelect from '../../../../components/common/CurvedSelect';

export function CoachSwapExerciseModal({
  swapExModal,
  setSwapExModal,
  swapExSearch,
  setSwapExSearch,
  allExercisesList,
  handleExecuteExerciseSwap
}) {
  const [activeTab, setActiveTab] = useState('ALL');

  if (!swapExModal.open || !swapExModal.currentEx) return null;

  const curId = swapExModal.currentEx.code || swapExModal.currentEx.id;
  const curMatch = allExercisesList.find(e => e.id === curId || e.code === curId || e.name_ar === swapExModal.currentEx.name || e.name === swapExModal.currentEx.name);
  const twinAltIds = Array.isArray(curMatch?.alternatives) ? curMatch.alternatives : [];

  // 1. Direct Twin alternatives (from Bidirectional Smart Linker)
  const twinExercises = allExercisesList.filter(e => twinAltIds.includes(e.id) || twinAltIds.includes(e.code));

  // 2. Torque-Matched Biomechanical Swaps
  const torqueData = getTorqueMatchedSwaps(curId || curMatch?.name_en || swapExModal.currentEx.name);
  const torqueSwaps = Array.isArray(torqueData?.matched_swaps) ? torqueData.matched_swaps : [];

  // 3. Gym Rush Equivalence Swap (Machine Busy / Out of Order)
  const gymRushData = getGymRushEquivalentSwap(curId || curMatch?.name_en || swapExModal.currentEx.name);

  // 4. Joint Pain Firewall Swaps
  let jointPainMatches = [];
  const normalizedCurId = String(curId || '').toUpperCase();
  Object.entries(JOINT_PAIN_SWAP_MATRIX).forEach(([jointKey, jointData]) => {
    const isForbidden = jointData.forbidden_movements.some(m => normalizedCurId.includes(m) || m.includes(normalizedCurId));
    if (isForbidden) {
      jointPainMatches.push({
        joint: jointKey,
        swaps: jointData.recommended_swaps
      });
    }
  });

  // 5. Generic / Other Compatible Alternatives
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

  const handleSelectSwapCandidate = (candidate) => {
    if (candidate.id && candidate.muscle_group) {
      handleExecuteExerciseSwap(swapExModal.sessionIdx, swapExModal.exIdx, candidate);
      return;
    }

    const lookupKey = candidate.code || candidate.swap_id || candidate.id || candidate.name;
    const existing = allExercisesList.find(e => 
      e.id === lookupKey || 
      e.code === lookupKey || 
      e.name === lookupKey || 
      e.name_en === lookupKey ||
      arabicSearchMatch(e.name_ar, candidate.name_ar || candidate.name) ||
      arabicSearchMatch(e.name, candidate.name)
    );

    if (existing) {
      handleExecuteExerciseSwap(swapExModal.sessionIdx, swapExModal.exIdx, existing);
      return;
    }

    const synthetic = {
      id: candidate.id || candidate.code || `swap_${Date.now()}`,
      code: (candidate.code || candidate.swap_id || candidate.id || 'SWAP').toUpperCase(),
      name: candidate.name || candidate.name_en || candidate.name_ar || 'بديل تدريبي',
      name_en: candidate.name_en || candidate.name || candidate.name_ar,
      name_ar: candidate.name_ar || candidate.name || 'بديل تدريبي متطابق',
      equipment: candidate.equipment || 'أوزان / أجهزة',
      muscle_group: candidate.muscle_group || swapExModal.currentEx?.muscle_group || 'GENERAL',
      safetyNote: candidate.rationale_ar || candidate.coaching_cue_ar || candidate.biomechanical_advantage_ar || 'أداء محكوم مع عزل المفاصل',
      profile: candidate.profile || 'MID_RANGE_COMPOUND',
    };
    handleExecuteExerciseSwap(swapExModal.sessionIdx, swapExModal.exIdx, synthetic);
  };

  const getProfileBadgeLabel = (profile) => {
    if (profile === RESISTANCE_PROFILES.LENGTHENED_OVERLOAD) return 'أقصى استطالة (Lengthened)';
    if (profile === RESISTANCE_PROFILES.SHORTENED_OVERLOAD) return 'أقصى انقباض (Shortened)';
    if (profile === RESISTANCE_PROFILES.MID_RANGE_COMPOUND) return 'مركب متعدد المفاصل (Compound)';
    return 'مطابق ميكانيكياً';
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} dir="rtl">
      <div style={{ maxWidth: '640px', width: '100%', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '88vh', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowRightLeft size={15} color="#0284C7" />
              <span>بدائل التمرين الذكية لـ ({getExerciseDisplayNames(swapExModal.currentEx).nameEn})</span>
            </h4>
            <span style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px', display: 'block' }}>
              منظومة متكاملة: تطابق عزم الدوران، بدائل زحمة الجيم، وجدار أمان المفاصل
            </span>
          </div>
          <button type="button" onClick={() => setSwapExModal({ open: false, sessionIdx: null, exIdx: null, currentEx: null })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            <X size={15} />
          </button>
        </div>

        {/* Filter Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#F8FAFC', padding: '4px', borderRadius: '10px', border: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'كافة البدائل' },
            { id: 'TWIN', label: `التوأم المباشر (${twinExercises.length})` },
            { id: 'TORQUE', label: `عزم الدوران (${torqueSwaps.length})` },
            { id: 'GYM_RUSH', label: gymRushData.found ? 'بديل زحمة الجيم (متاح)' : 'بديل زحمة الجيم' },
            { id: 'JOINT_SAFE', label: `أمان المفاصل (${jointPainMatches.reduce((acc, m) => acc + m.swaps.length, 0)})` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                minWidth: '85px',
                padding: '5px 8px',
                borderRadius: '7px',
                border: 'none',
                background: activeTab === tab.id ? '#0F172A' : 'transparent',
                color: activeTab === tab.id ? '#FFFFFF' : '#475569',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                whiteSpace: 'nowrap',
                textAlign: 'center'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="ابحث بالاسم العربي، الإنجليزي، أو الكود..."
            value={swapExSearch}
            onChange={(e) => setSwapExSearch(e.target.value)}
            style={{ width: '100%', height: '32px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 28px 0 10px', fontSize: '11.5px', outline: 'none', boxSizing: 'border-box' }}
          />
          <Search size={13} style={{ position: 'absolute', right: '9px', top: '10px', color: '#94A3B8' }} />
        </div>

        {/* Exercises List Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '420px', paddingRight: '2px' }}>
          
          {/* Section 1: Direct Twin Swaps */}
          {(activeTab === 'ALL' || activeTab === 'TWIN') && twinExercises.length > 0 && !swapExSearch && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '5px 10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284C7', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <ArrowRightLeft size={13} />
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
                    borderRadius: '10px',
                    padding: '8px 12px',
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
                      <span style={{ fontSize: '9.5px', background: '#E0F2FE', color: '#0284C7', padding: '1px 6px', borderRadius: '6px', fontWeight: 700 }}>
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
                    onClick={() => handleSelectSwapCandidate(twinEx)}
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      background: '#0284C7',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    اختيار البديل التوأم
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Section 2: Torque-Matched Biomechanical Swaps */}
          {(activeTab === 'ALL' || activeTab === 'TORQUE') && torqueSwaps.length > 0 && !swapExSearch && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAF5FF', border: '1px solid #E9D5FF', padding: '5px 10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#7E22CE', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Zap size={13} />
                  <span>بدائل عزم الدوران والميكانيكا الحيوية ({getProfileBadgeLabel(torqueData.resistance_profile)})</span>
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#7E22CE' }}>{torqueSwaps.length} بدائل مطابقة</span>
              </div>

              {torqueSwaps.map((tSwap, tsIdx) => (
                <div
                  key={tsIdx}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E9D5FF',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '12px', color: '#0F172A', direction: 'ltr', display: 'inline-block' }}>
                        {tSwap.name}
                      </strong>
                      <span style={{ fontSize: '9.5px', background: '#F3E8FF', color: '#7E22CE', padding: '1px 6px', borderRadius: '6px', fontWeight: 700 }}>
                        {getProfileBadgeLabel(tSwap.profile)}
                      </span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>
                      {tSwap.rationale_ar}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectSwapCandidate(tSwap)}
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      background: '#7E22CE',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    استبدال ميكانيكياً
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Section 3: Gym Rush Swaps */}
          {(activeTab === 'ALL' || activeTab === 'GYM_RUSH') && gymRushData.found && !swapExSearch && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '5px 10px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#B45309', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Dumbbell size={13} />
                  <span>بديل زحمة الجيم (عند انشغال الجهاز المخصص)</span>
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#B45309' }}>بديل حر فوري</span>
              </div>

              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #FDE68A',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div>
                  <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>
                    {gymRushData.biomechanical_swap_ar}
                  </strong>
                  <div style={{ fontSize: '10.5px', color: '#78350F', marginTop: '2px' }}>
                    توجيه الأداء: {gymRushData.coaching_cue_ar}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectSwapCandidate({
                    id: gymRushData.swap_id,
                    name: gymRushData.biomechanical_swap_ar,
                    name_ar: gymRushData.biomechanical_swap_ar,
                    coaching_cue_ar: gymRushData.coaching_cue_ar
                  })}
                  style={{
                    height: '28px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    background: '#B45309',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  تطبيق بديل الزحمة
                </button>
              </div>
            </div>
          )}

          {/* Section 4: Joint Pain Shield Swaps */}
          {(activeTab === 'ALL' || activeTab === 'JOINT_SAFE') && jointPainMatches.length > 0 && !swapExSearch && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {jointPainMatches.map((jpm, jIdx) => (
                <div key={jIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FEF2F2', border: '1px solid #FECACA', padding: '5px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#B91C1C', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <ShieldCheck size={13} />
                      <span>جدار حماية المفاصل ({jpm.joint}): بدائل آمنة لعزل الإجهاد القصي</span>
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#B91C1C' }}>{jpm.swaps.length} بدائل آمنة</span>
                  </div>

                  {jpm.swaps.map((jSwap, jsIdx) => (
                    <div
                      key={jsIdx}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #FECACA',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '12px', color: '#0F172A', display: 'block' }}>
                          {jSwap.name_ar}
                        </strong>
                        <div style={{ fontSize: '10.5px', color: '#7F1D1D', marginTop: '2px' }}>
                          الميزة البيوميكانيكية: {jSwap.biomechanical_advantage_ar}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectSwapCandidate(jSwap)}
                        style={{
                          height: '28px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          background: '#B91C1C',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        تطبيق البديل الآمن
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Section 5: Other Anatomically Compatible Exercises */}
          {(activeTab === 'ALL' || swapExSearch) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {!swapExSearch && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginTop: '4px' }}>
                  تمارين بديلة متوافقة تشريحياً من المكتبة:
                </span>
              )}

              {otherCandidates.slice(0, 35).map((targetEx, teIdx) => (
                <div
                  key={targetEx.id || teIdx}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '8px 12px',
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
                    onClick={() => handleSelectSwapCandidate(targetEx)}
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      borderRadius: '8px',
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

              {otherCandidates.length === 0 && twinExercises.length === 0 && torqueSwaps.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '11.5px' }}>
                  لا توجد تمارين بديلة مطابقة لبحثك.
                </div>
              )}
            </div>
          )}

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
            <CurvedSelect
              value={addExEquipmentFilter}
              onChange={(e) => setAddExEquipmentFilter(e.target.value)}
              style={{ height: '32px', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', fontWeight: 700, color: '#0F172A', background: '#FFFFFF', outline: 'none', cursor: 'pointer' }}
            >
              {ADD_EX_EQUIPMENT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </CurvedSelect>
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
