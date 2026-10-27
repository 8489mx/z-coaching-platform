import React from 'react';
import { RotateCw } from 'lucide-react';

/**
 * Universal refresh control - Hostinger hPanel secondary button style.
 */
export function RefreshButton({ onClick, loading = false, shortcut = null, title = 'تحديث البيانات من الخادم' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={shortcut ? `${title} [${shortcut}]` : title}
      style={{
        height: '34px',
        padding: '0 16px',
        fontSize: '12px',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        borderRadius: '16px',
        background: '#FFFFFF',
        color: '#344054',
        border: '1px solid #D0D5DD',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.background = '#F9FAFB';
          e.currentTarget.style.borderColor = '#D0D5DD';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#FFFFFF';
        e.currentTarget.style.borderColor = '#D0D5DD';
      }}
    >
      <RotateCw size={14} className={loading ? 'animate-spin' : ''} color="#475467" />
      <span>تحديث البيانات</span>
      
    </button>
  );
}

export default RefreshButton;
