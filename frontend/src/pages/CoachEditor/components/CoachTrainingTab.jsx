import React from 'react';
import { 
  Play, 
  ArrowRightLeft, 
  Trash2, 
  HeartPulse, 
  Plus, 
  X,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  Copy
} from 'lucide-react';
import { getExerciseDisplayNames } from '../../../utils/exerciseTranslator';

export function CoachTrainingTab({
  program,
  selectedWeek,
  setSelectedWeek,
  currentWeekData,
  currentSessions = [],
  activeSessionIdx,
  setActiveSessionIdx,
  activeSession,
  handleRemoveMobilityFromSession,
  setMobilityModal,
  setActiveVideoModalEx,
  handleUpdateExerciseParam,
  setSwapExModal,
  handleDeleteExercise,
  setAddExModal,
  handleMoveExercise,
  handleDuplicateSession,
  activeSessionDemand,
  weeklyVolumeAudit
}) {
  const [showAllVolumeLandmarks, setShowAllVolumeLandmarks] = React.useState(false);

  const formatSplitName = (split) => {
    if (!split) return '';
    const s = String(split).toUpperCase().trim();
    if (s.includes('UPPER_LOWER')) return 'تقسيم علوي / سفلي (Upper / Lower Split)';
    if (s.includes('PUSH_PULL_LEGS') || s.includes('PPL')) return 'دفع / سحب / أرجل (PPL Split)';
    if (s.includes('FULL_BODY')) return 'تدريب الجسم بالكامل (Full Body)';
    if (s.includes('BRO_SPLIT') || s.includes('BODY_PART')) return 'تقسيم عضلات منفصلة (Body Part Split)';
    return split;
  };

  const clientConditions = [
    ...(Array.isArray(program?.client?.injuries) ? program.client.injuries : []),
    ...(Array.isArray(program?.client?.allergies) ? program.client.allergies : []),
    ...(Array.isArray(program?.client?.medical_conditions) ? program.client.medical_conditions : []),
  ];

  const hasHypertension = Boolean(
    program?.clinical_guardrails?.hypertension_guard_active ||
    clientConditions.some(c => {
      const s = typeof c === 'string' ? c : (c?.conditionCode || c?.name || c?.area || '');
      return /hypertension|ضغط|ارتفاع.*الضغط/i.test(s);
    })
  );

  const hasDiabetes = Boolean(
    clientConditions.some(c => {
      const s = typeof c === 'string' ? c : (c?.conditionCode || c?.name || c?.area || '');
      return /diabetes|سكري|مقاومة.*أنسولين|insulin/i.test(s);
    })
  );

  const bannedExercisesList = ['LEG_PRESS_MACHINE', 'INCLINE_LEG_PRESS', 'DECLINE_CRUNCH', 'DECLINE_BENCH_PRESS', 'INVERTED_BODYWEIGHT_ROW'];

  // Check active session for violations
  const sessionBannedExercises = (activeSession?.exercises || []).filter(e => bannedExercisesList.includes(String(e.code || '')));
  const sessionLowRirExercises = (activeSession?.exercises || []).filter(e => {
    const r = e.rir ?? 1;
    return Number(r) < 2;
  });
  const hasHypertensionViolation = hasHypertension && (sessionBannedExercises.length > 0 || sessionLowRirExercises.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} dir="rtl">
      
      {/* Days Selector & Clean Header */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          
          {/* Days Tabs */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {currentSessions.map((sess, sIdx) => {
              const isCurrent = activeSessionIdx === sIdx;
              return (
                <button
                  key={sess?.id || sIdx}
                  type="button"
                  onClick={() => setActiveSessionIdx(sIdx)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: isCurrent ? '1px solid #0F172A' : '1px solid #CBD5E1',
                    background: isCurrent ? '#0F172A' : '#FFFFFF',
                    color: isCurrent ? '#FFFFFF' : '#334155',
                    fontSize: '12px',
                    fontWeight: isCurrent ? 800 : 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{sess.name}</span>
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>({sess.exercises?.length || 0})</span>
                </button>
              );
            })}

            {/* Duplicate Workout Day Button */}
            {handleDuplicateSession && currentSessions.length > 0 && (
              <button
                type="button"
                onClick={() => handleDuplicateSession(activeSessionIdx)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px dashed #CBD5E1',
                  background: '#F8FAFC',
                  color: '#475569',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
                title="تكرار ونسخ تمارين اليوم التدريبي الحالي بالكامل"
              >
                <Copy size={12} />
                <span>نسخ هذا اليوم</span>
              </button>
            )}
          </div>

          {/* Target Muscle Summary */}
          {activeSession?.target_muscles && !/عضلات مستهدفة متوازنة|متوازنة/i.test(activeSession.target_muscles) && (
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              العضلات المستهدفة: <strong style={{ color: '#0F172A' }}>{activeSession.target_muscles}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Training-Nutrition Dynamic Coupling & Volume Landmarks Bar */}
      {activeSessionDemand && (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: '6px',
                background: activeSessionDemand.demand_level === 'HIGH_GLYCOLYTIC' ? '#FEF2F2' : activeSessionDemand.demand_level === 'LOW_GLYCOLYTIC' ? '#F0FDF4' : '#EFF6FF',
                color: activeSessionDemand.demand_level === 'HIGH_GLYCOLYTIC' ? '#DC2626' : activeSessionDemand.demand_level === 'LOW_GLYCOLYTIC' ? '#166534' : '#2563EB',
                border: activeSessionDemand.demand_level === 'HIGH_GLYCOLYTIC' ? '1px solid #FECACA' : activeSessionDemand.demand_level === 'LOW_GLYCOLYTIC' ? '1px solid #BBF7D0' : '1px solid #BFDBFE'
              }}>
                {activeSessionDemand.demand_label_ar}
              </span>
              <span style={{ fontSize: '11px', color: '#475569' }}>
                مجموع الجولات: <strong>{activeSessionDemand.total_sets} جولة</strong> ({activeSessionDemand.heavy_compounds_count} حركات مركبة) — مدة الجلسة المقدرة: ~{activeSessionDemand.estimated_duration_min} دقيقة
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <span style={{ color: '#64748B' }}>الاقتران الغذائي:</span>
              <span style={{ fontWeight: 700, color: '#0F172A', background: '#F8FAFC', padding: '2px 8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                حصة كارب قبل/بعد التمرين: {Math.round((activeSessionDemand.peri_workout_carb_ratio || 0.55) * 100)}%
              </span>
            </div>
          </div>

          {/* Muscle Volume Landmarks Executive Bar */}
          {weeklyVolumeAudit?.analysis && (() => {
            const activeMuscles = Object.entries(weeklyVolumeAudit.analysis).filter(([_, data]) => data.weekly_sets > 0);
            const flaggedMuscles = activeMuscles.filter(([_, data]) => data.status === 'BELOW_MEV' || data.status === 'EXCEEDS_MRV');
            
            return (
              <div style={{ paddingTop: '6px', borderTop: '1px dashed #E2E8F0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: '#0F172A', fontWeight: 800 }}>معالم الحجم الأسبوعي:</span>
                    {flaggedMuscles.length === 0 ? (
                      <span style={{ fontSize: '10.5px', color: '#166534', background: '#DCFCE7', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        كافة المجموعات العضلية ({activeMuscles.length}) متوازنة فسيولوجياً ضمن نطاق الاستجابة البنائية (MAV)
                      </span>
                    ) : (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {flaggedMuscles.map(([key, data]) => (
                          <span
                            key={key}
                            style={{
                              fontSize: '10px',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              background: data.status === 'EXCEEDS_MRV' ? '#FEE2E2' : '#FEF3C7',
                              color: data.status === 'EXCEEDS_MRV' ? '#B91C1C' : '#B45309',
                              border: data.status === 'EXCEEDS_MRV' ? '1px solid #FCA5A5' : '1px solid #FDE68A',
                              fontWeight: 700
                            }}
                          >
                            تنبيه: {data.muscle_name_ar} {data.weekly_sets} جولة ({data.status_label_ar})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {activeMuscles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAllVolumeLandmarks(prev => !prev)}
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        fontSize: '10.5px',
                        color: '#475569',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {showAllVolumeLandmarks ? 'إخفاء التفاصيل' : `عرض تفاصيل العضلات (${activeMuscles.length})`}
                    </button>
                  )}
                </div>

                {showAllVolumeLandmarks && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '4px' }}>
                    {activeMuscles.map(([key, data]) => {
                      const isBelowMev = data.status === 'BELOW_MEV';
                      const isExceedsMrv = data.status === 'EXCEEDS_MRV';
                      return (
                        <span
                          key={key}
                          style={{
                            fontSize: '10.5px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: isExceedsMrv ? '#FEE2E2' : isBelowMev ? '#FEF3C7' : '#F1F5F9',
                            color: isExceedsMrv ? '#B91C1C' : isBelowMev ? '#B45309' : '#334155',
                            border: isExceedsMrv ? '1px solid #FCA5A5' : isBelowMev ? '1px solid #FDE68A' : '1px solid #E2E8F0',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title={data.status_label_ar}
                        >
                          <strong>{data.muscle_name_ar}:</strong>
                          <span>{data.weekly_sets} جولة</span>
                          <span style={{ fontSize: '9px', opacity: 0.8 }}>({data.mav_range})</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Exercise Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {activeSession?.exercises?.map((ex, eIdx) => {
          const isContraindicated = hasHypertension && bannedExercisesList.includes(String(ex.code || ''));
          const isLowRir = hasHypertension && Number(ex.rir ?? 1) < 2;

          return (
            <div
              key={ex.id || eIdx}
              style={{
                background: isContraindicated ? '#FEF2F2' : '#FFFFFF',
                border: isContraindicated ? '1.5px solid #F87171' : '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: isContraindicated ? '0 3px 10px rgba(239, 68, 68, 0.1)' : '0 1px 3px rgba(15, 23, 42, 0.02)'
              }}
            >
              {/* Title & Info & Visuals */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: isContraindicated ? '#DC2626' : '#0F172A',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  flexShrink: 0
                }}>
                  {eIdx + 1}
                </span>

                {/* Visual Thumbnails (Stretch & Contraction) & Video Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <div 
                    style={{ 
                      width: '42px', 
                      height: '42px', 
                      borderRadius: '6px', 
                      overflow: 'hidden', 
                      background: '#F1F5F9', 
                      border: '1px solid #E2E8F0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                    title="وضعية البداية والاستطالة"
                  >
                    <img 
                      src={ex.image_stretch || `/exercises/${ex.code}/0.jpg`} 
                      alt="" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      loading="lazy"
                    />
                    <span style={{ position: 'absolute', bottom: '1px', right: '2px', fontSize: '8px', fontWeight: 800, color: '#64748B', background: 'rgba(255,255,255,0.85)', padding: '0 4px', borderRadius: '6px' }}>1</span>
                  </div>
                  <div 
                    style={{ 
                      width: '42px', 
                      height: '42px', 
                      borderRadius: '6px', 
                      overflow: 'hidden', 
                      background: '#F1F5F9', 
                      border: '1px solid #E2E8F0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                    title="وضعية الانقباض العضلي"
                  >
                    <img 
                      src={ex.image_contraction || `/exercises/${ex.code}/1.jpg`} 
                      alt="" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      loading="lazy"
                    />
                    <span style={{ position: 'absolute', bottom: '1px', right: '2px', fontSize: '8px', fontWeight: 800, color: '#64748B', background: 'rgba(255,255,255,0.85)', padding: '0 4px', borderRadius: '6px' }}>2</span>
                  </div>
                  
                  {/* Video Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setActiveVideoModalEx(ex)}
                    title="مشاهدة الفيديو التوضيحي للأداء"
                    style={{
                      width: '32px',
                      height: '42px',
                      borderRadius: '6px',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      color: '#2563EB',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Play size={14} />
                  </button>
                </div>

                <div style={{ minWidth: 0 }}>
                  {/* Primary English Exercise Name (Large & Prominent) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 800,
                        color: isContraindicated ? '#991B1B' : '#0F172A',
                        fontFamily: "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                        letterSpacing: '0.2px',
                        direction: 'ltr',
                        display: 'inline-block',
                      }}
                    >
                      {getExerciseDisplayNames(ex).nameEn}
                    </strong>

                    {ex.equipment && (
                      <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '6px', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', fontWeight: 600 }}>
                        {ex.equipment}
                      </span>
                    )}

                    {isContraindicated && (
                      <span style={{ fontSize: '9.5px', fontWeight: 800, background: '#DC2626', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px' }}>
                        محظور لمرضى الضغط (فالسافا)
                      </span>
                    )}
                  </div>

                  {/* Secondary Arabic Exercise Name (Smaller, Muted & Secondary) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isContraindicated ? '#B91C1C' : '#64748B',
                        fontFamily: 'Cairo, sans-serif',
                      }}
                    >
                      {getExerciseDisplayNames(ex).nameAr}
                    </span>

                    {ex.code && ex.code !== getExerciseDisplayNames(ex).nameEn && (
                      <span style={{ fontSize: '8.5px', color: '#94A3B8', fontFamily: 'monospace' }}>
                        ({ex.code})
                      </span>
                    )}
                  </div>

                  {ex.safetyNote && (
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      {ex.safetyNote}
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Parameters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* Sets */}
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#F8FAFC', padding: '0 6px', height: '30px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px', fontWeight: 700 }}>جولات:</span>
                  <button type="button" onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'sets', Math.max(1, (ex.sets || 3) - 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 4px', fontSize: '13px' }}>-</button>
                  <strong style={{ fontSize: '13px', minWidth: '18px', textAlign: 'center', margin: '0 2px', color: '#0F172A' }}>{ex.sets}</strong>
                  <button type="button" onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'sets', (ex.sets || 3) + 1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 4px', fontSize: '13px' }}>+</button>
                </div>

                {/* Reps */}
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#F8FAFC', padding: '0 8px', height: '30px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px', fontWeight: 700 }}>تكرار:</span>
                  <input
                    type="text"
                    value={ex.reps}
                    onChange={(e) => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'reps', e.target.value)}
                    style={{ width: '70px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 800, fontSize: '12px', outline: 'none', color: '#0F172A', direction: 'ltr' }}
                  />
                </div>

                {/* RIR Stepper Control (No Sharp Native Dropdowns) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: isLowRir ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                  borderRadius: '8px',
                  background: isLowRir ? '#FEF2F2' : '#F8FAFC',
                  padding: '0 6px',
                  height: '30px'
                }}>
                  <span style={{ fontSize: '11px', color: isLowRir ? '#DC2626' : '#64748B', marginLeft: '6px', fontWeight: 700 }}>الشدة:</span>
                  <button 
                    type="button" 
                    onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'rir', Math.max(0, (ex.rir ?? 1) - 1))} 
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 4px', fontSize: '13px', color: isLowRir ? '#DC2626' : '#0F172A' }}
                  >
                    -
                  </button>
                  <strong style={{ fontSize: '11.5px', minWidth: '38px', textAlign: 'center', margin: '0 2px', color: isLowRir ? '#DC2626' : '#0F172A' }}>
                    RIR {ex.rir ?? 1}
                  </strong>
                  <button 
                    type="button" 
                    onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'rir', Math.min(3, (ex.rir ?? 1) + 1))} 
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 4px', fontSize: '13px', color: isLowRir ? '#DC2626' : '#0F172A' }}
                  >
                    +
                  </button>
                  {isLowRir && (
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#DC2626', marginRight: '4px' }}>
                      (الحد: 2)
                    </span>
                  )}
                </div>

                {/* Rest Stepper Control (Steps by 15s - No Sharp Native Dropdowns) */}
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', background: '#F8FAFC', padding: '0 6px', height: '30px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px', fontWeight: 700 }}>راحة:</span>
                  <button 
                    type="button" 
                    onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'restSec', Math.max(30, (ex.restSec || 75) - 15))} 
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 4px', fontSize: '13px', color: '#0F172A' }}
                  >
                    -
                  </button>
                  <strong style={{ fontSize: '11.5px', minWidth: '32px', textAlign: 'center', margin: '0 2px', color: '#0F172A' }}>
                    {ex.restSec || 75}s
                  </strong>
                  <button 
                    type="button" 
                    onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'restSec', Math.min(180, (ex.restSec || 75) + 15))} 
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 4px', fontSize: '13px', color: '#0F172A' }}
                  >
                    +
                  </button>
                </div>

                {/* Move Up / Move Down Order Controls */}
                {handleMoveExercise && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#F1F5F9', padding: '2px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <button
                      type="button"
                      onClick={() => handleMoveExercise(activeSessionIdx, eIdx, 'UP')}
                      disabled={eIdx === 0}
                      title="تقديم التمرين للأعلى"
                      style={{
                        height: '26px',
                        width: '26px',
                        borderRadius: '6px',
                        border: 'none',
                        background: eIdx === 0 ? 'transparent' : '#FFFFFF',
                        color: eIdx === 0 ? '#CBD5E1' : '#0F172A',
                        cursor: eIdx === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: eIdx === 0 ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.05)'
                      }}
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveExercise(activeSessionIdx, eIdx, 'DOWN')}
                      disabled={eIdx === (activeSession?.exercises?.length || 0) - 1}
                      title="تأخير التمرين للأسفل"
                      style={{
                        height: '26px',
                        width: '26px',
                        borderRadius: '6px',
                        border: 'none',
                        background: eIdx === (activeSession?.exercises?.length || 0) - 1 ? 'transparent' : '#FFFFFF',
                        color: eIdx === (activeSession?.exercises?.length || 0) - 1 ? '#CBD5E1' : '#0F172A',
                        cursor: eIdx === (activeSession?.exercises?.length || 0) - 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: eIdx === (activeSession?.exercises?.length || 0) - 1 ? 'none' : '0 1px 2px rgba(15, 23, 42, 0.05)'
                      }}
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>
                )}

                {/* Smart Swap Button */}
                <button
                  type="button"
                  onClick={() => setSwapExModal({ open: true, sessionIdx: activeSessionIdx, exIdx: eIdx, currentEx: ex })}
                  style={{ height: '30px', padding: '0 10px', borderRadius: '8px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}
                  title="تبديل التمرين الذكي بنفس الزاوية والأمان"
                >
                  <ArrowRightLeft size={12} color="#2563EB" />
                  <span>بديل</span>
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDeleteExercise(activeSessionIdx, eIdx)}
                  style={{ height: '30px', width: '30px', borderRadius: '8px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="حذف التمرين"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Post-Workout Stretches Bar */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <HeartPulse size={14} />
            <span>إطالات الاستشفاء:</span>
          </span>
          
          {(!activeSession?.post_workout_stretches || activeSession.post_workout_stretches.length === 0) ? (
            <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>إطالات عامة للعضلات المستهدفة</span>
          ) : (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {activeSession.post_workout_stretches.map((m, mIdx) => (
                <span key={mIdx} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '3px 9px', borderRadius: '6px', fontSize: '11px', color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <span>{m.name || m.name_ar}</span>
                  <button type="button" onClick={() => handleRemoveMobilityFromSession(activeSessionIdx, mIdx, 'STRETCH')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#DC2626' }}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobilityModal({ open: true, type: 'STRETCH', sessionIdx: activeSessionIdx })}
          style={{ padding: '4px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', borderRadius: '7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
        >
          + إضافة إطالة
        </button>
      </div>

      {/* Centered Add Exercise Button */}
      <div style={{ textAlign: 'center', marginTop: '6px' }}>
        <button
          type="button"
          onClick={() => setAddExModal({ open: true, sessionIdx: activeSessionIdx })}
          style={{
            height: '36px',
            padding: '0 18px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            color: '#0F172A',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
          }}
        >
          <Plus size={14} />
          <span>إضافة تمرين جديد لـ ({activeSession?.name})</span>
        </button>
      </div>

    </div>
  );
}
