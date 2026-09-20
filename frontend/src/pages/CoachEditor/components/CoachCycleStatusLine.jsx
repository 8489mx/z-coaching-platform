import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export function CoachCycleStatusLine({ trainingCycle }) {
  if (!trainingCycle) return null;

  const {
    cycle_number,
    total_weeks,
    current_week,
    ends_on,
    status,
    message_ar
  } = trainingCycle;

  if (!cycle_number && !total_weeks && !status) return null;

  const isActive = status === 'ACTIVE';
  const bulletColor = isActive ? '#94A3B8' : '#F59E0B';

  return (
    <div
      data-testid="coach-training-cycle-line"
      dir="rtl"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '7px 14px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 600,
        background: isActive ? '#F8FAFC' : '#FFFBEB',
        border: isActive ? '1px solid #E2E8F0' : '1px solid #FCD34D',
        color: isActive ? '#475569' : '#92400E',
        transition: 'all 0.15s ease',
        boxShadow: isActive ? 'none' : '0 1px 2px rgba(217, 119, 6, 0.08)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {isActive ? (
          <Clock size={14} color="#64748B" />
        ) : (
          <AlertTriangle size={14} color="#B45309" />
        )}
        <span>دورة {cycle_number}</span>
        <span style={{ color: bulletColor }}>•</span>
        <span>الأسبوع {current_week} من {total_weeks}</span>
        <span style={{ color: bulletColor }}>•</span>
        <span>تاريخ الانتهاء: {ends_on}</span>
        {!isActive && message_ar && (
          <>
            <span style={{ color: bulletColor }}>•</span>
            <span style={{ fontWeight: 700 }}>{message_ar}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default CoachCycleStatusLine;
