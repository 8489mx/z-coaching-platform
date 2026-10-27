import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Unified Hostinger hPanel Search Input Component
 * Pure white background, subtle border, quiet focus halo, clean layout.
 */
export function TableSearch({
  value,
  onChange,
  inputRef = null,
  placeholder = 'بحث بالاسم، الكود، أو الهاتف...',
  width = '260px',
  showShortcut = true,
  shortcutText = '/',
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        alignItems: 'center',
        background: '#FFFFFF',
        border: '1px solid',
        borderColor: isFocused ? '#98A2B3' : '#D0D5DD',
        borderRadius: '12px',
        padding: '0 14px',
        height: '34px',
        width,
        maxWidth: '100%',
        minWidth: '180px',
        gap: '8px',
        boxShadow: isFocused ? '0 0 0 2px rgba(16, 24, 40, 0.05)' : '0 1px 2px rgba(16, 24, 40, 0.03)',
        transition: 'all 0.15s ease',
        boxSizing: 'border-box'
      }}
    >
      <Search size={14} color="#667085" style={{ flexShrink: 0 }} />
      <input
        ref={inputRef}
        type="text"
        className="table-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          boxShadow: 'none',
          borderRadius: 0,
          fontSize: '12.5px',
          fontWeight: 500,
          width: '100%',
          color: '#111827',
          fontFamily: "'Cairo', sans-serif",
          padding: 0,
          margin: 0
        }}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="مسح البحث"
          title="مسح البحث"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            color: '#98A2B3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'color 0.12s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#475467')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#98A2B3')}
        >
          <X size={13} />
        </button>
      ) : (
        showShortcut && (
          <span
            aria-hidden="true"
            style={{
              fontSize: '10px',
              fontWeight: 500,
              color: '#98A2B3',
              background: '#F8FAFC',
              border: '1px solid #EAECF0',
              borderRadius: '8px',
              padding: '1px 5px',
              fontFamily: 'JetBrains Mono, monospace',
              flexShrink: 0,
              userSelect: 'none'
            }}
          >
            {shortcutText}
          </span>
        )
      )}
    </div>
  );
}

export default TableSearch;
