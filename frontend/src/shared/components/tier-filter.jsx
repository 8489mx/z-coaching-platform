import React from 'react';

/**
 * One package filter for the whole platform. The same filter used to be drawn four different ways -
 * as two big cards on the subscribers page, as pills on the daily dashboard, and twice on the
 * financials page (once as clickable revenue lines, once as pills) - each with its own wording for
 * the same two packages. One control, one wording, one place on every screen.
 */
// مقصود: ثابت بجوار المكوّن. تحذير Fast Refresh في بيئة التطوير فقط ولا أثر له على الإنتاج.
// eslint-disable-next-line react/only-export-components
export const TIER_FILTER_OPTIONS = [
  { id: 'ALL', label: 'كل الباقات' },
  { id: 'MAX', label: 'باقة ماكس' },
  { id: 'ELITE', label: 'باقة إيليت' },
];

export function TierFilter({ value = 'ALL', onChange, counts = null }) {
  return (
    <div
      dir="rtl"
      role="group"
      aria-label="فلترة حسب الباقة"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: '#F1F5F9',
        padding: '3px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
      }}
    >
      {TIER_FILTER_OPTIONS.map((option) => {
        const isSelected = value === option.id;
        const count = counts ? counts[option.id] : undefined;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.id)}
            style={{
              height: '26px',
              padding: '0 9px',
              fontSize: '11px',
              fontWeight: isSelected ? 800 : 600,
              color: isSelected ? '#0F172A' : '#64748B',
              background: isSelected ? '#FFFFFF' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: isSelected ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{option.label}</span>
            {count !== undefined && (
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '0 4px',
                  borderRadius: '6px',
                  background: isSelected ? '#F1F5F9' : '#E2E8F0',
                  color: '#0F172A',
                  fontFamily: 'JetBrains Mono, Cairo, sans-serif',
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TierFilter;
