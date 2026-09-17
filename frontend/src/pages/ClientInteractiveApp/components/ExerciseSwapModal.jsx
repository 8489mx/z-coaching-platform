import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { API_BASE } from '../../../config/api';
import { getExerciseDisplayNames } from '../../../utils/exerciseTranslator';
import { getGymRushEquivalentSwap } from '../../../utils/biomechanicsFirewallEngine';
import { getCachedGymRushCatalog } from '../../../utils/offlineWorkoutSync';

export default function ExerciseSwapModal({
  exerciseSwapTarget,
  onClose,
  setWorkoutSession,
  clientInjuries = []
}) {
  const [exerciseSwapFilter, setExerciseSwapFilter] = useState('ALL'); // ALL | GYM | HOME
  const [exerciseSwapsList, setExerciseSwapsList] = useState([]);
  const [loadingExerciseSwaps, setLoadingExerciseSwaps] = useState(false);

  useEffect(() => {
    if (!exerciseSwapTarget?.exercise) {
      setExerciseSwapsList([]);
      setExerciseSwapFilter('ALL');
      return;
    }
    const targetEx = exerciseSwapTarget.exercise;
    const exCode = targetEx.code || targetEx.id || targetEx.exercise_code || targetEx.name;
    const rawInjuries = exerciseSwapTarget.injuries || targetEx.injuries || clientInjuries || [];
    const injuryArray = Array.isArray(rawInjuries) ? rawInjuries : [rawInjuries];
    const injuryQuery = injuryArray.map(i => typeof i === 'string' ? i : (i?.name || i?.code || '')).filter(Boolean).join(',');

    setLoadingExerciseSwaps(true);
    fetch(`${API_BASE}/api/v1/exercises/swaps/${encodeURIComponent(exCode)}?environment=${encodeURIComponent(exerciseSwapFilter)}&injury=${encodeURIComponent(injuryQuery)}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.swaps) && data.swaps.length > 0) {
          setExerciseSwapsList(data.swaps);
        } else {
          setExerciseSwapsList([]);
        }
      })
      .catch(err => {
        console.warn('Network offline or weak in gym, checking local cached gym rush catalog:', err);
        const cachedCatalog = getCachedGymRushCatalog();
        if (cachedCatalog && Array.isArray(cachedCatalog)) {
          const upperCode = String(exCode).toUpperCase();
          const localSwaps = cachedCatalog.filter(item => {
            return item.original_code === upperCode || item.primary_muscle === targetEx.target_muscle;
          }).map(item => ({
            exercise_id: item.swap_id,
            name_ar: item.name_ar,
            name_en: item.name_en,
            match_score: item.match_score || 95,
            equipment: item.equipment || 'DUMBBELL',
            joint_stress: 'LOW',
            equivalence_reason: item.equivalence_reason_ar || 'بديل مكافئ حركياً محفوظ محلياً لوضع عدم الاتصال'
          }));
          setExerciseSwapsList(localSwaps);
        } else {
          setExerciseSwapsList([]);
        }
      })
      .finally(() => {
        setLoadingExerciseSwaps(false);
      });
  }, [exerciseSwapTarget, exerciseSwapFilter, clientInjuries]);

  if (!exerciseSwapTarget) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 130,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#FFFFFF',
          color: '#0F172A',
          borderRadius: '20px',
          padding: '20px',
          direction: 'rtl',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
          maxHeight: '85vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '2px 8px', borderRadius: '6px' }}>
              محرك البدائل الحركية المتطابقة
            </span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>
              بدائل لـ: {exerciseSwapTarget.exercise.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={14} color="#64748B" />
          </button>
        </div>

        {/* Filter Chips: All, Rush, Gym, Home */}
        <div style={{ display: 'flex', gap: '4px', background: '#F8FAFC', padding: '4px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '12px' }}>
          {[
            { id: 'ALL', label: 'كافة البدائل' },
            { id: 'RUSH', label: 'بدائل الزحمة' },
            { id: 'GYM', label: 'بدائل الجيم' },
            { id: 'HOME', label: 'المنزل / دمبلز' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setExerciseSwapFilter(f.id)}
              style={{
                flex: 1,
                padding: '4px 6px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: exerciseSwapFilter === f.id ? '#0284C7' : 'transparent',
                color: exerciseSwapFilter === f.id ? '#FFFFFF' : '#64748B',
                transition: 'all 0.12s ease'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* FEATURED INSTANT GYM RUSH CARD */}
        {(() => {
          const targetEx = exerciseSwapTarget?.exercise;
          const exCode = targetEx?.code || targetEx?.id || targetEx?.exercise_code || targetEx?.name || '';
          const rushResult = getGymRushEquivalentSwap(exCode);

          if (!rushResult || !rushResult.found) return null;
          if (exerciseSwapFilter !== 'ALL' && exerciseSwapFilter !== 'RUSH' && exerciseSwapFilter !== 'GYM') return null;

          return (
            <div style={{
              background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
              border: '1.5px solid #7DD3FC',
              borderRadius: '14px',
              padding: '12px 14px',
              marginBottom: '14px',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0369A1', background: '#FFFFFF', padding: '2px 8px', borderRadius: '6px' }}>
                  بديل زحمة الجيم الفوري (تطابق بيوميكانيكي)
                </span>
                <span style={{ fontSize: '0.66rem', color: '#0284C7', fontWeight: 700 }}>
                  نفس منحنى المقاومة
                </span>
              </div>
              <strong style={{ display: 'block', fontSize: '0.86rem', color: '#0F172A', marginBottom: '4px' }}>
                {rushResult.biomechanical_swap_ar}
              </strong>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.72rem', color: '#475569', lineHeight: 1.4 }}>
                {rushResult.coaching_cue_ar}
              </p>
              <button
                type="button"
                onClick={() => {
                  setWorkoutSession(prev => {
                    const updated = [...prev.exercises];
                    const oldEx = updated[exerciseSwapTarget.exIdx];
                    updated[exerciseSwapTarget.exIdx] = {
                      ...oldEx,
                      id: rushResult.swap_id || oldEx.id,
                      code: String(rushResult.swap_id || oldEx.code).toUpperCase(),
                      name: rushResult.biomechanical_swap_ar,
                      name_ar: rushResult.biomechanical_swap_ar,
                      nameEn: rushResult.swap_id,
                      safetyNote: `بديل فوري لزحمة الجيم: ${rushResult.coaching_cue_ar}`
                    };
                    return { ...prev, exercises: updated };
                  });
                  onClose();
                }}
                style={{
                  width: '100%',
                  background: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                اعتماد بديل الزحمة فوراً وتخطي الانتظار
              </button>
            </div>
          );
        })()}

        <p style={{ fontSize: '0.74rem', color: '#64748B', marginBottom: '12px', lineHeight: 1.4 }}>
          الجهاز في الجيم زحمة أو مشغول؟ اختر أي بديل من البدائل التالية، يضمن المحرك تطابق زاوية الشد والأمان الحركي الكامل:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loadingExerciseSwaps ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '0.78rem' }}>
              جاري فحص البدائل المطابقة حركياً وميكانيكياً...
            </div>
          ) : (() => {
            const filtered = exerciseSwapsList.filter(s => {
              if (exerciseSwapFilter === 'GYM') return s.environment === 'GYM' || s.environment === 'GYM_OR_HOME';
              if (exerciseSwapFilter === 'HOME') return s.environment === 'HOME' || s.environment === 'GYM_OR_HOME' || s.equipment === 'DUMBBELL' || s.equipment === 'BODYWEIGHT' || s.equipment === 'RESISTANCE_BAND';
              return true;
            });

            if (filtered.length > 0) {
              return filtered.map((sw, sIdx) => {
                const isTwin = Boolean(sw.is_coach_twin);
                return (
                  <div 
                    key={sIdx}
                    style={{
                      background: isTwin ? '#F0F9FF' : '#F8FAFC',
                      border: `1px solid ${isTwin ? '#BAE6FD' : '#E2E8F0'}`,
                      borderRadius: '12px',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                        <strong style={{ fontSize: '0.82rem', color: '#0F172A', direction: 'ltr', display: 'inline-block' }}>
                          {getExerciseDisplayNames(sw).nameEn}
                        </strong>
                        {isTwin && (
                          <span style={{ fontSize: '0.65rem', background: '#0284C7', color: '#FFFFFF', padding: '1px 6px', borderRadius: '6px', fontWeight: 800 }}>
                            بديل توأم مباشر
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>
                        {getExerciseDisplayNames(sw).nameAr}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>
                          {sw.rationale_ar || sw.rationale || 'تطابق زاوية الشد والأمان الحركي'}
                        </span>
                        {sw.equipment_ar && (
                          <span style={{ fontSize: '0.65rem', background: '#E2E8F0', color: '#334155', padding: '1px 5px', borderRadius: '6px', fontWeight: 600 }}>
                            {sw.equipment_ar}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setWorkoutSession(prev => {
                          const updated = [...prev.exercises];
                          const oldEx = updated[exerciseSwapTarget.exIdx];
                          updated[exerciseSwapTarget.exIdx] = {
                            ...oldEx,
                            id: sw.exercise_code || sw.id || oldEx.id,
                            code: sw.exercise_code || sw.id,
                            name: sw.name_ar || sw.name,
                            nameEn: sw.name_en || oldEx.nameEn,
                            equipment: sw.equipment || oldEx.equipment,
                            cues_ar: sw.cues_ar || oldEx.cues_ar,
                            mistakes_ar: sw.mistakes_ar || oldEx.mistakes_ar,
                            image_stretch: sw.image_stretch || (sw.images && sw.images[0]) || oldEx.image_stretch,
                            image_contraction: sw.image_contraction || (sw.images && sw.images[1]) || oldEx.image_contraction,
                            video_url: sw.video_url || oldEx.video_url,
                            safetyNote: isTwin ? 'تم الاستبدال بالبديل التوأم المباشر' : `تم التبديل الذكي اليوم: ${sw.rationale_ar || sw.rationale || 'تطابق زاوية الشد'}`
                          };
                          return { ...prev, exercises: updated };
                        });
                        onClose();
                      }}
                      style={{
                        background: '#0284C7',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      اعتماد البديل
                    </button>
                  </div>
                );
              });
            }

            const defaultSwaps = [
              { name: 'سحب كابل فردي بمدى حركي كامل', rationale: 'تطابق زاوية الشد مع حرية حركة كاملة للمفصل' },
              { name: 'دمبلز مسنود بديل حر عالي التركيز', rationale: 'عزل ممتاز مع الحفاظ على استقامة العمود الفقري' },
              { name: 'جهاز عزل مخصص بمسار ثابت', rationale: 'أقصى درجات الأمان وثبات مسار الحركة' }
            ];

            return defaultSwaps.map((sw, sIdx) => (
              <div 
                key={sIdx}
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.82rem', color: '#0F172A', display: 'block' }}>
                    {sw.name}
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>
                    {sw.rationale}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWorkoutSession(prev => {
                      const updated = [...prev.exercises];
                      updated[exerciseSwapTarget.exIdx] = {
                        ...updated[exerciseSwapTarget.exIdx],
                        name: sw.name,
                        safetyNote: `تم التبديل الذكي اليوم: ${sw.rationale}`
                      };
                      return { ...prev, exercises: updated };
                    });
                    onClose();
                  }}
                  style={{
                    background: '#0284C7',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  اعتماد البديل
                </button>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
