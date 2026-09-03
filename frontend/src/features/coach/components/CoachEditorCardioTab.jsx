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

export default function CoachEditorCardioTab(props) {
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

  return (
    <>
      {/* 5. TAB 3: CARDIO & HABITS (تصميم فاخر منسق) */}
      {activeWorkspaceTab === 'CARDIO_HABITS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Engine Cardio & Recovery Reasoning Card */}
          {program.cardio?.reasoning && (
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
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>بروتوكول الكارديو والاستشفاء ونمط الحياة</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '1px' }}>
                    {typeof program.cardio.reasoning === 'string' ? program.cardio.reasoning : (program.cardio.reasoning?.rationale || 'بروتوكول كارديو Zone 2 لحرق الدهون وتحسين صحة القلب بدون إجهاد للمفاصل.')}
                  </div>
                </div>
              </div>
              {program.cardio?.target_heart_rate_zone && (
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', whiteSpace: 'nowrap' }}>
                  {program.cardio.target_heart_rate_zone}
                </span>
              )}
            </div>
          )}

          {/* Cardio Modality Card */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '13px', color: '#0F172A' }}>نظام وجهاز الكارديو:</strong>
              <button
                type="button"
                onClick={() => setCardioSwapModal(true)}
                style={{ padding: '4px 10px', borderRadius: '5px', background: '#0F172A', color: '#FFFFFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                تبديل الجهاز / النمط
              </button>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px', fontSize: '11.5px', color: '#334155' }}>
              <strong style={{ color: '#0F172A', display: 'block', marginBottom: '2px' }}>{program.cardio?.modality}</strong>
              <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                {program.cardio?.weekly_sessions || 3} جلسات أسبوعياً • {program.cardio?.session_duration_min || 30} دقيقة • {program.cardio?.target_heart_rate_zone || 'Zone 2'}
              </span>
            </div>
          </div>

          {/* Daily Habits Bar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px' }}>
            <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block', marginBottom: '8px' }}>المؤشرات والعادات اليومية:</strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>مدة جلسة الكارديو</span>
                <strong style={{ fontSize: '13px', color: '#0F172A' }}>{program.cardio?.session_duration_min || 30} دقيقة</strong>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>شرب الماء</span>
                <strong style={{ fontSize: '13px', color: '#0F172A' }}>{program.cardio?.daily_water_target_liters || 3.8} لتر</strong>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>ساعات النوم</span>
                <strong style={{ fontSize: '13px', color: '#0F172A' }}>{program.cardio?.sleep_target_hours || 8} ساعات</strong>
              </div>
            </div>
          </div>

          {/* Supplements (Coach Full Control: Add, Edit, Delete with Calories & Macros) */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong style={{ fontSize: '13px', color: '#0F172A' }}>المكملات الغذائية المعتمدة (بسعراتها):</strong>
              <button
                type="button"
                onClick={() => {
                  const supps = [...(program.cardio?.supplements || [])];
                  supps.push({ id: `supp-${Date.now()}`, name: '', dose: '', timing: '', cal: 0, p: 0, c: 0, f: 0, notes: '' });
                  setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: supps } }));
                }}
                style={{ padding: '4px 10px', borderRadius: '5px', background: '#0F172A', color: '#FFFFFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={12} /> إضافة مكمل
              </button>
            </div>

            {(!program.cardio?.supplements || program.cardio.supplements.length === 0) && (
              <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '6px', padding: '14px', textAlign: 'center', fontSize: '11.5px', color: '#94A3B8' }}>
                لا توجد مكملات معتمدة حالياً. اضغط "إضافة مكمل" لإدراج مكمل بسعراته.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {program.cardio?.supplements?.map((supp, sIdx) => (
                <div key={supp.id || sIdx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px' }}>
                  {/* Row 1: Name, Dose, Timing */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                    <input
                      type="text"
                      placeholder="اسم المكمل"
                      value={supp.name || ''}
                      onChange={(e) => {
                        const supps = [...program.cardio.supplements];
                        supps[sIdx] = { ...supps[sIdx], name: e.target.value };
                        setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: supps } }));
                      }}
                      style={{ height: '30px', borderRadius: '4px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', fontWeight: 700, outline: 'none', background: '#FFFFFF' }}
                    />
                    <input
                      type="text"
                      placeholder="الجرعة (مثال: 1 سكوب 30g)"
                      value={supp.dose || ''}
                      onChange={(e) => {
                        const supps = [...program.cardio.supplements];
                        supps[sIdx] = { ...supps[sIdx], dose: e.target.value };
                        setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: supps } }));
                      }}
                      style={{ height: '30px', borderRadius: '4px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', outline: 'none', background: '#FFFFFF' }}
                    />
                    <input
                      type="text"
                      placeholder="التوقيت (مثال: بعد التمرين)"
                      value={supp.timing || ''}
                      onChange={(e) => {
                        const supps = [...program.cardio.supplements];
                        supps[sIdx] = { ...supps[sIdx], timing: e.target.value };
                        setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: supps } }));
                      }}
                      style={{ height: '30px', borderRadius: '4px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11px', outline: 'none', background: '#FFFFFF' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const supps = program.cardio.supplements.filter((_, i) => i !== sIdx);
                        setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: supps } }));
                      }}
                      style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
                      title="حذف المكمل"
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {/* Row 2: Calories & Macros */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '9px', color: '#64748B', display: 'block' }}>سعرات (kcal)</span>
                      <input
                        type="number"
                        min="0"
                        value={supp.cal || 0}
                        onChange={(e) => {
                          const supps = [...program.cardio.supplements];
                          supps[sIdx] = { ...supps[sIdx], cal: Number(e.target.value) || 0 };
                          setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: supps } }));
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
                          const supps = [...program.cardio.supplements];
                          supps[sIdx] = { ...supps[sIdx], p: Number(e.target.value) || 0 };
                          setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: supps } }));
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
                          const supps = [...program.cardio.supplements];
                          supps[sIdx] = { ...supps[sIdx], c: Number(e.target.value) || 0 };
                          setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: supps } }));
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
                          const supps = [...program.cardio.supplements];
                          supps[sIdx] = { ...supps[sIdx], f: Number(e.target.value) || 0 };
                          setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: supps } }));
                        }}
                        style={{ width: '100%', height: '28px', borderRadius: '4px', border: '1px solid #CBD5E1', textAlign: 'center', fontSize: '12px', fontWeight: 700, outline: 'none', background: '#FFFFFF' }}
                      />
                    </div>
                  </div>
                  {/* Row 3: Optional note (e.g. "بديل لوجبة 3 لو مستعجل") */}
                  <input
                    type="text"
                    placeholder="ملاحظة اختيارية (مثال: بديل لوجبة بعد التمرين لو مستعجل)"
                    value={supp.notes || ''}
                    onChange={(e) => {
                      const supps = [...program.cardio.supplements];
                      supps[sIdx] = { ...supps[sIdx], notes: e.target.value };
                      setProgram(prev => ({ ...prev, cardio: { ...prev.cardio, supplements: supps } }));
                    }}
                    style={{ width: '100%', height: '28px', borderRadius: '4px', border: '1px solid #E2E8F0', padding: '0 8px', fontSize: '10.5px', color: '#64748B', outline: 'none', background: '#FFFFFF', marginTop: '6px', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>

            {/* Supplement Calories Total */}
            {program.cardio?.supplements?.length > 0 && (() => {
              const totCal = program.cardio.supplements.reduce((s, x) => s + (Number(x.cal) || 0), 0);
              const totP = program.cardio.supplements.reduce((s, x) => s + (Number(x.p) || 0), 0);
              const totC = program.cardio.supplements.reduce((s, x) => s + (Number(x.c) || 0), 0);
              const totF = program.cardio.supplements.reduce((s, x) => s + (Number(x.f) || 0), 0);
              if (totCal === 0 && totP === 0) return null;
              return (
                <div style={{ borderTop: '1px solid #E2E8F0', marginTop: '8px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                  <span style={{ color: '#64748B', fontWeight: 700 }}>إجمالي سعرات المكملات:</span>
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>
                    {totCal} kcal • بروتين: {totP}g • كارب: {totC}g • دهون: {totF}g
                  </span>
                </div>
              );
            })()}
          </div>

        </div>
      )}
    </>
  );
}
