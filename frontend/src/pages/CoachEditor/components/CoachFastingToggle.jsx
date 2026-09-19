import React from 'react';

const OPTIONS = [
  { value: 'AUTO', label: 'تلقائي (حسب التقويم)' },
  { value: 'OFF', label: 'إيقاف الصيام' },
  { value: 'FORCE_ON', label: 'تفعيل يدوي' },
];

/**
 * Coach override for the religious fasting engine: AUTO follows the Hijri / Coptic calendar,
 * OFF cancels fasting for this client (illness, travel...), FORCE_ON applies it outside the calendar.
 */
export function CoachFastingToggle({ fastingContext, onChange, saving = false }) {
  const current = fastingContext?.override || 'AUTO';
  const religion = fastingContext?.religion;

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px', marginBottom: '14px' }} dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
        <strong style={{ fontSize: '0.88rem', color: '#0F172A', fontWeight: 800 }}>وضع الصيام الديني</strong>
        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: fastingContext?.active ? '#5B21B6' : '#64748B' }}>
          {fastingContext?.active ? `مفعل الآن: ${fastingContext.period_name_ar || ''}` : 'غير مفعل اليوم'}
        </span>
      </div>

      <div role="radiogroup" aria-label="وضع الصيام" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
                flex: '1 1 120px',
                padding: '8px 10px',
                borderRadius: '10px',
                border: selected ? '1px solid #7C3AED' : '1px solid #E2E8F0',
                background: selected ? '#F5F3FF' : '#F8FAFC',
                color: selected ? '#5B21B6' : '#334155',
                fontWeight: 700,
                fontSize: '0.76rem',
                cursor: saving || selected ? 'default' : 'pointer',
                opacity: saving && !selected ? 0.6 : 1,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <p style={{ margin: '10px 0 0', fontSize: '0.72rem', color: '#64748B', lineHeight: 1.7 }}>
        {fastingContext?.reason_ar || 'لم يتم تحميل حالة الصيام لهذا المتدرب بعد.'}
        {!religion && ' الديانة غير محددة في الاستمارة، فالوضع التلقائي لن يفعّل أي صيام.'}
      </p>
    </div>
  );
}
