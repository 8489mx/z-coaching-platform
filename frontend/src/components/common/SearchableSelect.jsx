import React, { useState, useRef, useEffect, useMemo } from 'react';

import { arabicSearchMatch } from '../../utils/searchUtils';

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'اختر من القائمة...',
  searchPlaceholder = 'ابحث هنا...',
  disabled = false,
  className = '',
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const selectedOption = useMemo(() => {
    return options.find(opt => opt.value === value);
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    return options.filter(opt => {
      return (
        arabicSearchMatch(opt.label, searchTerm) ||
        arabicSearchMatch(opt.sublabel, searchTerm) ||
        arabicSearchMatch(opt.value, searchTerm)
      );
    });
  }, [options, searchTerm]);

  const handleSelect = (val) => {
    onChange?.(val);
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef} 
      className={`searchable-select-container position-relative ${className}`}
      style={{ minWidth: '160px', ...style }}
    >
      {/* Trigger Box */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            setIsOpen(prev => !prev);
          }
        }}
        className="form-control d-flex align-items-center justify-content-between text-start"
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: disabled ? '#f1f5f9' : '#ffffff',
          borderColor: isOpen ? '#1e144f' : '#e2e8f0',
          boxShadow: isOpen ? '0 0 0 3px rgba(30, 20, 79, 0.1)' : 'none',
          borderRadius: '10px',
          padding: '0.55rem 0.85rem',
          minHeight: '44px',
          fontWeight: '600',
          fontSize: '0.88rem',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
      >
        <span 
          className="text-truncate me-2"
          style={{ color: selectedOption ? '#1e293b' : '#94a3b8' }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <i 
          className={`ti ti-chevron-${isOpen ? 'up' : 'down'} text-muted flex-shrink-0`}
          style={{ fontSize: '0.9rem', transition: 'transform 0.2s ease' }}
        ></i>
      </div>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div
          className="position-absolute shadow-lg bg-white border"
          style={{
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1050,
            borderRadius: '12px',
            borderColor: '#e2e8f0',
            overflow: 'hidden',
            animation: 'z-fadeInUp 0.18s ease-out'
          }}
        >
          {/* Search Input Bar */}
          <div className="p-2 border-bottom bg-light">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0 pe-2" style={{ borderColor: '#cbd5e1' }}>
                <i className="ti ti-search text-muted" style={{ fontSize: '0.85rem' }}></i>
              </span>
              <input
                ref={searchInputRef}
                type="text"
                className="form-control border-start-0 ps-1"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsOpen(false);
                  if (e.key === 'Enter' && filteredOptions.length > 0) {
                    handleSelect(filteredOptions[0].value);
                  }
                }}
                style={{
                  fontSize: '0.82rem',
                  borderColor: '#cbd5e1',
                  boxShadow: 'none'
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="btn btn-sm btn-light border border-start-0"
                  onClick={() => setSearchTerm('')}
                  style={{ borderColor: '#cbd5e1' }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '4px'
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="text-center text-muted py-3" style={{ fontSize: '0.8rem' }}>
                لا توجد نتائج مطابقة لـ "{searchTerm}"
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className="d-flex align-items-center justify-content-between p-2 rounded-2"
                    style={{
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? '#1e144f' : '#334155',
                      background: isSelected ? 'linear-gradient(90deg, #f5f3ff 0%, #ede9fe 100%)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <i className="ti ti-check text-primary fw-bold" style={{ fontSize: '0.95rem' }}></i>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}