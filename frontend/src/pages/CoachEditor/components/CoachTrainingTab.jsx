import React from 'react';
import { 
  Zap, 
  RotateCw, 
  Play, 
  ArrowRightLeft, 
  Trash2, 
  HeartPulse, 
  Plus, 
  X,
  ShieldAlert
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
  setAddExModal
}) {
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
      
      {/* Hypertension Clinical Warning Banner */}
      {hasHypertension && (
        <div style={{
          background: hasHypertensionViolation ? '#FEF2F2' : '#F0FDF4',
          border: hasHypertensionViolation ? '1.5px solid #F87171' : '1px solid #BBF7D0',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          boxShadow: hasHypertensionViolation ? '0 3px 10px rgba(239, 68, 68, 0.12)' : 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: hasHypertensionViolation ? '#FEE2E2' : '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: hasHypertensionViolation ? '#DC2626' : '#166534',
              flexShrink: 0
            }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: hasHypertensionViolation ? '#991B1B' : '#166534' }}>
                {hasHypertensionViolation
                  ? 'تحذير سريري: تم رصد تمارين مضادة للاستطباب أو شدة دون الحد الآمن لمرضى الضغط'
                  : 'حماية سريرية نشطة لمرضى ارتفاع ضغط الدم (ACSM/AHA RIR >= 2)'}
              </div>
              <div style={{ fontSize: '11px', color: hasHypertensionViolation ? '#B91C1C' : '#15803D', marginTop: '2px' }}>
                {hasHypertensionViolation
                  ? 'يمنع حبس النفس (Valsalva) وتمارين الانقلاب أو مكابس الأرجل الثقيلة لمنع الارتفاع الحاد في الضغط الشرياني.'
                  : 'تم تفعيل معايير الأمان الميكانيكي ومنع إجهاد الصمامات القلبية والضغط الشرياني.'}
              </div>
            </div>
          </div>
          {hasHypertensionViolation && (
            <span style={{ fontSize: '10.5px', fontWeight: 800, background: '#DC2626', color: '#FFFFFF', padding: '4px 10px', borderRadius: '7px', whiteSpace: 'nowrap' }}>
              مطلوب مراجعة المدرب
            </span>
          )}
        </div>
      )}

      {/* Diabetes ADA Safety Protocol Card */}
      {hasDiabetes && (
        <div style={{
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '10px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: '#1E40AF'
        }}>
          <ShieldAlert size={15} style={{ flexShrink: 0 }} />
          <span><strong>بروتوكول ADA لمرضى السكري:</strong> يجب توفير 15-20 جم كربوهيدرات سريعة الامتصاص أثناء التمارين التي تتجاوز 45 دقيقة لإنقاذ هبوط السكر المفاجئ.</span>
        </div>
      )}

      {/* Engine Clinical & Biomechanical Reasoning Card */}
      {program.training?.reasoning && (
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0 }}>
              <Zap size={14} />
            </div>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>تحليل المحرك الفسيولوجي والميكانيكا الحيوية</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                {typeof program.training.reasoning === 'string' ? program.training.reasoning : (program.training.reasoning?.rationale || 'تقسيم تدريبي مخصص مع حماية المفاصل وعزل الإصابات وتحقيق أعلى تحفيز عضلي.')}
              </div>
            </div>
          </div>
          {program.training?.target_split && (
            <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', whiteSpace: 'nowrap' }}>
              {program.training.target_split}
            </span>
          )}
        </div>
      )}

      {/* Mesocycle Weeks Bar (5 Weeks Architecture) */}
      {Array.isArray(program.training?.weeks) && program.training.weeks.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>دورة الميزوسايكل الفسيولوجية:</span>
              <span style={{ fontSize: '11px', color: '#64748B' }}>5 أسابيع متدرجة مع كسر الإجهاد المبرمج</span>
            </div>
            {currentWeekData && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <span style={{ fontWeight: 700, color: currentWeekData.phase === 'DELOAD' ? '#16A34A' : '#2563EB', background: currentWeekData.phase === 'DELOAD' ? '#F0FDF4' : '#EFF6FF', padding: '2px 8px', borderRadius: '6px', border: currentWeekData.phase === 'DELOAD' ? '1px solid #BBF7D0' : '1px solid #BFDBFE' }}>
                  {currentWeekData.phase === 'INTRO' && 'الأسبوع 1: مرحلة التعود والتأسيس'}
                  {currentWeekData.phase === 'OVERLOAD' && 'الأسبوع 2: زيادة الأحمال التدريجية'}
                  {currentWeekData.phase === 'PEAK' && 'الأسبوع 3: ذروة الحجم التدريبي'}
                  {currentWeekData.phase === 'OVERREACH' && 'الأسبوع 4: أقصى إجهاد بنائي'}
                  {currentWeekData.phase === 'DELOAD' && 'الأسبوع 5: كسر الإجهاد والاستشفاء (Deload -40% حجم)'}
                  {!['INTRO', 'OVERLOAD', 'PEAK', 'OVERREACH', 'DELOAD'].includes(currentWeekData.phase) && `الأسبوع ${currentWeekData.week_number}: ${currentWeekData.phase || ''}`}
                </span>
                {currentWeekData.target_rir !== undefined && (
                  <span style={{ color: '#475569', fontWeight: 600, background: '#F1F5F9', padding: '2px 7px', borderRadius: '6px' }}>
                    معدل الشدة: RIR {currentWeekData.target_rir}
                  </span>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {program.training.weeks.map((w) => {
              const isSelected = selectedWeek === w.week_number;
              const isDeload = w.phase === 'DELOAD';
              return (
                <button
                  key={w.week_number}
                  type="button"
                  onClick={() => setSelectedWeek(w.week_number)}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: isSelected 
                      ? (isDeload ? '2px solid #16A34A' : '2px solid #0F172A')
                      : (isDeload ? '1px solid #86EFAC' : '1px solid #E2E8F0'),
                    background: isSelected 
                      ? (isDeload ? '#DCFCE7' : '#0F172A') 
                      : (isDeload ? '#F0FDF4' : '#F8FAFC'),
                    color: isSelected 
                      ? (isDeload ? '#166534' : '#FFFFFF') 
                      : (isDeload ? '#15803D' : '#334155'),
                    cursor: 'pointer',
                    textAlign: 'right',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800 }}>الأسبوع {w.week_number}</span>
                    <span style={{ fontSize: '10px', opacity: 0.85 }}>RIR {w.target_rir ?? 2}</span>
                  </div>
                  <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.9 }}>
                    {w.phase === 'INTRO' && 'مرحلة التأسيس'}
                    {w.phase === 'OVERLOAD' && 'زيادة الأحمال'}
                    {w.phase === 'PEAK' && 'ذروة الحجم'}
                    {w.phase === 'OVERREACH' && 'أقصى إجهاد'}
                    {w.phase === 'DELOAD' && 'استشفاء وديلود'}
                  </div>
                </button>
              );
            })}
          </div>

          {currentWeekData?.focus_note && (
            <div style={{ fontSize: '10.5px', color: '#64748B', background: '#F8FAFC', padding: '6px 10px', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
              توجيه الأسبوع: <span style={{ color: '#0F172A', fontWeight: 600 }}>{currentWeekData.focus_note}</span>
            </div>
          )}
        </div>
      )}

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
          </div>

          {/* Target Muscle Summary */}
          {activeSession?.target_muscles && (
            <div style={{ fontSize: '11px', color: '#64748B' }}>
              العضلات المستهدفة: <strong style={{ color: '#0F172A' }}>{activeSession.target_muscles}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Pre-Workout Warmup Bar */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <RotateCw size={12} />
            <span>الإحماء الديناميكي:</span>
          </span>
          
          {(!activeSession?.pre_workout_mobility || activeSession.pre_workout_mobility.length === 0) ? (
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>إحماء عام قياسي للمفاصل</span>
          ) : (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {activeSession.pre_workout_mobility.map((m, mIdx) => (
                <span key={mIdx} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '2px 7px', borderRadius: '6px', fontSize: '10.5px', color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>{m.name || m.name_ar}</span>
                  <button type="button" onClick={() => handleRemoveMobilityFromSession(activeSessionIdx, mIdx, 'WARMUP')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#DC2626' }}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobilityModal({ open: true, type: 'WARMUP', sessionIdx: activeSessionIdx })}
          style={{ padding: '4px 10px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', borderRadius: '7px', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
        >
          + إضافة إحماء
        </button>
      </div>

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

                {/* RIR */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: isLowRir ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
                  borderRadius: '6px',
                  background: isLowRir ? '#FEF2F2' : '#F8FAFC',
                  padding: '0 8px',
                  height: '30px'
                }}>
                  <span style={{ fontSize: '11px', color: isLowRir ? '#DC2626' : '#64748B', marginLeft: '6px', fontWeight: 700 }}>الشدة:</span>
                  <select
                    value={ex.rir ?? 1}
                    onChange={(e) => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'rir', Number(e.target.value))}
                    style={{ border: 'none', background: 'transparent', fontWeight: 800, fontSize: '11.5px', outline: 'none', cursor: 'pointer', color: isLowRir ? '#DC2626' : '#0F172A' }}
                  >
                    <option value="0">RIR 0 (فشل تام)</option>
                    <option value="1">RIR 1 (عدة قبل الفشل)</option>
                    <option value="2">RIR 2 (عدتان قبل الفشل)</option>
                    <option value="3">RIR 3</option>
                  </select>
                  {isLowRir && (
                    <span style={{ fontSize: '9px', fontWeight: 800, color: '#DC2626', marginRight: '4px' }}>
                      (الحد: 2)
                    </span>
                  )}
                </div>

                {/* Rest */}
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#F8FAFC', padding: '0 8px', height: '30px' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px', fontWeight: 700 }}>راحة:</span>
                  <select
                    value={ex.restSec || 75}
                    onChange={(e) => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'restSec', Number(e.target.value))}
                    style={{ border: 'none', background: 'transparent', fontWeight: 800, fontSize: '11.5px', outline: 'none', cursor: 'pointer', color: '#0F172A' }}
                  >
                    <option value="45">45s</option>
                    <option value="60">60s</option>
                    <option value="75">75s</option>
                    <option value="90">90s</option>
                    <option value="120">120s</option>
                  </select>
                </div>

                {/* Smart Swap Button */}
                <button
                  type="button"
                  onClick={() => setSwapExModal({ open: true, sessionIdx: activeSessionIdx, exIdx: eIdx, currentEx: ex })}
                  style={{ height: '30px', padding: '0 8px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}
                  title="تبديل التمرين الذكي بنفس الزاوية والأمان"
                >
                  <ArrowRightLeft size={12} color="#2563EB" />
                  <span>بديل</span>
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDeleteExercise(activeSessionIdx, eIdx)}
                  style={{ height: '30px', width: '30px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
