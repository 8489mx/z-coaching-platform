import React from 'react';
import { RotateCw } from 'lucide-react';

/**
 * One refresh control, in one place: the page header, beside the page's main action. The daily
 * dashboard put it there and called it "تحديث البيانات" with one icon; the intake screen put it
 * down in the table toolbar and called it "تحديث" with another. Same job, two names, two corners.
 */
export function RefreshButton({ onClick, loading = false, shortcut = null, title = 'تحديث البيانات من الخادم' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={shortcut ? `${title} [${shortcut}]` : title}
      style={{
        height: '36px',
        padding: '0 14px',
        fontSize: '12px',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        borderRadius: '8px',
        background: '#FFFFFF',
        color: '#1E293B',
        border: '1px solid #CBD5E1',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.background = '#F8FAFC';
          e.currentTarget.style.borderColor = '#94A3B8';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#FFFFFF';
        e.currentTarget.style.borderColor = '#CBD5E1';
      }}
    >
      <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
      <span>تحديث البيانات</span>
      {shortcut && (
        <span style={{ fontSize: '9px', opacity: 0.7, fontFamily: 'JetBrains Mono, monospace' }}>
          [{shortcut}]
        </span>
      )}
    </button>
  );
}

export default RefreshButton;
