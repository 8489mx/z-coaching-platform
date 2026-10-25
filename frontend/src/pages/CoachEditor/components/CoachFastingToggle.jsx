import React from 'react';

const OPTIONS = [
  { value: 'AUTO', label: 'تلقائي (حسب التقويم)' },
  { value: 'OFF', label: 'إيقاف الصيام' },
  { value: 'FORCE_ON', label: 'تفعيل يدوي' },
];

/**
 * Coach override for the religious fasting engine: AUTO follows the Hijri / Coptic calendar,
 * OFF cancels fasting for this client (illness, travel...), FORCE_ON applies it outside the calendar.
 * Compact, calm executive design to minimize visual overhead on nutrition screens.
 */
export function CoachFastingToggle({ fastingContext, onChange, saving = false }) {
  const current = fastingContext?.override || 'AUTO';
  const religion = fastingContext?.religion;

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #EAECF0',
        borderRadius: '12px',
        padding: '10px 16px',
        marginBottom: '10px',
        boxShadow: '0 1px 3px rgba(16, 24, 40, 0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}
      dir="rtl"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <strong style={{ fontSize: '12.5px', color: '#101828', fontWeight: 800 }}>وضع الصيام الديني</strong>
        <span style={{
          fontSize: '10.5px',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '6px',
          background: fastingContext?.active ? '#F4F0FD' : '#F2F4F7',
          color: fastingContext?.active ? '#673DE6' : '#475467',
          border: fastingContext?.active ? '1px solid #EDE8FA' : '1px solid #EAECF0'
        }}>
          {fastingContext?.active ? `مفعل: ${fastingContext.period_name_ar || ''}` : 'غير مفعل اليوم'}
        </span>
        <span style={{ fontSize: '11px', color: '#64748B' }}>
          {fastingContext?.reason_ar || (!religion ? 'الديانة غير محددة (التلقائي لن يفعّل أي صيام)' : '')}
        </span>
      </div>

      <div 
        role="radiogroup" 
        aria-label="وضع الصيام" 
        style={{ 
          display: 'inline-flex', 
          gap: '2px', 
          background: '#F1F5F9',
          border: '1px solid #EAECF0',
          borderRadius: '8px',
          padding: '2px',
          alignItems: 'center'
        }}
      >
        {OPTIONS.map((opt) => {
          const selected = current === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={saving || selected}
              onClick={() => onChange(opt.value)}
              style={{
                height: '28px',
                padding: '0 10px',
                borderRadius: '6px',
                border: selected ? '1px solid #673DE6' : '1px solid transparent',
                background: selected ? '#FFFFFF' : 'transparent',
                color: selected ? '#673DE6' : '#475467',
                fontWeight: selected ? 800 : 600,
                fontSize: '11.5px',
                cursor: saving || selected ? 'default' : 'pointer',
                opacity: saving && !selected ? 0.6 : 1,
                boxShadow: selected ? '0 1px 2px rgba(16, 24, 40, 0.08)' : 'none',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
