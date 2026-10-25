import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

/**
 * CoachCycleStatusLine - Hostinger hPanel curved luxury design system.
 */
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

  return (
    <div
      data-testid="coach-training-cycle-line"
      dir="rtl"
      style={{
        background: '#FFFFFF',
        border: '1px solid #EAECF0',
        borderRadius: '14px',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
        transition: 'all 0.15s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          background: isActive ? '#F0F9FF' : '#FFFAEB',
          color: isActive ? '#0284C7' : '#B54708',
          border: `1px solid ${isActive ? '#BAE6FD' : '#FEDF89'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {isActive ? <Clock size={14} /> : <AlertTriangle size={14} />}
        </div>

        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          padding: '2px 10px',
          borderRadius: '8px',
          background: '#F4F0FD',
          color: '#673DE6',
          border: '1px solid #EDE8FA'
        }}>
          دورة {cycle_number || 1}
        </span>

        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 10px',
          borderRadius: '8px',
          background: '#F2F4F7',
          color: '#344054',
          border: '1px solid #EAECF0'
        }}>
          الأسبوع {current_week || 1} من {total_weeks || 4}
        </span>

        {ends_on && (
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 10px',
            borderRadius: '8px',
            background: '#F2F4F7',
            color: '#475467',
            border: '1px solid #EAECF0'
          }}>
            تاريخ الانتهاء: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{ends_on}</span>
          </span>
        )}
      </div>

      {message_ar && (
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          padding: '3px 12px',
          borderRadius: '8px',
          background: isActive ? '#ECFDF3' : '#FFFAEB',
          color: isActive ? '#027A48' : '#B54708',
          border: `1px solid ${isActive ? '#A6F4C7' : '#FEDF89'}`
        }}>
          {message_ar}
        </span>
      )}
    </div>
  );
}

export default CoachCycleStatusLine;
