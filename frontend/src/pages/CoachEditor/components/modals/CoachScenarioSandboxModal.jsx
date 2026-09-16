import React, { useState } from 'react';
import { X, Sliders, TrendingDown, TrendingUp, ShieldCheck, ShieldAlert, Dumbbell, Utensils, Check, ArrowRightLeft } from 'lucide-react';
import { simulateCoachScenario } from '../../../../utils/coachScenarioSimulator';

export function CoachScenarioSandboxModal({
  isOpen,
  onClose,
  program,
  currentSessions = [],
  onApplyScenario
}) {
  const [deltaCalories, setDeltaCalories] = useState(0);
  const [enableSessionMerge, setEnableSessionMerge] = useState(false);
  const [sessionIdx1, setSessionIdx1] = useState(0);
  const [sessionIdx2, setSessionIdx2] = useState(1);

  if (!isOpen) return null;

  const baseTargets = program?.nutrition?.targets || { calories: 2000, protein: 150, carbs: 200, fats: 60 };
  const clientWeight = Number(program?.client?.weight) || 75;
  const tdee = Number(program?.nutrition?.tdee) || Math.round(clientWeight * 31) || 2300;

  const simulation = simulateCoachScenario({
    baseTargets,
    clientBiometrics: {
      weightKg: clientWeight,
      tdee: tdee
    },
    deltaCalories,
    sessionMerge: enableSessionMerge && currentSessions.length >= 2 ? { sessionIndices: [sessionIdx1, sessionIdx2] } : null,
    currentSessions
  });

  const handleApply = () => {
    if (typeof onApplyScenario === 'function') {
      onApplyScenario({
        targets: simulation.suggested_macro_targets,
        deltaCalories
      });
    }
    onClose();
  };

  const isLoss = simulation.weight_velocity.weekly_direction === 'LOSS';
  const isGain = simulation.weight_velocity.weekly_direction === 'GAIN';
  const isSevereShrunk = simulation.deficit_volume_shield.status === 'SHRUNK_SEVERE';

  return (
    <div
      dir="rtl"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Cairo, sans-serif'
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#0F172A',
            color: '#FFFFFF',
            borderTopLeftRadius: '15px',
            borderTopRightRadius: '15px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38BDF8'
              }}
            >
              <Sliders size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                مُحاكي سيناريوهات التكييف الفسيولوجي (What-If Sandbox)
              </h2>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                محاكاة فورية لأثر تعديل السعرات ودمج الجلسات قبل اعتمادها رسمياً
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Section 1: Calorie Delta Slider */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A' }}>
                تجربة تعديل السعرات الحرارية اليومية:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748B' }}>الحالي: {baseTargets.calories || 2000} kcal</span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '8px',
                  background: deltaCalories < 0 ? '#FEE2E2' : (deltaCalories > 0 ? '#DCFCE7' : '#F1F5F9'),
                  color: deltaCalories < 0 ? '#DC2626' : (deltaCalories > 0 ? '#16A34A' : '#475569')
                }}>
                  {deltaCalories > 0 ? `+${deltaCalories}` : deltaCalories} kcal
                </span>
                <strong style={{ fontSize: '13px', color: '#0F172A', fontFamily: 'JetBrains Mono' }}>
                  = {simulation.scenario_inputs.projected_calories} kcal
                </strong>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="-600"
              max="600"
              step="50"
              value={deltaCalories}
              onChange={(e) => setDeltaCalories(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0F172A', cursor: 'pointer', height: '6px' }}
            />

            {/* Quick Increment Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', gap: '6px' }}>
              {[-400, -250, -100, 0, +100, +250, +400].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDeltaCalories(val)}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: deltaCalories === val ? '#0F172A' : '#FFFFFF',
                    color: deltaCalories === val ? '#FFFFFF' : '#0F172A',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {val > 0 ? `+${val}` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Physiological Trajectory Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            
            {/* KPI 1: Weight Loss Velocity */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                {isLoss ? <TrendingDown size={16} color="#16A34A" /> : (isGain ? <TrendingUp size={16} color="#0284C7" /> : <div style={{ width: 16 }} />)}
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>معدل التغير الأسبوعي التقديري</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginTop: '2px', fontFamily: 'JetBrains Mono' }}>
                {simulation.weight_velocity.formatted_text_ar}
              </div>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
                مبني على معدل الحرق اليومي TDEE ({tdee} kcal)
              </div>
            </div>

            {/* KPI 2: Deficit Volume Shield */}
            <div style={{
              background: isSevereShrunk ? '#FFF1F2' : '#FFFFFF',
              border: `1px solid ${isSevereShrunk ? '#FECDD3' : '#E2E8F0'}`,
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                {isSevereShrunk ? <ShieldAlert size={16} color="#E11D48" /> : <ShieldCheck size={16} color="#16A34A" />}
                <span style={{ fontSize: '11px', fontWeight: 700, color: isSevereShrunk ? '#9F1239' : '#64748B' }}>
                  درع سقف الاستشفاء (MRV Shield)
                </span>
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: isSevereShrunk ? '#BE123C' : '#0F172A', marginTop: '2px' }}>
                {simulation.deficit_volume_shield.title_ar}
              </div>
              <div style={{ fontSize: '10px', color: isSevereShrunk ? '#9F1239' : '#64748B', marginTop: '4px', lineHeight: 1.3 }}>
                {simulation.deficit_volume_shield.recommendation_ar}
              </div>
            </div>

            {/* KPI 3: Protein Sparing Target */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Utensils size={16} color="#D97706" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>التدريع البروتيني الوقائي</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginTop: '2px', fontFamily: 'JetBrains Mono' }}>
                {simulation.suggested_macro_targets.protein} جم بروتين ({simulation.suggested_macro_targets.protein_multiplier} جم/كجم)
              </div>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
                لحماية الكتلة العضلية من الهدم أثناء العجز
              </div>
            </div>

          </div>

          {/* Section 3: Suggested Macro Distribution */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '8px' }}>
              توزيع الماكروز المقترح لهذا السيناريو:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
                <span style={{ fontSize: '10.5px', color: '#64748B' }}>البروتين المستهدف</span>
                <strong style={{ display: 'block', fontSize: '14px', color: '#D97706', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
                  {simulation.suggested_macro_targets.protein} جم
                </strong>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
                <span style={{ fontSize: '10.5px', color: '#64748B' }}>الكاربوهيدرات</span>
                <strong style={{ display: 'block', fontSize: '14px', color: '#0284C7', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
                  {simulation.suggested_macro_targets.carbs} جم
                </strong>
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 10px', textAlign: 'center' }}>
                <span style={{ fontSize: '10.5px', color: '#64748B' }}>الدهون الصحية</span>
                <strong style={{ display: 'block', fontSize: '14px', color: '#16A34A', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
                  {simulation.suggested_macro_targets.fats} جم
                </strong>
              </div>
            </div>
          </div>

          {/* Section 4: Session Merge Simulator (Optional) */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Dumbbell size={16} color="#0F172A" />
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A' }}>
                  محاكي دمج الجلسات التدريبية (Session Merge):
                </span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', color: '#64748B' }}>
                <input
                  type="checkbox"
                  checked={enableSessionMerge}
                  onChange={(e) => setEnableSessionMerge(e.target.checked)}
                  style={{ borderRadius: '4px', accentColor: '#0F172A', cursor: 'pointer' }}
                />
                <span>تفعيل تجربة الدمج</span>
              </label>
            </div>

            {enableSessionMerge && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '4px' }}>الجلسة الأولى</label>
                    <select
                      value={sessionIdx1}
                      onChange={(e) => setSessionIdx1(Number(e.target.value))}
                      style={{ width: '100%', height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', color: '#0F172A', outline: 'none', background: '#FFFFFF' }}
                    >
                      {currentSessions.map((s, idx) => (
                        <option key={idx} value={idx}>{s.session_name || `جلسة ${idx + 1}`}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '4px' }}>الجلسة الثانية</label>
                    <select
                      value={sessionIdx2}
                      onChange={(e) => setSessionIdx2(Number(e.target.value))}
                      style={{ width: '100%', height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '11.5px', color: '#0F172A', outline: 'none', background: '#FFFFFF' }}
                    >
                      {currentSessions.map((s, idx) => (
                        <option key={idx} value={idx}>{s.session_name || `جلسة ${idx + 1}`}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {simulation.session_merger_simulation && (
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>إجمالي جولات الجلسة المدمجة: <strong style={{ color: '#0F172A' }}>{simulation.session_merger_simulation.total_working_sets} جولة</strong></span>
                      <span>الكثافة الجليكوجينية: <strong style={{ color: '#0F172A' }}>{simulation.session_merger_simulation.projected_glycogen_demand}</strong></span>
                    </div>
                    <div style={{ color: '#0284C7', fontWeight: 600 }}>
                      نسبة الكاربوهيدرات الموصى بها حول التمرين: {simulation.session_merger_simulation.peri_workout_carb_ratio_target} ({simulation.session_merger_simulation.peri_workout_carbs_grams} جم)
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>
                      {simulation.session_merger_simulation.clinical_guidance_ar}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#F8FAFC',
            borderBottomLeftRadius: '15px',
            borderBottomRightRadius: '15px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleApply}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Check size={14} />
            <span>اعتماد وتطبيق هذا السيناريو على الخطة</span>
          </button>
        </div>

      </div>
    </div>
  );
}
