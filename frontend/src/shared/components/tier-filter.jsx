import React from 'react';

/**
 * One package filter for the whole platform. Hostinger hPanel segmented control style.
 */
// مقصود: ثابت بجوار المكوّن. تحذير Fast Refresh في بيئة التطوير فقط ولا أثر له على الإنتاج.
// eslint-disable-next-line react/only-export-components
export const TIER_FILTER_OPTIONS = [
  { id: 'ALL', label: 'كل الباقات' },
  { id: 'MAX', label: 'باقة MAX' },
  { id: 'ELITE', label: 'باقة ELITE' },
];

export function TierFilter({ value = 'ALL', onChange, counts = null, fullWidth = false }) {
  return (
    <div
      dir="rtl"
      role="group"
      aria-label="فلترة حسب الباقة"
      style={{
        display: fullWidth ? 'flex' : 'inline-flex',
        width: fullWidth ? '100%' : 'auto',
        alignItems: 'center',
        justifyContent: fullWidth ? 'space-between' : 'flex-start',
        gap: '3px',
        background: '#F1F5F9',
        padding: '3px',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxSizing: 'border-box'
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
              flex: fullWidth ? 1 : 'initial',
              height: '28px',
              padding: fullWidth ? '0 8px' : '0 12px',
              fontSize: '11.5px',
              fontWeight: isSelected ? 800 : 600,
              color: isSelected ? '#101828' : '#64748B',
              background: isSelected ? '#FFFFFF' : 'transparent',
              border: 'none',
              borderRadius: '9px',
              cursor: 'pointer',
              boxShadow: isSelected ? '0 1px 3px rgba(16, 24, 40, 0.08)' : 'none',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{option.label}</span>
            {count !== undefined && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '9px',
                  background: isSelected ? '#F1F5F9' : '#E2E8F0',
                  color: isSelected ? '#101828' : '#64748B',
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
