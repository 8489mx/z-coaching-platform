import React from 'react';
import { Zap, ArrowRightLeft, FileText } from 'lucide-react';

export function CoachCardioHabitsTab({
  program,
  setCardioSwapModal,
  handleUpdateCardioParam,
  coachNotes,
  setCoachNotes
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} dir="rtl">
      
      {/* Engine Cardio & Recovery Reasoning Card */}
      {program.cardio?.reasoning && (
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#FAF5FF', border: '1px solid #E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333EA', flexShrink: 0 }}>
              <Zap size={14} />
            </div>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A' }}>بروتوكول الكارديو والاستشفاء ونمط الحياة</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                {typeof program.cardio.reasoning === 'string' ? program.cardio.reasoning : (program.cardio.reasoning?.rationale || 'بروتوكول كارديو Zone 2 لحرق الدهون وتحسين صحة القلب بدون إجهاد للمفاصل.')}
              </div>
            </div>
          </div>
          {program.cardio?.target_heart_rate_zone && (
            <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', whiteSpace: 'nowrap' }}>
              {program.cardio.target_heart_rate_zone}
            </span>
          )}
        </div>
      )}

      {/* Cardio Modality Card */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <strong style={{ fontSize: '13px', color: '#0F172A' }}>نظام وجهاز الكارديو:</strong>
          <button
            type="button"
            onClick={() => setCardioSwapModal(true)}
            style={{ padding: '4px 12px', borderRadius: '7px', background: '#0F172A', color: '#FFFFFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <ArrowRightLeft size={12} />
            <span>تبديل الجهاز / النمط</span>
          </button>
        </div>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <strong style={{ color: '#0F172A', fontSize: '12.5px' }}>{program.cardio?.modality || 'مشي على سير مائل (Incline Treadmill)'}</strong>
          
          {/* Cardio Volume Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', paddingTop: '6px', borderTop: '1px solid #E2E8F0' }}>
            <div>
              <label style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '2px', fontWeight: 600 }}>الجلسات أسبوعياً</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '7px', height: '28px', padding: '0 4px' }}>
                <button type="button" onClick={() => handleUpdateCardioParam('weekly_sessions', Math.max(1, (Number(program.cardio?.weekly_sessions) || 3) - 1))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 5px' }}>-</button>
                <span style={{ flex: 1, textAlign: 'center', fontSize: '11.5px', fontWeight: 700, color: '#0F172A' }}>{program.cardio?.weekly_sessions || 3} جلسات</span>
                <button type="button" onClick={() => handleUpdateCardioParam('weekly_sessions', (Number(program.cardio?.weekly_sessions) || 3) + 1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 5px' }}>+</button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '2px', fontWeight: 600 }}>مدة الجلسة (دقيقة)</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '7px', height: '28px', padding: '0 4px' }}>
                <button type="button" onClick={() => handleUpdateCardioParam('session_duration_min', Math.max(10, (Number(program.cardio?.session_duration_min) || 30) - 5))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 5px' }}>-</button>
                <span style={{ flex: 1, textAlign: 'center', fontSize: '11.5px', fontWeight: 700, color: '#0F172A' }}>{program.cardio?.session_duration_min || 30} دقيقة</span>
                <button type="button" onClick={() => handleUpdateCardioParam('session_duration_min', (Number(program.cardio?.session_duration_min) || 30) + 5)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, padding: '0 5px' }}>+</button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '2px', fontWeight: 600 }}>نطاق النبض المستهدف</label>
              <select
                value={program.cardio?.target_heart_rate_zone || 'Zone 2'}
                onChange={(e) => handleUpdateCardioParam('target_heart_rate_zone', e.target.value)}
                style={{ width: '100%', height: '28px', borderRadius: '7px', border: '1px solid #CBD5E1', padding: '0 6px', fontSize: '11px', fontWeight: 700, color: '#0F172A', background: '#FFFFFF', outline: 'none' }}
              >
                <option value="Zone 1">Zone 1 (استشفاء خفيف)</option>
                <option value="Zone 2">Zone 2 (حرق دهون وتحمل - موصى به)</option>
                <option value="Zone 3">Zone 3 (تحمل هوائي متوسط)</option>
                <option value="Zone 4 / HIIT">Zone 4 / HIIT (كثافة عالية)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Habits Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <strong style={{ fontSize: '13px', color: '#0F172A' }}>المؤشرات والعادات اليومية (NEAT & Hydration):</strong>
          <span style={{ fontSize: '10.5px', color: '#64748B' }}>انقر لتعديل الأرقام مباشرة</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {/* Steps */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px' }}>
            <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '4px' }}>الخطوات اليومية المستهدفة</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                step="500"
                min="3000"
                max="30000"
                value={program.cardio?.neat_target_steps || 8500}
                onChange={(e) => handleUpdateCardioParam('neat_target_steps', Number(e.target.value) || 8500)}
                style={{ width: '100%', height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '13px', fontWeight: 800, color: '#0F172A', outline: 'none', background: '#FFFFFF' }}
              />
              <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>خطوة</span>
            </div>
          </div>

          {/* Water */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px' }}>
            <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '4px' }}>شرب الماء اليومي</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                step="0.2"
                min="1"
                max="10"
                value={program.cardio?.daily_water_target_liters || 3.8}
                onChange={(e) => handleUpdateCardioParam('daily_water_target_liters', Number(e.target.value) || 3.8)}
                style={{ width: '100%', height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '13px', fontWeight: 800, color: '#0F172A', outline: 'none', background: '#FFFFFF' }}
              />
              <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>لتر</span>
            </div>
          </div>

          {/* Sleep */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px' }}>
            <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block', marginBottom: '4px' }}>ساعات النوم المستهدفة</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                step="0.5"
                min="4"
                max="12"
                value={program.cardio?.sleep_target_hours || 8}
                onChange={(e) => handleUpdateCardioParam('sleep_target_hours', Number(e.target.value) || 8)}
                style={{ width: '100%', height: '30px', borderRadius: '8px', border: '1px solid #CBD5E1', padding: '0 8px', fontSize: '13px', fontWeight: 800, color: '#0F172A', outline: 'none', background: '#FFFFFF' }}
              />
              <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>ساعات</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coach Directives & Final Plan Notes */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <FileText size={15} color="#0F172A" />
          <strong style={{ fontSize: '13px', color: '#0F172A' }}>ملاحظات وتوجيهات الكوتش الخاصة للمشترك:</strong>
        </div>
        <textarea
          rows={4}
          placeholder="اكتب التوجيهات الختامية والنصائح المخصصة للمشترك قبل اعتماد الخطة..."
          value={coachNotes}
          onChange={(e) => setCoachNotes(e.target.value)}
          style={{ width: '100%', borderRadius: '6px', border: '1px solid #CBD5E1', padding: '10px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'Cairo, sans-serif' }}
        />
      </div>

    </div>
  );
}
