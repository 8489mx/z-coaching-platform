import React from 'react';
import { 
  Save, 
  Send, 
  Dumbbell, 
  Utensils, 
  FileText, 
  Activity, 
  Loader2, 
  Plus, 
  Trash2, 
  RotateCw, 
  HeartPulse, 
  Printer, 
  X, 
  ArrowRightLeft, 
  Users, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Check, 
  Zap, 
  Target, 
  ShieldAlert, 
  Flame 
} from 'lucide-react';

export default function CoachEditorWorkoutTab(props) {
  const { 
    searchParams, setSearchParams, loading, setLoading, saving, setSaving, publishing, setPublishing, 
    program, setProgram, coachNotes, setCoachNotes, activeSessionIdx, setActiveSessionIdx, 
    activeWorkspaceTab, setActiveWorkspaceTab, notification, setNotification, clientsList, setClientsList, 
    queueFilter, setQueueFilter, queueSearch, setQueueSearch, showQueueSlider, setShowQueueSlider, 
    allExercisesList, setAllExercisesList, cardioSwapModal, setCardioSwapModal, addFoodModal, setAddFoodModal, 
    swapFoodModal, setSwapFoodModal, addExModal, setAddExModal, swapExModal, setSwapExModal, 
    mobilityModal, setMobilityModal, allMobilityList, setAllMobilityList, showReasoning, setShowReasoning, 
    exModalSearch, setExModalSearch, foodModalSearch, setFoodModalSearch, mobilityModalSearch, setMobilityModalSearch, 
    swapFoodSearch, setSwapFoodSearch, swapExSearch, setSwapExSearch, handleSelectClient, handleUpdateFoodAmount, 
    handleDeleteFood, handleAddNewMeal, handleDeleteMeal, handleAddFoodToMeal, handleExecuteFoodSwap, 
    handleExecuteExerciseSwap, handleUpdateExerciseParam, handleDeleteExercise, handleAddExerciseToSession, 
    handleSelectCardioModality, handleAddMobilityToSession, handleRemoveMobilityFromSession, handleSaveDraft, 
    handleApproveAndPublish, FOOD_DATABASE_LIST, CARDIO_MODALITY_OPTIONS 
  } = props;

  const activeSession = program?.training?.sessions?.[activeSessionIdx] || null;

  return (
    <>
      {/* TAB 1: WORKOUT & TRAINING (تصميم فاخر منسق ومريح للعين) */}
      {activeWorkspaceTab === 'TRAINING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Biomechanical Reasoning Insight Card */}
          {program.training?.reasoning && (
            <div style={{ 
              background: '#F8FAFC', 
              border: '1px solid #E2E8F0', 
              borderRadius: '8px', 
              padding: '10px 14px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              gap: '10px', 
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '6px', 
                  background: '#F1F5F9', 
                  border: '1px solid #E2E8F0', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#0F172A', 
                  flexShrink: 0 
                }}>
                  <Zap size={13} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>تحليل وتوجيهات المحرك الفسيولوجي</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '1px' }}>
                    {typeof program.training.reasoning === 'string' ? program.training.reasoning : (program.training.reasoning?.rationale || 'تقسيم تدريبي مخصص مع حماية المفاصل وعزل الإصابات وتحقيق أعلى تحفيز عضلي.')}
                  </div>
                </div>
              </div>
              {program.training?.target_split && (
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', whiteSpace: 'nowrap' }}>
                  {program.training.target_split}
                </span>
              )}
            </div>
          )}

          {/* Days Selector & Clean Header */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              
              {/* Days Tabs */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {program.training?.sessions?.map((sess, sIdx) => {
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
                        gap: '6px',
                        transition: 'all 0.12s ease'
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
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>
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
                    <span key={mIdx} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <span>{m.name || m.name_ar}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveMobilityFromSession(activeSessionIdx, mIdx, 'WARMUP')} 
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8', display: 'flex' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobilityModal({ open: true, type: 'WARMUP', sessionIdx: activeSessionIdx })}
              style={{ padding: '3px 9px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              + إضافة إحماء
            </button>
          </div>

          {/* Exercise Cards (Unified Tabular Precision Alignment) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeSession?.exercises?.map((ex, eIdx) => (
              <div
                key={ex.id || eIdx}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)',
                  transition: 'all 0.12s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
              >
                {/* Right: Number & Exercise Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px', flex: '1 1 auto' }}>
                  <span style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    flexShrink: 0
                  }}>
                    {String(eIdx + 1).padStart(2, '0')}
                  </span>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '13.5px', color: '#0F172A', fontWeight: 800 }}>{ex.name}</strong>
                      {ex.equipment && (
                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', fontWeight: 600 }}>
                          {ex.equipment}
                        </span>
                      )}
                    </div>
                    {ex.safetyNote && (
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ex.safetyNote}
                      </div>
                    )}
                  </div>
                </div>

                {/* Left: Unified Parameters Cluster + Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {/* Unified 4-in-1 Parameters Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    padding: '2px 4px',
                    height: '32px',
                    boxSizing: 'border-box'
                  }}>
                    {/* Sets Stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748B', marginLeft: '4px', fontWeight: 700 }}>جولات:</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'sets', Math.max(1, (ex.sets || 3) - 1))}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 3px', fontSize: '13px', color: '#475569' }}
                      >
                        -
                      </button>
                      <strong style={{ fontSize: '12.5px', minWidth: '16px', textAlign: 'center', margin: '0 2px', color: '#0F172A' }}>{ex.sets}</strong>
                      <button
                        type="button"
                        onClick={() => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'sets', (ex.sets || 3) + 1)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 3px', fontSize: '13px', color: '#475569' }}
                      >
                        +
                      </button>
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '16px', background: '#CBD5E1', margin: '0 4px' }} />

                    {/* Reps */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748B', marginLeft: '4px', fontWeight: 700 }}>تكرار:</span>
                      <input
                        type="text"
                        value={ex.reps}
                        onChange={(e) => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'reps', e.target.value)}
                        style={{ width: '56px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 800, fontSize: '11.5px', outline: 'none', color: '#0F172A', direction: 'ltr', padding: 0 }}
                      />
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '16px', background: '#CBD5E1', margin: '0 4px' }} />

                    {/* RIR */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748B', marginLeft: '4px', fontWeight: 700 }}>الشدة:</span>
                      <select
                        value={ex.rir ?? 1}
                        onChange={(e) => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'rir', Number(e.target.value))}
                        style={{ border: 'none', background: 'transparent', fontWeight: 800, fontSize: '11px', outline: 'none', cursor: 'pointer', color: '#0F172A', padding: '0 2px' }}
                      >
                        <option value="0">RIR 0 (فشل)</option>
                        <option value="1">RIR 1 (عدة قبل الفشل)</option>
                        <option value="2">RIR 2 (عدتان قبل الفشل)</option>
                        <option value="3">RIR 3</option>
                      </select>
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '16px', background: '#CBD5E1', margin: '0 4px' }} />

                    {/* Rest */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                      <span style={{ fontSize: '10.5px', color: '#64748B', marginLeft: '4px', fontWeight: 700 }}>راحة:</span>
                      <select
                        value={ex.restSec || 75}
                        onChange={(e) => handleUpdateExerciseParam(activeSessionIdx, eIdx, 'restSec', Number(e.target.value))}
                        style={{ border: 'none', background: 'transparent', fontWeight: 800, fontSize: '11px', outline: 'none', cursor: 'pointer', color: '#0F172A', padding: '0 2px' }}
                      >
                        <option value="45">45s</option>
                        <option value="60">60s</option>
                        <option value="75">75s</option>
                        <option value="90">90s</option>
                        <option value="120">120s</option>
                      </select>
                    </div>
                  </div>

                  {/* Smart Swap Button */}
                  <button
                    type="button"
                    onClick={() => setSwapExModal({ open: true, sessionIdx: activeSessionIdx, exIdx: eIdx, currentEx: ex })}
                    style={{
                      height: '32px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      color: '#0F172A',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      transition: 'all 0.12s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0F172A'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; }}
                    title="تبديل التمرين الذكي بنفس الزاوية والأمان"
                  >
                    <ArrowRightLeft size={11} color="#0F172A" />
                    <span>بديل</span>
                  </button>

                  {/* Delete Button (Ghost Icon) */}
                  <button
                    type="button"
                    onClick={() => handleDeleteExercise(activeSessionIdx, eIdx)}
                    style={{
                      height: '32px',
                      width: '32px',
                      borderRadius: '6px',
                      background: 'transparent',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.12s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#FEF2F2';
                      e.currentTarget.style.color = '#DC2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#94A3B8';
                    }}
                    title="حذف التمرين"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Post-Workout Stretches Bar */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <HeartPulse size={13} />
                <span>إطالات الاستشفاء:</span>
              </span>
              
              {(!activeSession?.post_workout_stretches || activeSession.post_workout_stretches.length === 0) ? (
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>إطالات عامة للعضلات المستهدفة</span>
              ) : (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {activeSession.post_workout_stretches.map((m, mIdx) => (
                    <span key={mIdx} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#0F172A', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <span>{m.name || m.name_ar}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveMobilityFromSession(activeSessionIdx, mIdx, 'STRETCH')} 
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8', display: 'flex' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
                      >
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
              style={{ padding: '3px 9px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              + إضافة إطالة
            </button>
          </div>

          {/* Centered Add Exercise Button */}
          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => setAddExModal({ open: true, sessionIdx: activeSessionIdx })}
              style={{
                height: '34px',
                padding: '0 20px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                transition: 'all 0.12s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0F172A'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; }}
            >
              <Plus size={14} />
              <span>إضافة تمرين جديد لـ ({activeSession?.name})</span>
            </button>
          </div>

        </div>
      )}
    </>
  );
}
