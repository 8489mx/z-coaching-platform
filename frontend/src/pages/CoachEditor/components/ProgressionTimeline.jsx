import React from 'react';
import { EFFORT_LABELS_AR } from '../../../utils/progressionEngine';

const DECISION_LABELS_AR = {
  INCREASE_WEIGHT: 'زيادة وزن',
  ADD_REPS: 'زيادة عدات',
  HOLD_CONSOLIDATE: 'تثبيت',
  HOLD_RETRY: 'إعادة المحاولة',
  REDUCE_WEIGHT: 'تخفيض 10%',
  EXTEND_REPS_BEFORE_JUMP: 'عدات قبل القفزة',
  BODYWEIGHT_PROGRESS: 'وزن الجسم',
  DELOAD: 'ديلود',
  POST_DELOAD_RESET: 'بداية دورة',
};

/** Coach view of one exercise: last logged sessions, e1RM trend and the engine's next target. */
export default function ProgressionTimeline({ entry }) {
  if (!entry || !Array.isArray(entry.history) || entry.history.length === 0) {
    return (
      <div style={{ flexBasis: '100%', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
        لم يسجل المتدرب هذا التمرين بعد.
      </div>
    );
  }
  const recent = entry.history.slice(-6);
  const stalled = entry.stall_count >= 1;
  const dropping = entry.drop_streak >= 2;

  return (
    <div style={{ flexBasis: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }} dir="rtl">
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '11px', fontWeight: 800, color: '#0F172A' }}>
        <span>سجل التطور</span>
        {entry.best_e1rm && <span style={{ color: '#2563EB' }}>أفضل 1RM تقديري: {entry.best_e1rm} كجم</span>}
        {stalled && <span style={{ color: '#B45309', background: '#FEF3C7', padding: '1px 6px', borderRadius: '6px' }}>تعثر</span>}
        {dropping && <span style={{ color: '#B91C1C', background: '#FEE2E2', padding: '1px 6px', borderRadius: '6px' }}>تراجع أداء جلستين</span>}
      </div>
      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
        {recent.map((h, i) => (
          <div key={`${h.date}-${i}`} style={{ minWidth: '92px', background: h.is_deload ? '#EFF6FF' : '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '4px 6px', fontSize: '10.5px', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'JetBrains Mono, Cairo' }}>{h.weight_kg} × {h.last_set_reps}</div>
            <div style={{ color: '#64748B' }}>{new Date(h.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</div>
            <div style={{ color: '#475569' }}>{EFFORT_LABELS_AR[h.effort]?.split('،')[0] || h.effort}</div>
            <div style={{ color: '#2563EB', fontWeight: 700 }}>{DECISION_LABELS_AR[h.decision] || h.decision}</div>
          </div>
        ))}
      </div>
      {entry.target && (
        <div style={{ fontSize: '11px', color: '#0F172A', fontWeight: 700 }}>
          الهدف الجاي: {entry.target.weight_kg ? `${entry.target.weight_kg} كجم × ` : ''}{entry.target.rep_target} عدات
        </div>
      )}
    </div>
  );
}
