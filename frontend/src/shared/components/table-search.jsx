import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * One search box for every list the coach searches. Each screen used to draw its own - ten boxes in
 * four widths and four heights, and four different ways of saying the same shortcut inside the
 * placeholder itself: "(اضغط /)", "(اضغط / للتركيز)", "(اضغط / للبحث)..." and "[/]". The shortcut
 * is a key badge next to the field now, and the placeholder only says what is being searched.
 *
 * The page keeps its own state and its own ref, so its "/" shortcut and its filtering do not change.
 */
export function TableSearch({
  value,
  onChange,
  inputRef = null,
  placeholder = 'بحث بالاسم أو الكود أو الهاتف',
  width = '240px',
  showShortcut = true,
}) {
  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        alignItems: 'center',
        background: '#FFFFFF',
        border: '1px solid #CBD5E1',
        borderRadius: '8px',
        padding: '0 10px',
        height: '32px',
        width,
        minWidth: '170px',
        gap: '6px',
      }}
    >
      <Search size={13} color="#94A3B8" />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: '11.5px',
          width: '100%',
          color: '#0F172A',
          fontFamily: 'Cairo, sans-serif',
        }}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="مسح البحث"
          title="مسح البحث"
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8', display: 'flex', alignItems: 'center' }}
        >
          <X size={13} />
        </button>
      ) : (
        showShortcut && (
          <span
            aria-hidden="true"
            style={{
              fontSize: '9.5px',
              fontWeight: 800,
              color: '#94A3B8',
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '1px 5px',
              fontFamily: 'JetBrains Mono, monospace',
              flexShrink: 0,
            }}
          >
            /
          </span>
        )
      )}
    </div>
  );
}

export default TableSearch;
