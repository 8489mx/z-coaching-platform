import React from 'react';
import {
  Play,
  ArrowRightLeft,
  Trash2,
  HeartPulse,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Copy
} from 'lucide-react';
import { getExerciseDisplayNames } from '../../../utils/exerciseTranslator';
import ProgressionTimeline from './ProgressionTimeline';

export function CoachTrainingTab({
  program,
  _selectedWeek,
  _setSelectedWeek,
  _currentWeekData,
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
  handleDeleteSession,
  activeSessionDemand,
  weeklyVolumeAudit,
  clientProgression = null
}) {
  const [showAllVolumeLandmarks, setShowAllVolumeLandmarks] = React.useState(false);

  const _formatSplitName = (split) => {
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

  const _hasDiabetes = Boolean(
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
  const _hasHypertensionViolation = hasHypertension && (sessionBannedExercises.length > 0 || sessionLowRirExercises.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} dir="rtl">
      
      {/* Days Selector & Clean Header */}
      <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '14px', padding: '14px 18px', boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          
          {/* Days Tabs - Hostinger Design System */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {currentSessions.map((sess, sIdx) => {
              const isCurrent = activeSessionIdx === sIdx;
              return (
                <button
                  key={sess?.id || sIdx}
                  type="button"
                  onClick={() => setActiveSessionIdx(sIdx)}
                  style={{
                    height: '36px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    border: isCurrent ? '1px solid #673DE6' : '1px solid #D0D5DD',
                    background: isCurrent ? '#673DE6' : '#FFFFFF',
                    color: isCurrent ? '#FFFFFF' : '#344054',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: isCurrent ? '0 1px 3px rgba(103, 61, 230, 0.25)' : '0 1px 2px rgba(16, 24, 40, 0.03)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.background = '#FFFFFF';
                  }}
                >
                  <span>{sess.name}</span>
                  <span style={{ fontSize: '11px', opacity: 0.85 }}>({sess.exercises?.length || 0})</span>
                </button>
              );
            })}

            {/* Duplicate Workout Day Button */}
            {handleDuplicateSession && currentSessions.length > 0 && (
              <button
                type="button"
                onClick={() => handleDuplicateSession(activeSessionIdx)}
                style={{
                  height: '36px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1px dashed #D0D5DD',
                  background: '#FFFFFF',
                  color: '#475467',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                title="تكرار ونسخ تمارين اليوم التدريبي الحالي بالكامل"
              >
                <Copy size={13} color="#667085" />
                <span>نسخ هذا اليوم</span>
              </button>
            )}

            {/* Delete Workout Day Button */}
            {handleDeleteSession && currentSessions.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteSession(activeSessionIdx)}
                style={{
                  height: '36px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1px solid #FECDCA',
                  background: '#FEF3F2',
                  color: '#D92D20',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#FEE4E2')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FEF3F2')}
                title={`حذف اليوم التدريبي الحالي (${activeSession?.name || ''}) بالكامل من الخطة`}
              >
                <Trash2 size={13} color="#D92D20" />
                <span>حذف هذا اليوم</span>
              </button>
            )}
          </div>

          {/* Target Muscle Summary */}
          {activeSession?.target_muscles && !/عضلات مستهدفة متوازنة|متوازنة/i.test(activeSession.target_muscles) && (
            <div style={{ fontSize: '12px', color: '#475467' }}>
              العضلات المستهدفة: <strong style={{ color: '#101828', fontWeight: 600 }}>{activeSession.target_muscles}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Training-Nutrition Dynamic Coupling & Volume Landmarks Bar */}
      {activeSessionDemand && (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #EAECF0',
          borderRadius: '16px',
          padding: '10px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 9px',
                borderRadius: '6px',
                background: activeSessionDemand.demand_level === 'HIGH_GLYCOLYTIC' ? '#FEF3F2' : activeSessionDemand.demand_level === 'LOW_GLYCOLYTIC' ? '#ECFDF3' : '#EFF8FF',
                color: activeSessionDemand.demand_level === 'HIGH_GLYCOLYTIC' ? '#B42318' : activeSessionDemand.demand_level === 'LOW_GLYCOLYTIC' ? '#027A48' : '#175CD3',
                border: activeSessionDemand.demand_level === 'HIGH_GLYCOLYTIC' ? '1px solid #FECDCA' : activeSessionDemand.demand_level === 'LOW_GLYCOLYTIC' ? '1px solid #A6F4C7' : '1px solid #B2DDFF'
              }}>
                {activeSessionDemand.demand_label_ar}
              </span>
              <span style={{ fontSize: '11.5px', color: '#475467' }}>
                مجموع الجولات: <strong style={{ color: '#101828' }}>{activeSessionDemand.total_sets} جولة</strong> ({activeSessionDemand.heavy_compounds_count} حركات مركبة) — مدة الجلسة المقدرة: ~{activeSessionDemand.estimated_duration_min} دقيقة
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#475467', background: '#F9FAFB', padding: '2px 9px', borderRadius: '6px', border: '1px solid #EAECF0' }}>
                حصة كارب التمرين: <strong style={{ color: '#101828' }}>{Math.round((activeSessionDemand.peri_workout_carb_ratio || 0.55) * 100)}%</strong>
              </span>

              {weeklyVolumeAudit?.analysis && (() => {
                const activeMuscles = Object.entries(weeklyVolumeAudit.analysis).filter(([_, data]) => data.weekly_sets > 0);
                const flaggedMuscles = activeMuscles.filter(([_, data]) => data.status === 'BELOW_MEV' || data.status === 'EXCEEDS_MRV');
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {flaggedMuscles.length > 0 && (
                      <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#B42318', background: '#FEF3F2', border: '1px solid #FECDCA', padding: '1px 8px', borderRadius: '6px' }}>
                        {flaggedMuscles.length} تنبيه حجم أسبوعي
                      </span>
                    )}
                    {activeMuscles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAllVolumeLandmarks(prev => !prev)}
                        style={{
                          background: showAllVolumeLandmarks ? '#F4F0FD' : '#FFFFFF',
                          border: showAllVolumeLandmarks ? '1px solid #673DE6' : '1px solid #D0D5DD',
                          color: showAllVolumeLandmarks ? '#673DE6' : '#344054',
                          borderRadius: '6px',
                          padding: '2px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        {showAllVolumeLandmarks ? 'إخفاء الحجم الأسبوعي' : `معالم الحجم الأسبوعي (${activeMuscles.length})`}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Muscle Volume Landmarks Executive Details */}
          {weeklyVolumeAudit?.analysis && showAllVolumeLandmarks && (() => {
            const activeMuscles = Object.entries(weeklyVolumeAudit.analysis).filter(([_, data]) => data.weekly_sets > 0);
            return (
              <div style={{ paddingTop: '8px', borderTop: '1px solid #EAECF0', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                {activeMuscles.map(([key, data]) => {
                  const isBelowMev = data.status === 'BELOW_MEV';
                  const isExceedsMrv = data.status === 'EXCEEDS_MRV';
                  return (
                    <span
                      key={key}
                      style={{
                        fontSize: '10.5px',
                        padding: '2px 8px',
                        borderRadius: '8px',
                        background: isExceedsMrv ? '#FEF3F2' : isBelowMev ? '#FFFAEB' : '#F2F4F7',
                        color: isExceedsMrv ? '#B42318' : isBelowMev ? '#B54708' : '#344054',
                        border: isExceedsMrv ? '1px solid #FECDCA' : isBelowMev ? '1px solid #FEDF89' : '1px solid #EAECF0',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title={data.status_label_ar}
                    >
                      <strong>{data.muscle_name_ar}:</strong>
                      <span>{data.weekly_sets} جولة</span>
                      <span style={{ fontSize: '9px', opacity: 0.85 }}>({data.mav_range})</span>
                    </span>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Exercise Cards - Hostinger Design System */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {activeSession?.exercises?.map((ex, eIdx) => {
          const isContraindicated = hasHypertension && bannedExercisesList.includes(String(ex.code || ''));
          const isLowRir = hasHypertension && Number(ex.rir ?? 1) < 2;

          return (
            <div
              key={ex.id || eIdx}
              style={{
                background: isContraindicated ? '#FEF3F2' : '#FFFFFF',
                border: isContraindicated ? '1.5px solid #FECDCA' : '1px solid #EAECF0',
                borderRadius: '16px',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: isContraindicated ? '0 1px 3px rgba(217, 45, 32, 0.1)' : '0 1px 2px rgba(16, 24, 40, 0.03)',
                transition: 'border-color 0.15s ease'
              }}
            >
              {/* Exercise Identity & Consolidated Controls Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'nowrap',
                gap: '10px'
              }}>
                {/* Title & Info & Visuals */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
                  <span style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '9px',
                    background: isContraindicated ? '#FEE4E2' : '#F4F0FD',
                    color: isContraindicated ? '#D92D20' : '#673DE6',
                    border: isContraindicated ? '1px solid #FECDCA' : '1px solid #EDE8FA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {eIdx + 1}
                  </span>

                  {/* Visual Thumbnails & Video Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                    <div 
                      style={{ 
                        width: '54px', 
                        height: '54px', 
                        borderRadius: '10px', 
                        overflow: 'hidden', 
                        background: '#F2F4F7', 
                        border: '1px solid #EAECF0', 
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
                        onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.parentElement) { e.currentTarget.parentElement.style.display = 'none'; } }}
                        loading="lazy"
                      />
                      <span style={{ position: 'absolute', bottom: '2px', right: '2px', fontSize: '8.5px', fontWeight: 700, color: '#475467', background: 'rgba(255,255,255,0.92)', padding: '0 3.5px', borderRadius: '4px' }}>1</span>
                    </div>
                    <div 
                      style={{ 
                        width: '54px', 
                        height: '54px', 
                        borderRadius: '10px', 
                        overflow: 'hidden', 
                        background: '#F2F4F7', 
                        border: '1px solid #EAECF0', 
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
                        onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.parentElement) { e.currentTarget.parentElement.style.display = 'none'; } }}
                        loading="lazy"
                      />
                      <span style={{ position: 'absolute', bottom: '2px', right: '2px', fontSize: '8.5px', fontWeight: 700, color: '#475467', background: 'rgba(255,255,255,0.92)', padding: '0 3.5px', borderRadius: '4px' }}>2</span>
                    </div>
                    
                    {/* Video Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setActiveVideoModalEx(ex)}
                      title="مشاهدة الفيديو التوضيحي للأداء"
                      style={{
                        width: '32px',
                        height: '54px',
                        borderRadius: '10px',
                        background: '#EFF8FF',
                        border: '1px solid #B2DDFF',
                        color: '#175CD3',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Play size={15} fill="#175CD3" />
                    </button>
                  </div>

                  <div style={{ minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
                    {/* Primary English Exercise Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <strong
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: isContraindicated ? '#B42318' : '#101828',
                          fontFamily: "'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                          letterSpacing: '0.2px',
                          direction: 'ltr',
                          display: 'inline-block',
                        }}
                      >
                        {getExerciseDisplayNames(ex).nameEn}
                      </strong>

                      {isContraindicated && (
                        <span style={{ fontSize: '9.5px', fontWeight: 600, background: '#D92D20', color: '#FFFFFF', padding: '1px 7px', borderRadius: '6px' }}>
                          محظور لمرضى الضغط
                        </span>
                      )}
                    </div>

                    {/* Secondary Arabic Exercise Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 500,
                          color: isContraindicated ? '#B42318' : '#475467',
                          fontFamily: 'Cairo, sans-serif',
                        }}
                      >
                        {getExerciseDisplayNames(ex).nameAr}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Consolidated Control Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'nowrap', flexShrink: 0,
                  background: '#F8FAFC',
                  border: '1px solid #EAECF0',
                  borderRadius: '12px',
                  padding: '4px 6px'
                }}>
                  {/* Sets Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D0D5DD', borderRadius: '8px', background: '#FFFFFF', padding: '0 6px', height: '30px' }}>
                    <span style={{ fontSize: '10.5px', color: '#475467', marginLeft: '4px', fontWeight: 600 }}>جولات:</span>
                    <button type="button" onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'sets', Math.max(1, (ex.sets || 3) - 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, padding: '0 3px', fontSize: '13px', color: '#344054' }}>-</button>
                    <strong style={{ fontSize: '12px', minWidth: '16px', textAlign: 'center', margin: '0 1px', color: '#101828' }}>{ex.sets}</strong>
                    <button type="button" onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'sets', (ex.sets || 3) + 1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, padding: '0 3px', fontSize: '13px', color: '#344054' }}>+</button>
                  </div>

                  {/* Reps */}
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D0D5DD', borderRadius: '8px', background: '#FFFFFF', padding: '0 8px', height: '30px' }}>
                    <span style={{ fontSize: '10.5px', color: '#475467', marginLeft: '4px', fontWeight: 600 }}>تكرار:</span>
                    <input
                      type="text"
                      value={ex.reps}
                      onChange={(e) => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'reps', e.target.value)}
                      className="bare-input inline-pill-input clean-inline-input"
                      style={{ width: '56px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 700, fontSize: '12px', outline: 'none', color: '#101828', direction: 'ltr', minHeight: 0, height: '22px', padding: 0 }}
                    />
                  </div>

                  {/* RIR Stepper Control */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: isLowRir ? '1.5px solid #FDA29B' : '1px solid #D0D5DD',
                    borderRadius: '8px',
                    background: isLowRir ? '#FEF3F2' : '#FFFFFF',
                    padding: '0 6px',
                    height: '30px'
                  }}>
                    <span style={{ fontSize: '10.5px', color: isLowRir ? '#B42318' : '#475467', marginLeft: '4px', fontWeight: 600 }}>الشدة:</span>
                    <button 
                      type="button" 
                      onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'rir', Math.max(0, (ex.rir ?? 1) - 1))} 
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, padding: '0 3px', fontSize: '13px', color: isLowRir ? '#B42318' : '#344054' }}
                    >
                      -
                    </button>
                    <strong style={{ fontSize: '11px', minWidth: '34px', textAlign: 'center', margin: '0 1px', color: isLowRir ? '#B42318' : '#101828' }}>
                      RIR {ex.rir ?? 1}
                    </strong>
                    <button 
                      type="button" 
                      onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'rir', Math.min(3, (ex.rir ?? 1) + 1))} 
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, padding: '0 3px', fontSize: '13px', color: isLowRir ? '#B42318' : '#344054' }}
                    >
                      +
                    </button>
                    {isLowRir && (
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#B42318', marginRight: '3px' }}>
                        (الحد: 2)
                      </span>
                    )}
                  </div>

                  {/* Rest Stepper Control */}
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D0D5DD', borderRadius: '8px', background: '#FFFFFF', padding: '0 6px', height: '30px' }}>
                    <span style={{ fontSize: '10.5px', color: '#475467', marginLeft: '4px', fontWeight: 600 }}>راحة:</span>
                    <button 
                      type="button" 
                      onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'restSec', Math.max(30, (ex.restSec || 75) - 15))} 
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, padding: '0 3px', fontSize: '13px', color: '#344054' }}
                    >
                      -
                    </button>
                    <strong style={{ fontSize: '11px', minWidth: '28px', textAlign: 'center', margin: '0 1px', color: '#101828' }}>
                      {ex.restSec || 75}s
                    </strong>
                    <button 
                      type="button" 
                      onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'restSec', Math.min(180, (ex.restSec || 75) + 15))} 
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700, padding: '0 3px', fontSize: '13px', color: '#344054' }}
                    >
                      +
                    </button>
                  </div>

                  {/* Divider */}
                  <div style={{ width: '1px', height: '20px', background: '#E2E8F0', margin: '0 2px' }} />

                  {/* Move Up / Move Down Order Controls */}
                  {handleMoveExercise && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#FFFFFF', padding: '1px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
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
                          color: eIdx === 0 ? '#D0D5DD' : '#344054',
                          cursor: eIdx === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
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
                          color: eIdx === (activeSession?.exercises?.length || 0) - 1 ? '#D0D5DD' : '#344054',
                          cursor: eIdx === (activeSession?.exercises?.length || 0) - 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
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
                    style={{
                      height: '30px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      background: '#FFFFFF',
                      border: '1px solid #D0D5DD',
                      color: '#344054',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
                      transition: 'all 0.12s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                    title="تبديل التمرين الذكي بنفس الزاوية والأمان"
                  >
                    <ArrowRightLeft size={12} color="#673DE6" />
                    <span>بديل</span>
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteExercise(activeSessionIdx, eIdx)}
                    style={{
                      height: '30px',
                      width: '30px',
                      borderRadius: '8px',
                      background: '#FFFFFF',
                      border: '1px solid #D0D5DD',
                      color: '#B42318',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
                      transition: 'all 0.12s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#FEF3F2';
                      e.currentTarget.style.borderColor = '#FECDCA';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FFFFFF';
                      e.currentTarget.style.borderColor = '#D0D5DD';
                    }}
                    title="حذف التمرين"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Coach Cue / تركاية الكوتش */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#F9FAFB',
                border: '1px solid #EAECF0',
                borderRadius: '10px',
                padding: '6px 12px',
                transition: 'border-color 0.15s ease'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#673DE6', whiteSpace: 'nowrap' }}>
                  تركاية الكوتش:
                </span>
                <input
                  type="text"
                  value={ex.safetyNote || ex.cues_ar || ''}
                  onChange={(e) => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'safetyNote', e.target.value)}
                  placeholder="أضف تركاية أو توجيه تكنيك مخصص للمتدرب في هذا التمرين (اختياري)..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '11.5px',
                    color: '#344054',
                    fontWeight: 500,
                    padding: 0
                  }}
                />
                {(ex.safetyNote || ex.cues_ar) && (
                  <button
                    type="button"
                    onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'safetyNote', '')}
                    title="مسح التركاية"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: '#98A2B3',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#B42318')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#98A2B3')}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <ProgressionTimeline entry={clientProgression?.exercises?.[ex.code || ex.id]} />
            </div>
          );
        })}
      </div>

      {/* Centered Add Exercise Button - directly below exercise cards */}
      <div style={{ textAlign: 'center', marginTop: '4px', marginBottom: '4px' }}>
        <button
          type="button"
          onClick={() => setAddExModal({ open: true, sessionIdx: activeSessionIdx })}
          style={{
            height: '38px',
            padding: '0 20px',
            borderRadius: '8px',
            border: '1px solid #673DE6',
            background: '#F4F0FD',
            color: '#673DE6',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 3px rgba(103, 61, 230, 0.15)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#EDE8FA')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#F4F0FD')}
        >
          <Plus size={15} />
          <span>إضافة تمرين جديد لـ ({activeSession?.name})</span>
        </button>
      </div>

      {/* Post-Workout Stretches Bar - at the very bottom */}
      <div style={{ background: '#FFFFFF', border: '1px solid #EAECF0', borderRadius: '16px', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#101828', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <HeartPulse size={15} color="#673DE6" />
            <span>إطالات الاستشفاء:</span>
          </span>
          
          {(!activeSession?.post_workout_stretches || activeSession.post_workout_stretches.length === 0) ? (
            <span style={{ fontSize: '12px', color: '#667085' }}>إطالات عامة للعضلات المستهدفة</span>
          ) : (
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {activeSession.post_workout_stretches.map((m, mIdx) => (
                <span key={mIdx} style={{ background: '#F9FAFB', border: '1px solid #EAECF0', padding: '3px 10px', borderRadius: '6px', fontSize: '11.5px', color: '#101828', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
                  <span>{m.name || m.name_ar}</span>
                  <button type="button" onClick={() => handleRemoveMobilityFromSession(activeSessionIdx, mIdx, 'STRETCH')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#B42318' }}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobilityModal({ open: true, type: 'STRETCH', sessionIdx: activeSessionIdx })}
          style={{
            height: '32px',
            padding: '0 14px',
            background: '#FFFFFF',
            border: '1px solid #D0D5DD',
            color: '#344054',
            borderRadius: '8px',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.03)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
        >
          + إضافة إطالة
        </button>
      </div>

    </div>
  );
}
